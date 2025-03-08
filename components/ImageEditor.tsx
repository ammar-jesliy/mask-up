"use client";

import { ImageIcon, Upload } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { useRef, useState } from "react";
import SubjectDetector from "./SubjectDetector";

const ImageEditor = () => {
  const [activeTab, setActiveTab] = useState("upload");
  const [originalImage, setOriginalImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    console.log("Subject detected");
  };

  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="detect" disabled={!originalImage}>
            Select Subject
          </TabsTrigger>
          <TabsTrigger value="effects">Apply Effects</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default ImageEditor;
