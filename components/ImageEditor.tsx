"use client";

import { Download, ImageIcon, Upload, Wand2 } from "lucide-react";
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
    console.log("Subject detected, dimensions:", mask.width, "x", mask.height)

    // Store the mask
    setSubjectMask(mask)
    setActiveTab("effects")

    // Display the mask in the preview
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext("2d")
      if (ctx) {
        previewCanvasRef.current.width = mask.width
        previewCanvasRef.current.height = mask.height
        ctx.putImageData(mask, 0, 0)
        console.log("Mask preview displayed with dimensions:", mask.width, "x", mask.height)
      }
    }
  };

  const applyEffect = () => {};

  const handleDownload = () => {};

  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="detect" disabled={!originalImage}>
            Select Subject
          </TabsTrigger>
          <TabsTrigger value="effects" disabled={!subjectMask} >Apply Effects</TabsTrigger>
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
                    <Label className="mb-2 block">Effect Intensity: {effectIntensity}%</Label>
                    <Slider
                      value={[effectIntensity]}
                      onValueChange={(values) => setEffectIntensity(values[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <Button onClick={applyEffect} className="w-full" disabled={isProcessing}>
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
                        className="absolute bottom-2 right-2"
                        onClick={handleDownload}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">Apply an effect to see the preview</p>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <h4 className="text-sm font-medium mb-2">Subject Mask</h4>
                    <div className="aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                      {subjectMask && (
                        <>
                          <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain" />
                          <canvas ref={canvasRef} className="hidden" />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ImageEditor;
