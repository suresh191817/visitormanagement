import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Camera, Loader } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertVisitorSchema, type InsertVisitor } from "@shared/schema";
import CameraCapture from "@/components/camera-capture";
import { extractIDCardText, type ExtractedIDData } from "@/lib/ocr";

interface VisitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VisitorModal({ open, onOpenChange }: VisitorModalProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVisitor>({
    resolver: zodResolver(insertVisitorSchema),
    defaultValues: {
      name: "",
      idNumber: "",
      city: "",
      address: "",
      company: "",
      phone: "",
      status: "IN",
    },
  });

  const createVisitorMutation = useMutation({
    mutationFn: async (data: InsertVisitor) => {
      return apiRequest("/api/visitors", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Visitor registered successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/visitors/inside"] });
      form.reset();
      setCapturedImage(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Visitor registration error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to register visitor",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertVisitor) => {
    createVisitorMutation.mutate({
      ...data,
      idImageUrl: capturedImage || undefined,
    });
  };

  const handleImageCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setShowCamera(false);
    setIsProcessingOCR(true);

    try {
      toast({
        title: "Processing ID Card",
        description: "Extracting information from the image...",
      });

      const extractedData = await extractIDCardText(imageData);
      
      // Fill form fields with extracted data
      if (extractedData.name) {
        form.setValue("name", extractedData.name);
      }
      if (extractedData.idNumber) {
        form.setValue("idNumber", extractedData.idNumber);
      }
      if (extractedData.address) {
        form.setValue("address", extractedData.address);
      }
      if (extractedData.city) {
        form.setValue("city", extractedData.city);
      }

      toast({
        title: "Text Extracted",
        description: "Please review and correct the extracted information.",
      });
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Could not extract text from image. Please fill the form manually.",
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
              <h2 className="text-xl font-semibold">Capture ID Card</h2>
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
                <h2 className="text-xl font-semibold text-gray-900">New Visitor Entry</h2>
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
                    <p className="text-blue-700 mb-2">Processing ID Card</p>
                    <p className="text-sm text-blue-600">Extracting text information...</p>
                  </div>
                ) : capturedImage ? (
                  <div>
                    <img
                      src={capturedImage}
                      alt="Captured ID"
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
                    <p className="text-gray-600 mb-4">Capture ID Card</p>
                    <p className="text-xs text-gray-500 mb-4">Text will be automatically extracted</p>
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
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    {...form.register("name")}
                    className="mt-1"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="idNumber">ID Number *</Label>
                  <Input
                    id="idNumber"
                    placeholder="Enter ID number"
                    {...form.register("idNumber")}
                    className="mt-1"
                  />
                  {form.formState.errors.idNumber && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.idNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="Enter city"
                    {...form.register("city")}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter full address"
                    {...form.register("address")}
                    className="mt-1 h-20"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company/Purpose</Label>
                  <Input
                    id="company"
                    placeholder="Company or visit purpose"
                    {...form.register("company")}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
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
                    disabled={createVisitorMutation.isPending}
                  >
                    {createVisitorMutation.isPending ? "Registering..." : "Register Entry"}
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
