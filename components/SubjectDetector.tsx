import { useEffect, useRef, useState } from "react";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Button } from "./ui/button";
import { Eraser, Pencil, Redo, RefreshCw, Undo, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

// Lazy load TensorFlow.js and BodyPix only when needed
const loadTensorFlowAndBodyPix = async () => {
  try {
    const tf = await import("@tensorflow/tfjs");
    await import("@tensorflow/tfjs-backend-webgl");
    const bodyPix = await import("@tensorflow-models/body-pix");

    // Initialize TensorFlow
    await tf.setBackend("webgl");

    return { tf, bodyPix };
  } catch (error) {
    console.error("Failed to load TensorFlow or BodyPix:", error);
    throw error;
  }
};

interface SubjectDetectorProps {
  imageUrl: string;
  onSubjectDetected: (mask: ImageData) => void;
}

const SubjectDetector = ({
  imageUrl,
  onSubjectDetected,
}: SubjectDetectorProps) => {
  const [detectionMethod, setDetectionMethod] = useState("manual");
  const [brushSize, setBrushSize] = useState(10);
  const [brushMode, setBrushMode] = useState<"draw" | "erase">("draw");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [aiModelError, setAiModelError] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [aiModelLoaded, setAiModelLoaded] = useState(false);
  const [segmentationThreshold, setSegmentationThreshold] = useState(0.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const modelRef = useRef<any>(null);
  const tfRef = useRef<any>(null);

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

  // Handle undo functionality
  const handleUndo = () => {
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    console.log(`Undoing to history index ${newIndex}`);
    setHistoryIndex(newIndex);

    if (!maskCanvasRef.current) return;
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    maskCtx.putImageData(history[newIndex], 0, 0);
  };

  // Handle redo functionality
  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    console.log(`Redoing to history index ${newIndex}`);
    setHistoryIndex(newIndex);

    if (!maskCanvasRef.current) return;
    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    maskCtx.putImageData(history[newIndex], 0, 0);
  };

  // Reset mask to black
  const resetMask = () => {
    console.log("Resetting mask");
    if (!maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");

    if (!maskCtx) return;

    // Fill with black
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Save to history
    const newMask = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );
    setHistory([...history, newMask]);
    setHistoryIndex(history.length);
    console.log("Mask reset and saved to history");
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!maskCanvasRef.current || !canvasRef.current) return;
    console.log("Started drawing");
    isDrawingRef.current = true;

    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factor between the displayed size and the actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    console.log(
      `Drawing at position: ${x}, ${y} with scale factors: ${scaleX}, ${scaleY}`
    );

    lastPointRef.current = { x, y };
    draw(x, y);
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      console.log("Stopped drawing");
      saveToHistory();
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !maskCanvasRef.current || !canvasRef.current)
      return;

    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factor between the displayed size and the actual canvas size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    draw(x, y);
  };

  const saveToHistory = () => {
    console.log("Saving current state to history");
    if (!maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return;

    const currentState = maskCtx.getImageData(
      0,
      0,
      maskCanvas.width,
      maskCanvas.height
    );

    // If we're not at the end of the history, remove future states
    const newHistory = history.slice(0, historyIndex + 1);

    // Add current state to history
    newHistory.push(currentState);

    // Update history state
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    console.log(
      `History updated, now at index ${newHistory.length - 1} of ${
        newHistory.length - 1
      }`
    );
  };

  const draw = (x: number, y: number) => {
    if (!isDrawingRef.current || !maskCanvasRef.current) return;

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw a line from the last point to the current point
    if (lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushSize * 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = brushMode === "draw" ? "white" : "black";
      ctx.stroke();
    }

    // Also draw a circle at the current point for better coverage
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fillStyle = brushMode === "draw" ? "white" : "black";
    ctx.fill();

    lastPointRef.current = { x, y };
  };

  const detectSubjectAI = async () => {
    console.log("Starting AI detection");
    if (!canvasRef.current || !maskCanvasRef.current) {
      console.log("Canvas refs not available for AI detection");
      return;
    }

    if (!aiModelLoaded) {
      console.log("AI model not loaded, attempting to load now");
      try {
        await loadAIModel();
      } catch (error) {
        console.log("Failed to load AI model, aborting detection");
        return;
      }
    }

    if (!modelRef.current) {
      console.log("Model reference not available, aborting detection");
      return;
    }

    setIsLoading(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx) {
      console.log("Canvas context not available for AI detection");
      setIsLoading(false);
      return;
    }

    console.log("Starting AI segmentation");

    // Add a timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Segmentation timed out")), 30000); // 30 second timeout
    });

    try {
      // Create an image element for processing
      console.log("Preparing image for processing");
      const img = new Image();
      img.crossOrigin = "anonymous";

      // Wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = canvas.toDataURL();
      });

      console.log("Image loaded, dimensions: " + img.width + "x" + img.height);

      // Resize the image if it's too large
      let processImg = img;
      const MAX_DIMENSION = 500;

      if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        console.log(
          `Image is large (${img.width}x${img.height}), resizing for processing`
        );

        // Create a temporary canvas for the resized image
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        if (!tempCtx) {
          throw new Error("Could not get context for temporary canvas");
        }

        // Calculate new dimensions
        let newWidth = img.width;
        let newHeight = img.height;

        if (img.width > img.height) {
          newWidth = MAX_DIMENSION;
          newHeight = Math.floor(img.height * (MAX_DIMENSION / img.width));
        } else {
          newHeight = MAX_DIMENSION;
          newWidth = Math.floor(img.width * (MAX_DIMENSION / img.height));
        }

        // Set dimensions and draw resized image
        tempCanvas.width = newWidth;
        tempCanvas.height = newHeight;
        tempCtx.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          0,
          0,
          newWidth,
          newHeight
        );

        // Create a new image from the resized canvas
        const resizedImg = new Image();
        resizedImg.src = tempCanvas.toDataURL();

        // Wait for the resized image to load
        await new Promise((resolve) => {
          resizedImg.onload = resolve;
        });

        processImg = resizedImg;
        console.log(`Resized to ${newWidth}x${newHeight} for processing`);
      }

      // Run segmentation with a timeout
      console.log("Running BodyPix segmentation");
      const segmentation = await Promise.race([
        modelRef.current.segmentPerson(processImg, {
          flipHorizontal: false,
          internalResolution: "medium",
          segmentationThreshold: segmentationThreshold,
        }),
        timeoutPromise,
      ]);

      console.log("Segmentation completed successfully");

      // Create a colored mask from the segmentation
      const bodyPix = await import("@tensorflow-models/body-pix");
      const coloredPartImage = bodyPix.toMask(
        segmentation,
        { r: 255, g: 255, b: 255, a: 255 }, // Foreground color (white)
        { r: 0, g: 0, b: 0, a: 255 } // Background color (black)
      );

      // If we processed a resized image, we need to scale the mask back up
      if (processImg !== img) {
        console.log("Scaling mask back to original image size");

        // Create a temporary canvas for the small mask
        const smallMaskCanvas = document.createElement("canvas");
        const smallMaskCtx = smallMaskCanvas.getContext("2d");

        if (!smallMaskCtx) {
          throw new Error("Could not get context for small mask canvas");
        }

        // Set dimensions and draw the small mask
        smallMaskCanvas.width = segmentation.width;
        smallMaskCanvas.height = segmentation.height;
        smallMaskCtx.putImageData(coloredPartImage, 0, 0);

        // Scale it up to the original size
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.drawImage(
          smallMaskCanvas,
          0,
          0,
          smallMaskCanvas.width,
          smallMaskCanvas.height,
          0,
          0,
          maskCanvas.width,
          maskCanvas.height
        );

        console.log("Mask scaled to original size");
      } else {
        // Draw the mask directly
        maskCtx.putImageData(coloredPartImage, 0, 0);
      }

      // Save to history
      const newMask = maskCtx.getImageData(
        0,
        0,
        maskCanvas.width,
        maskCanvas.height
      );
      setHistory([...history, newMask]);
      setHistoryIndex(history.length);

      console.log("Subject detection completed");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`Error during AI segmentation: ${errorMessage}`);
      console.error("Full error details:", error);

      // Show error message to user
      alert(
        `AI segmentation failed: ${errorMessage}. Try using manual selection instead.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadAIModel = async () => {
    if (aiModelLoaded || isModelLoading) return;

    try {
      setIsModelLoading(true);
      console.log("Loading TensorFlow.js and BodyPix...");
      setModelProgress(10);

      // Load TensorFlow and BodyPix
      const { tf, bodyPix } = await loadTensorFlowAndBodyPix();
      tfRef.current = tf;

      console.log("Loading BodyPix model...");
      setModelProgress(30);

      // Load the BodyPix model with more optimized settings
      const net = await bodyPix.load({
        architecture: "MobileNetV1",
        outputStride: 16,
        multiplier: 0.5,
        quantBytes: 2,
      });

      modelRef.current = net;
      setModelProgress(100);
      console.log("BodyPix model loaded successfully");
      setAiModelLoaded(true);
      setAiModelError(null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`Failed to load AI model: ${errorMessage}`);
      setAiModelError(errorMessage);
      console.error("Error loading AI model:", error);
    } finally {
      setIsModelLoading(false);
    }
  };

  // Handle tab change
  const handleDetectionMethodChange = (value: string) => {
    setDetectionMethod(value as "manual" | "ai");

    // If AI method is selected, start loading the model
    if (value === "ai" && !aiModelLoaded && !isModelLoading) {
      loadAIModel();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Select Subject</h3>

      <Tabs value={detectionMethod} onValueChange={handleDetectionMethodChange}>
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

        <TabsContent value="ai" className="space-y-4 mt-4">
          {isModelLoading ? (
            <div className="p-6 border rounded-lg text-center">
              <h4 className="font-medium mb-2">Loading AI Model...</h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-primary h-2.5 rounded-full"
                  style={{ width: `${modelProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                Please wait while we load the TensorFlow.js BodyPix model (
                {modelProgress}%)
              </p>
            </div>
          ) : aiModelError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                Failed to load AI model: {aiModelError}. Please try using manual
                selection instead.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Use AI to automatically detect people and other subjects in your
                image. This works best with clear photos of people.
              </p>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">
                    Detection Sensitivity:{" "}
                    {Math.round(segmentationThreshold * 100)}%
                  </Label>
                  <Slider
                    value={[segmentationThreshold * 100]}
                    onValueChange={(values) =>
                      setSegmentationThreshold(values[0] / 100)
                    }
                    min={10}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Higher values detect fewer areas as subject, lower values
                    include more areas.
                  </p>
                </div>

                <Button
                  onClick={detectSubjectAI}
                  disabled={isLoading || !aiModelLoaded}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  {isLoading ? "Processing..." : "Detect with AI"}
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Note: After AI detection, you can still refine the selection
                manually.
              </p>
            </>
          )}
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
