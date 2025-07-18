import { useRef, useCallback, useState } from "react";
import { Camera, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCamera } from "@/hooks/use-camera";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const {
    videoRef,
    isStreaming,
    error,
    startCamera,
    stopCamera,
    captureImage
  } = useCamera();

  const handleCapture = useCallback(() => {
    const imageData = captureImage();
    if (imageData) {
      setCapturedImage(imageData);
    }
  }, [captureImage]);

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      stopCamera();
    }
  };

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 mb-4">Camera access denied or unavailable</p>
          <p className="text-sm text-gray-600">
            Please allow camera access in your browser settings and try again.
          </p>
          <Button
            onClick={startCamera}
            className="mt-4 bg-[#1976D2] text-white hover:bg-blue-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="text-center">
        <img
          src={capturedImage}
          alt="Captured"
          className="w-full max-w-sm mx-auto rounded-lg mb-4"
        />
        <div className="flex space-x-3 justify-center">
          <Button
            variant="outline"
            onClick={handleRetake}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-[#4CAF50] text-white hover:bg-green-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Use This Photo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-sm mx-auto"
          style={{ transform: "scaleX(-1)" }} // Mirror the video
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>

      <div className="space-y-3">
        {!isStreaming ? (
          <Button
            onClick={startCamera}
            className="bg-[#1976D2] text-white hover:bg-blue-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={handleCapture}
            className="bg-[#4CAF50] text-white hover:bg-green-600"
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Position the ID card within the camera frame and tap capture
      </p>
    </div>
  );
}
