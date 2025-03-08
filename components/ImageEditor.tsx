"use client";

import { ImageIcon, Upload } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { useState } from "react";
import SubjectDetector from "./SubjectDetector";

const ImageEditor = () => {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="grid gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="detect">Select Subject</TabsTrigger>
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
                <Button onClick={() => console.log("Cicked")} className="mb-2">
                  <Upload className="mr-2 h-4 w-4" />
                  Select Image
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detect" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <SubjectDetector />
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ImageEditor;
