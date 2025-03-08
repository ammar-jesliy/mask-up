import { useEffect, useRef, useState } from "react";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Eraser, Pencil, Redo, RefreshCw, Undo } from "lucide-react";

interface SubjectDetectorProps {
  imageUrl: string;
  onSubjectDetected: (mask: ImageData) => void;
}

const SubjectDetector = ({
  imageUrl,
  onSubjectDetected,
}: SubjectDetectorProps) => {
  const [detectionMethod, setDetectionMethod] = useState("");
  const [brushSize, setBrushSize] = useState(10);
  const [brushMode, setBrushMode] = useState<"draw" | "erase">("draw");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load the image and draw it on the canvas
  useEffect(() => {
    if (!canvasRef.current || !maskCanvasRef.current) {
      console.log("Canvas refs not available");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx) {
      console.log("Canvas context not available");
      return;
    }

    setIsLoading(true);
    console.log("Loading image: " + imageUrl.substring(0, 50) + "...");

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      console.log(
        `Image loaded, natural dimensions: ${img.naturalWidth}x${img.naturalHeight}`
      );

      // Set canvas dimensions to match image's natural dimensions exactly
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      maskCanvas.width = img.naturalWidth;
      maskCanvas.height = img.naturalHeight;
      console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);

      // Draw image on main canvas
      ctx.drawImage(img, 0, 0);
      console.log("Image drawn to canvas");

      // Initialize mask canvas with black (transparent) background
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      console.log("Mask canvas initialized");

      // Initialize history with empty mask
      const initialMask = maskCtx.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
      );
      setHistory([initialMask]);
      setHistoryIndex(0);
      console.log("History initialized");

      setIsLoading(false);
    };

    img.onerror = (error) => {
      console.log(`Error loading image: ${error}`);
      setIsLoading(false);
    };

    img.src = imageUrl;
    console.log("Image src set, waiting for load");
  }, [imageUrl]);

  const handleUndo = () => {
    // Implement undo functionality
  };

  const handleRedo = () => {
    // Implement redo functionality
  };

  const resetMask = () => {
    // Implement reset functionality
  };

  const startDrawing = () => {
    // Implement drawing functionality
  };

  const stopDrawing = () => {
    // Implement drawing functionality
  };

  const handleMouseMove = () => {
    // Implement drawing functionality
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Select Subject</h3>

      <Tabs value={detectionMethod} onValueChange={setDetectionMethod}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Selection</TabsTrigger>
          <TabsTrigger value="ai">AI Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <Label className="mb-2">Brush Size: {brushSize}px</Label>
              <Slider
                value={[brushSize]}
                onValueChange={(values) => setBrushSize(values[0])}
                min={5}
                max={50}
                step={1}
                className="w-32"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={brushMode === "draw" ? "default" : "outline"}
                size="sm"
                onClick={() => setBrushMode("draw")}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Draw
              </Button>
              <Button
                variant={brushMode === "erase" ? "default" : "outline"}
                size="sm"
                onClick={() => setBrushMode("erase")}
              >
                <Eraser className="h-4 w-4 mr-1" />
                Erase
              </Button>
            </div>

            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="h-4 w-4 mr-1" />
                Redo
              </Button>
              <Button variant="outline" size="sm" onClick={resetMask}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Draw over the subject you want to keep. The white area will be
            preserved.
          </p>
        </TabsContent>
      </Tabs>

      <div className="relative border rounded-lg overflow-hidden">
        <div
          className="relative"
          style={{ width: "100%", position: "relative" }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{
              display: "block",
              maxHeight: "400px",
              objectFit: "contain",
            }}
          />
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 opacity-50"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={handleMouseMove}
            onMouseLeave={stopDrawing}
          />
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white p-4 rounded-md shadow-md">
              {statusMessage || "Processing..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetector;
