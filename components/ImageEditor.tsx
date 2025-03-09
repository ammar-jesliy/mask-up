"use client";

import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Download,
  ImageIcon,
  Upload,
  Wand2,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { useRef, useState } from "react";
import SubjectDetector from "./SubjectDetector";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";

const ImageEditor = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [subjectMask, setSubjectMask] = useState<ImageData | null>(null);
  const [selectedEffect, setSelectedEffect] = useState("blur");
  const [effectIntensity, setEffectIntensity] = useState(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [motionBlurDirection, setMotionBlurDirection] = useState("horizontal");
  const [colorizeColor, setColorizeColor] = useState("#6432c8"); // Default purple color

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert the file to a data URL in base64 format
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setOriginalImage(imageDataUrl);
      setActiveTab("detect");
    };
    reader.readAsDataURL(file);
  };

  const handleSubjectDetected = (mask: ImageData) => {
    console.log("Subject detected, dimensions:", mask.width, "x", mask.height);

    // Store the mask
    setSubjectMask(mask);
    setActiveTab("effects");

    // Display the mask in the preview
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d");
      if (ctx) {
        previewCanvasRef.current.width = mask.width;
        previewCanvasRef.current.height = mask.height;
        ctx.putImageData(mask, 0, 0);
        console.log(
          "Mask preview displayed with dimensions:",
          mask.width,
          "x",
          mask.height
        );
      }
    }
  };

  const applyEffect = () => {
    if (!originalImage || !subjectMask || !canvasRef.current) return;

    setIsProcessing(true);
    console.log(
      "Applying effect:",
      selectedEffect,
      "with intensity:",
      effectIntensity
    );
    console.log(
      "Subject mask dimensions:",
      subjectMask.width,
      "x",
      subjectMask.height
    );

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      console.log("Canvas dimensions set to:", img.width, "x", img.height);

      // Draw original image
      ctx.drawImage(img, 0, 0);
      console.log("Original image drawn to canvas");

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      console.log(
        "Image data dimensions:",
        imageData.width,
        "x",
        imageData.height
      );

      // Check if mask and image dimensions match
      if (
        subjectMask.width !== imageData.width ||
        subjectMask.height !== imageData.height
      ) {
        console.warn(
          "Mask dimensions don't match image dimensions. Mask:",
          subjectMask.width,
          "x",
          subjectMask.height,
          "Image:",
          imageData.width,
          "x",
          imageData.height
        );
      }

      // Apply the selected effect to the background (non-subject areas)
      applyEffectToBackground(
        imageData,
        subjectMask,
        selectedEffect,
        effectIntensity / 100
      );

      // Put the processed image data back on canvas
      ctx.putImageData(imageData, 0, 0);
      console.log("Effect applied and drawn to canvas");

      // Update the processed image state
      setProcessedImage(canvas.toDataURL("image/png"));
      setIsProcessing(false);
    };
    img.onerror = (error) => {
      console.error("Error loading image for effect:", error);
      setIsProcessing(false);
    };
    img.src = originalImage;
  };

  const applyEffectToBackground = (
    imageData: ImageData,
    mask: ImageData,
    effect: string,
    intensity: number
  ) => {
    console.log("Applying", effect, "to background with intensity", intensity);
    const data = imageData.data;
    const maskData = mask.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create temporary arrays for more complex effects
    const tempR = new Uint8ClampedArray(width * height);
    const tempG = new Uint8ClampedArray(width * height);
    const tempB = new Uint8ClampedArray(width * height);

    // First pass: store original values
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        tempR[y * width + x] = data[i];
        tempG[y * width + x] = data[i + 1];
        tempB[y * width + x] = data[i + 2];
      }
    }

    // Second pass: apply effects
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;

        // If mask pixel is not white (subject), apply effect
        // White (255,255,255) indicates the subject
        if (
          maskData[i] < 200 ||
          maskData[i + 1] < 200 ||
          maskData[i + 2] < 200
        ) {
          switch (effect) {
            case "blur":
              // Gaussian-like blur
              let sumR = 0,
                sumG = 0,
                sumB = 0,
                count = 0;
              const blurRadius = Math.max(1, Math.floor(5 * intensity));

              for (let ky = -blurRadius; ky <= blurRadius; ky++) {
                for (let kx = -blurRadius; kx <= blurRadius; kx++) {
                  const nx = x + kx;
                  const ny = y + ky;

                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    sumR += tempR[ny * width + nx];
                    sumG += tempG[ny * width + nx];
                    sumB += tempB[ny * width + nx];
                    count++;
                  }
                }
              }

              if (count > 0) {
                data[i] =
                  data[i] * (1 - intensity) + (sumR / count) * intensity;
                data[i + 1] =
                  data[i + 1] * (1 - intensity) + (sumG / count) * intensity;
                data[i + 2] =
                  data[i + 2] * (1 - intensity) + (sumB / count) * intensity;
              }
              break;

            case "motionBlur":
              // Motion blur in selected direction
              let motionSumR = 0,
                motionSumG = 0,
                motionSumB = 0,
                motionCount = 0;
              const motionLength = Math.max(1, Math.floor(15 * intensity));

              // Sample in the selected direction
              for (let k = -motionLength; k <= motionLength; k++) {
                let nx = x,
                  ny = y;

                switch (motionBlurDirection) {
                  case "horizontal":
                    nx = x + k;
                    break;
                  case "vertical":
                    ny = y + k;
                    break;
                  case "diagonal1": // top-right to bottom-left
                    nx = x + k;
                    ny = y - k;
                    break;
                  case "diagonal2": // top-left to bottom-right
                    nx = x + k;
                    ny = y + k;
                    break;
                }

                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  motionSumR += tempR[ny * width + nx];
                  motionSumG += tempG[ny * width + nx];
                  motionSumB += tempB[ny * width + nx];
                  motionCount++;
                }
              }

              if (motionCount > 0) {
                data[i] =
                  data[i] * (1 - intensity) +
                  (motionSumR / motionCount) * intensity;
                data[i + 1] =
                  data[i + 1] * (1 - intensity) +
                  (motionSumG / motionCount) * intensity;
                data[i + 2] =
                  data[i + 2] * (1 - intensity) +
                  (motionSumB / motionCount) * intensity;
              }
              break;

            case "pixelate":
              // Pixelation effect
              const blockSize = Math.max(2, Math.floor(20 * intensity));
              const blockX = Math.floor(x / blockSize) * blockSize;
              const blockY = Math.floor(y / blockSize) * blockSize;

              if (blockX < width && blockY < height) {
                data[i] = tempR[blockY * width + blockX];
                data[i + 1] = tempG[blockY * width + blockX];
                data[i + 2] = tempB[blockY * width + blockX];
              }
              break;

            case "colorize":
              // Convert hex color to RGB
              const hexColor = colorizeColor.replace("#", "");
              const r = parseInt(hexColor.substring(0, 2), 16) * intensity;
              const g = parseInt(hexColor.substring(2, 4), 16) * intensity;
              const b = parseInt(hexColor.substring(4, 6), 16) * intensity;

              data[i] = data[i] * (1 - intensity) + r;
              data[i + 1] = data[i + 1] * (1 - intensity) + g;
              data[i + 2] = data[i + 2] * (1 - intensity) + b;
              break;

            case "invert":
              // Invert colors
              data[i] = 255 - data[i] * intensity - data[i] * (1 - intensity);
              data[i + 1] =
                255 - data[i + 1] * intensity - data[i + 1] * (1 - intensity);
              data[i + 2] =
                255 - data[i + 2] * intensity - data[i + 2] * (1 - intensity);
              break;

            case "grayscale":
              // Convert to grayscale
              const gray =
                data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
              data[i] = data[i] * (1 - intensity) + gray * intensity;
              data[i + 1] = data[i + 1] * (1 - intensity) + gray * intensity;
              data[i + 2] = data[i + 2] * (1 - intensity) + gray * intensity;
              break;
          }
        }
      }
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    link.href = processedImage;
    link.download = "processed-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="detect" disabled={!originalImage}>
            Select Subject
          </TabsTrigger>
          <TabsTrigger value="effects" disabled={!subjectMask}>
            Apply Effects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload an image</h3>
                <p className="text-sm text-gray-500 mb-4">
                  PNG, JPG or GIF, up to 10MB
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Select Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detect" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {originalImage && (
                <SubjectDetector
                  imageUrl={originalImage}
                  onSubjectDetected={handleSubjectDetected}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Effect Controls</h3>

                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block">Effect Type</Label>
                    <RadioGroup
                      value={selectedEffect}
                      onValueChange={setSelectedEffect}
                      className="grid grid-cols-2 gap-2"
                    >
                      <Label
                        htmlFor="blur"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="blur" id="blur" />
                        <span>Blur</span>
                      </Label>
                      <Label
                        htmlFor="motionBlur"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="motionBlur" id="motionBlur" />
                        <span>Motion Blur</span>
                      </Label>
                      <Label
                        htmlFor="pixelate"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="pixelate" id="pixelate" />
                        <span>Pixelate</span>
                      </Label>
                      <Label
                        htmlFor="colorize"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="colorize" id="colorize" />
                        <span>Colorize</span>
                      </Label>
                      <Label
                        htmlFor="invert"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="invert" id="invert" />
                        <span>Invert</span>
                      </Label>
                      <Label
                        htmlFor="grayscale"
                        className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <RadioGroupItem value="grayscale" id="grayscale" />
                        <span>Grayscale</span>
                      </Label>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Effect Intensity: {effectIntensity}%
                    </Label>
                    <Slider
                      value={[effectIntensity]}
                      onValueChange={(values) => setEffectIntensity(values[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {selectedEffect === "colorize" && (
                    <div>
                      <Label className="mb-2 block">Color</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={colorizeColor}
                          onChange={(e) => setColorizeColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <span className="text-sm">{colorizeColor}</span>
                      </div>
                    </div>
                  )}

                  {selectedEffect === "motionBlur" && (
                    <div>
                      <Label className="mb-2 block">Motion Direction</Label>
                      <RadioGroup
                        value={motionBlurDirection}
                        onValueChange={setMotionBlurDirection}
                        className="grid grid-cols-2 gap-2"
                      >
                        <Label
                          htmlFor="horizontal"
                          className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <RadioGroupItem value="horizontal" id="horizontal" />
                          <span>Horizontal</span>
                          <ArrowRight className="mr-2 h-4 w-4" />
                        </Label>
                        <Label
                          htmlFor="vertical"
                          className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <RadioGroupItem value="vertical" id="vertical" />
                          <span>Vertical</span>
                          <ArrowDown className="mr-2 h-4 w-4" />
                        </Label>
                        <Label
                          htmlFor="diagonal1"
                          className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <RadioGroupItem value="diagonal1" id="diagonal1" />
                          <span>Diagonal</span>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                        </Label>
                        <Label
                          htmlFor="diagonal2"
                          className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <RadioGroupItem value="diagonal2" id="diagonal2" />
                          <span>Diagonal</span>
                          <ArrowDownRight className="mr-2 h-4 w-4" />
                        </Label>
                      </RadioGroup>
                    </div>
                  )}

                  <Button
                    onClick={applyEffect}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isProcessing ? "Processing..." : "Apply Effect"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Preview</h3>
                <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                  {processedImage ? (
                    <>
                      <img
                        src={processedImage || "/placeholder.svg"}
                        alt="Processed"
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2 cursor-pointer"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Apply an effect to see the preview
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                <div>
                  <h4 className="text-sm font-medium mb-2">Original</h4>
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                    {originalImage && (
                      <img
                        src={originalImage || "/placeholder.svg"}
                        alt="Original"
                        className="max-w-full max-h-full object-contain"
                        style={{ maxHeight: "100%", maxWidth: "100%" }}
                      />
                    )}
                  </div>
                </div>
                <canvas ref={previewCanvasRef} className="hidden" />
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageEditor;
