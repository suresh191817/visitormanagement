import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Camera, Loader } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertVehicleSchema, type InsertVehicle } from "@shared/schema";
import CameraCapture from "@/components/camera-capture";
import { extractLicensePlate } from "@/lib/ocr";

interface VehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VehicleModal({ open, onOpenChange }: VehicleModalProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVehicle>({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      plateNumber: "",
      ownerName: "",
      type: "",
      color: "",
      phone: "",
      status: "IN",
    },
  });

  const createVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      return apiRequest("/api/vehicles", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle registered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/inside"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Vehicle registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register vehicle",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertVehicle) => {
    createVehicleMutation.mutate({
      ...data,
      plateNumber: data.plateNumber.toUpperCase(),
    });
  };

  const handleImageCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    setIsProcessingOCR(true);

    try {
      toast({
        title: "Processing License Plate",
        description: "Extracting plate number from the image...",
      });

      const extractedData = await extractLicensePlate(imageData);
      
      if (extractedData.plateNumber) {
        form.setValue("plateNumber", extractedData.plateNumber);
        toast({
          title: "Plate Number Extracted",
          description: `Found: ${extractedData.plateNumber}. Please verify and correct if needed.`,
        });
      } else {
        toast({
          title: "No Plate Number Found",
          description: "Please enter the plate number manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Could not extract plate number. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingOCR(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {showCamera ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Capture License Plate</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCamera(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CameraCapture onCapture={handleImageCapture} />
          </div>
        ) : (
          <>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">New Vehicle Entry</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Camera Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="text-center">
                {isProcessingOCR ? (
                  <div className="bg-blue-50 rounded-lg p-8 mb-4 border border-blue-200">
                    <Loader className="h-10 w-10 text-blue-500 mb-4 mx-auto animate-spin" />
                    <p className="text-blue-700 mb-2">Processing License Plate</p>
                    <p className="text-sm text-blue-600">Extracting plate number...</p>
                  </div>
                ) : capturedImage ? (
                  <div>
                    <img
                      src={capturedImage}
                      alt="Captured License Plate"
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCamera(true)}
                    >
                      Retake Photo
                    </Button>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-lg p-8 mb-4 border-2 border-dashed border-gray-300">
                    <Camera className="h-10 w-10 text-gray-400 mb-4 mx-auto" />
                    <p className="text-gray-600 mb-4">Capture License Plate</p>
                    <p className="text-xs text-gray-500 mb-4">Plate number will be automatically extracted</p>
                    <Button
                      className="bg-[#1976D2] text-white hover:bg-blue-700"
                      onClick={() => setShowCamera(true)}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="plateNumber">License Plate Number *</Label>
                  <Input
                    id="plateNumber"
                    placeholder="ABC-1234"
                    {...form.register("plateNumber")}
                    className="mt-1 text-center text-lg font-mono uppercase"
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                      form.setValue("plateNumber", e.target.value);
                    }}
                  />
                  {form.formState.errors.plateNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.plateNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ownerName">Vehicle Owner *</Label>
                  <Input
                    id="ownerName"
                    placeholder="Enter owner name"
                    {...form.register("ownerName")}
                    className="mt-1"
                  />
                  {form.formState.errors.ownerName && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.ownerName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="type">Vehicle Type</Label>
                  <Select
                    value={form.watch("type") || ""}
                    onValueChange={(value) => form.setValue("type", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="van">Van</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color">Vehicle Color</Label>
                  <Input
                    id="color"
                    placeholder="Enter vehicle color"
                    {...form.register("color")}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Driver Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter phone number"
                    {...form.register("phone")}
                    className="mt-1"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[#4CAF50] text-white hover:bg-green-600"
                    disabled={createVehicleMutation.isPending}
                  >
                    {createVehicleMutation.isPending ? "Registering..." : "Register Entry"}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
