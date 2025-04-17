"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAppContext } from "@/context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Download, Loader2, ImageDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import type { DocumentType } from "@/data/countries"

// Import fal-ai client at the top level instead of dynamically
import { fal } from "@fal-ai/client"

// Configure fal-ai with API key from environment variable
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_FAL_KEY) {
  fal.config({
    credentials: process.env.NEXT_PUBLIC_FAL_KEY
  });
}

// Define types for fal-ai API response
interface FalAiImage {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
  width: number;
  height: number;
}

interface FalAiResponse {
  data: {
    image: FalAiImage;
    mask_image?: FalAiImage;
  };
  requestId: string;
}

interface FalAiUploadedFile {
  url: string;
  content_type: string;
  file_name: string;
  file_size: number;
}

interface DocumentTypeWithAspectRatio extends DocumentType {
  aspectRatio?: number;
  pixelDimensions?: string;
}

export function PhotoEditor() {
  const {
    step,
    setStep,
    selectedCountry,
    selectedDocument,
    uploadedImage,
    setProcessedImage,
    isProcessing,
    setIsProcessing,
  } = useAppContext()

  const { toast } = useToast()

  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [removeBackground, setRemoveBackground] = useState(false)
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Grid line positions (normalized between 0-1)
  const [topLine, setTopLine] = useState(0.3) // Crown of head
  const [middleLine, setMiddleLine] = useState(0.5) // Eyes
  const [bottomLine, setBottomLine] = useState(0.7) // Chin
  const [centerLine, setCenterLine] = useState(0.5) // Vertical center line

  // For dragging functionality
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Canvas dimensions - increased for better quality
  const displayCanvasWidth = 500
  const displayCanvasHeight = 500
  const highResCanvasWidth = 2000
  const highResCanvasHeight = 2000

  // Box dimensions (will be calculated based on face height)
  const [boxTop, setBoxTop] = useState(0)
  const [boxHeight, setBoxHeight] = useState(0)
  const [boxWidth, setBoxWidth] = useState(0)
  const [boxLeft, setBoxLeft] = useState(0)

  // Original image dimensions
  const [originalImageWidth, setOriginalImageWidth] = useState(0)
  const [originalImageHeight, setOriginalImageHeight] = useState(0)

  const formatDimensions = (dimensions: DocumentType["dimensions"]) => {
    // Format dimensions with appropriate units
    const width = dimensions.width.toFixed(1)
    const height = dimensions.height.toFixed(1)
    const units = dimensions.units
    
    // Add DPI information
    const dpi = dimensions.dpi ? ` (${dimensions.dpi} DPI)` : ''
    
    return `${width} × ${height} ${units}${dpi}`
  }

  // Calculate initial zoom to fit image in view
  const calculateInitialZoom = (imgWidth: number, imgHeight: number) => {
    if (!canvasRef.current) return 1

    const canvas = canvasRef.current
    const canvasAspect = canvas.width / canvas.height
    const imageAspect = imgWidth / imgHeight

    // Calculate zoom to fit the image within the canvas while maintaining aspect ratio
    if (imageAspect > canvasAspect) {
      // Image is wider relative to canvas
      return (canvas.width * 0.9) / imgWidth
    } else {
      // Image is taller relative to canvas
      return (canvas.height * 0.9) / imgHeight
    }
  }

  // Calculate initial grid line positions based on document specifications
  const calculateInitialGridLines = (document: DocumentType) => {
    if (!document) return
    
    // Get face height and crown top from document dimensions
    const faceHeight = document.dimensions.faceHeight
    const crownTop = document.dimensions.crownTop || 0
    const bottomEyeLine = document.dimensions.bottomEyeLine || (faceHeight * 0.85)
    
    // Calculate normalized positions (0-1)
    const normalizedFaceHeight = faceHeight / document.dimensions.height
    const normalizedCrownTop = crownTop / document.dimensions.height
    const normalizedBottomEyeLine = bottomEyeLine / document.dimensions.height
    
    // Set grid lines
    setTopLine(0.5 - normalizedFaceHeight / 2 + normalizedCrownTop)
    setMiddleLine(0.5 - normalizedFaceHeight / 2 + normalizedBottomEyeLine)
    setBottomLine(0.5 + normalizedFaceHeight / 2)
    setCenterLine(0.5)
  }

  // Load image when uploadedImage changes
  useEffect(() => {
    if (!uploadedImage || step !== 3) return

    // Create a new image element using the window.Image constructor
    const img = new window.Image()
    img.crossOrigin = "anonymous"

    // Set up onload handler before setting src
    img.onload = () => {
      imageRef.current = img
      // Store original dimensions
      setOriginalImageWidth(img.width)
      setOriginalImageHeight(img.height)
      
      // Calculate and set initial zoom to fit the image properly
      const initialZoom = calculateInitialZoom(img.width, img.height)
      setZoom(initialZoom)
      
      // Initialize high-res canvas
      if (highResCanvasRef.current) {
        const highResCanvas = highResCanvasRef.current
        highResCanvas.width = highResCanvasWidth
        highResCanvas.height = highResCanvasHeight
      }
      
      // Calculate initial grid line positions based on document specifications
      if (selectedDocument) {
        calculateInitialGridLines(selectedDocument)
      }
      
      if (canvasRef.current) {
        drawCanvas()
      }
    }

    // Set the source
    img.src = uploadedImage

    // Return cleanup function
    return () => {
      if (imageRef.current) {
        // Clean up image reference
        imageRef.current = null
      }
    }
  }, [uploadedImage, step, selectedDocument])

  // Calculate box dimensions when lines or document changes
  useEffect(() => {
    if (!selectedDocument || !canvasRef.current) return

    const canvas = canvasRef.current
    const height = canvas.height
    const width = canvas.width

    // Calculate face height based on top and bottom lines
    const faceHeight = (bottomLine - topLine) * height

    // Box height should be proportional to face height (standard ID photos have the face take up ~70-80% of the height)
    const calculatedBoxHeight = faceHeight / 0.7

    // Calculate aspect ratio from document dimensions
    const documentAspectRatio = selectedDocument.dimensions.width / selectedDocument.dimensions.height
    
    // Box width based on aspect ratio from document
    const calculatedBoxWidth = calculatedBoxHeight * documentAspectRatio

    // Center the box horizontally based on the center line
    const calculatedBoxLeft = centerLine * width - calculatedBoxWidth / 2

    // Position the box vertically so the face is properly positioned (eyes typically at 45-55% from top)
    const eyePositionInBox = 0.45 // Eyes should be at 45% from the top of the photo
    const calculatedBoxTop = middleLine * height - calculatedBoxHeight * eyePositionInBox

    setBoxHeight(calculatedBoxHeight)
    setBoxWidth(calculatedBoxWidth)
    setBoxLeft(calculatedBoxLeft)
    setBoxTop(calculatedBoxTop)
  }, [topLine, middleLine, bottomLine, centerLine, selectedDocument])

  // Redraw canvas when any parameters change
  useEffect(() => {
    if (imageRef.current && canvasRef.current) {
      drawCanvas()
    }
  }, [zoom, rotation, topLine, middleLine, bottomLine, centerLine, boxTop, boxHeight, boxWidth, boxLeft])

  // Draw the canvas with improved quality
  const drawCanvas = (showGuides = true) => {
    const canvas = canvasRef.current
    const img = imageRef.current

    if (!canvas || !img) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // Clear canvas with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate dimensions to maintain aspect ratio
    const scale = zoom
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale

    // Center of the canvas
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Save the current context state
    ctx.save()

    // Move to the center of the canvas
    ctx.translate(centerX, centerY)

    // Rotate the canvas
    ctx.rotate((rotation * Math.PI) / 180)

    // Draw the image centered
    ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)

    // Restore the context state (removes rotation)
    ctx.restore()

    if (showGuides) {
      // Create a semi-transparent overlay for the entire canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"

      // Draw four rectangles around the box to create the darkened effect
      // Top rectangle
      ctx.fillRect(0, 0, canvas.width, boxTop)

      // Bottom rectangle
      ctx.fillRect(0, boxTop + boxHeight, canvas.width, canvas.height - (boxTop + boxHeight))

      // Left rectangle
      ctx.fillRect(0, boxTop, boxLeft, boxHeight)

      // Right rectangle
      ctx.fillRect(boxLeft + boxWidth, boxTop, canvas.width - (boxLeft + boxWidth), boxHeight)

      // Draw grid lines
      drawGridLines(ctx, canvas.width, canvas.height)
    }
  }

  // Draw grid lines with improved visibility
  const drawGridLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw center vertical line (green)
    ctx.beginPath()
    ctx.strokeStyle = "rgba(0, 255, 0, 0.5)"
    ctx.setLineDash([3, 3]) // Smaller gaps in the dotted line
    ctx.lineWidth = 1 // Thinner line

    // Vertical center line (now using centerLine position)
    const centerX = width * centerLine
    ctx.moveTo(centerX, 0)
    ctx.lineTo(centerX, height)
    ctx.stroke()

    // Draw horizontal lines for face positioning with different colors
    // Top line (crown of head) - Red
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"
    ctx.setLineDash([3, 3]) // Smaller gaps in the dotted line
    ctx.lineWidth = 1 // Thinner line
    ctx.moveTo(0, height * topLine)
    ctx.lineTo(width, height * topLine)
    ctx.stroke()

    // Middle line (eyes) - Blue
    ctx.beginPath()
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)"
    ctx.setLineDash([3, 3]) // Smaller gaps in the dotted line
    ctx.lineWidth = 1 // Thinner line
    ctx.moveTo(0, height * middleLine)
    ctx.lineTo(width, height * middleLine)
    ctx.stroke()

    // Bottom line (chin) - Red
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"
    ctx.setLineDash([3, 3]) // Smaller gaps in the dotted line
    ctx.lineWidth = 1 // Thinner line
    ctx.moveTo(0, height * bottomLine)
    ctx.lineTo(width, height * bottomLine)
    ctx.stroke()

    // Draw border for the photo area - this now uses the calculated dimensions
    ctx.beginPath()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
    ctx.setLineDash([]) // Solid line for the border
    ctx.lineWidth = 2
    ctx.rect(boxLeft, boxTop, boxWidth, boxHeight)
    ctx.stroke()

    // Draw handles for draggable lines
    const handleSize = 8 // Smaller handles

    // Top line handle
    ctx.beginPath()
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
    ctx.arc(width - 20, height * topLine, handleSize / 2, 0, Math.PI * 2)
    ctx.fill()

    // Middle line handle
    ctx.beginPath()
    ctx.fillStyle = "rgba(0, 0, 255, 0.7)"
    ctx.arc(width - 20, height * middleLine, handleSize / 2, 0, Math.PI * 2)
    ctx.fill()

    // Bottom line handle
    ctx.beginPath()
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
    ctx.arc(width - 20, height * bottomLine, handleSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    // Normalize coordinates to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, x / canvas.width))
    const normalizedY = Math.max(0, Math.min(1, y / canvas.height))

    // Check if we're near any of the lines
    const handleSize = 20 // Size of the clickable area around handles

    // Check center line
    if (Math.abs(normalizedX - centerLine) < 0.02) {
      setActiveLine("center")
      setIsDragging(true)
      return
    }

    // Check top line
    if (Math.abs(normalizedY - topLine) < 0.02) {
      setActiveLine("top")
      setIsDragging(true)
      return
    }

    // Check middle line
    if (Math.abs(normalizedY - middleLine) < 0.02) {
      setActiveLine("middle")
      setIsDragging(true)
      return
    }

    // Check bottom line
    if (Math.abs(normalizedY - bottomLine) < 0.02) {
      setActiveLine("bottom")
      setIsDragging(true)
      return
    }
  }

  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    // Normalize coordinates to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, x / canvas.width))
    const normalizedY = Math.max(0, Math.min(1, y / canvas.height))

    switch (activeLine) {
      case "center":
        setCenterLine(normalizedX)
        break
      case "top":
        if (normalizedY < middleLine) setTopLine(normalizedY)
        break
      case "middle":
        if (normalizedY > topLine && normalizedY < bottomLine) setMiddleLine(normalizedY)
        break
      case "bottom":
        if (normalizedY > middleLine) setBottomLine(normalizedY)
        break
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setActiveLine(null)
  }

  // Calculate the exact dimensions based on the selected document
  const calculateDocumentDimensions = (document: DocumentType) => {
    if (!document) return { width: 0, height: 0 };
    
    const { width, height, dpi, units } = document.dimensions;
    
    // Convert dimensions to pixels based on DPI and units
    let pixelWidth, pixelHeight;
    
    if (units === "mm") {
      // Convert mm to pixels (1 inch = 25.4 mm)
      pixelWidth = Math.round((width / 25.4) * dpi);
      pixelHeight = Math.round((height / 25.4) * dpi);
    } else if (units === "inch") {
      // Convert inches to pixels
      pixelWidth = Math.round(width * dpi);
      pixelHeight = Math.round(height * dpi);
    } else if (units === "cm") {
      // Convert cm to pixels (1 inch = 2.54 cm)
      pixelWidth = Math.round((width / 2.54) * dpi);
      pixelHeight = Math.round((height / 2.54) * dpi);
    } else {
      // Default to pixels if units not specified
      pixelWidth = Math.round(width);
      pixelHeight = Math.round(height);
    }
    
    return { width: pixelWidth, height: pixelHeight };
  };

  // Set the DPI metadata in the image
  const setImageDpi = async (canvas: HTMLCanvasElement, dpi: number): Promise<string> => {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(canvas.toDataURL('image/jpeg', 1.0));
          return;
        }

        // Create array to store the image data
        const arrayBuffer = await blob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Find the APP0 marker (JFIF header)
        let i = 0;
        while (i < uint8Array.length - 1) {
          if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xE0) {
            // Found APP0 marker
            // Set x density at offset 12 (2 bytes)
            uint8Array[i + 12] = (dpi >> 8) & 0xFF;
            uint8Array[i + 13] = dpi & 0xFF;
            // Set y density at offset 14 (2 bytes)
            uint8Array[i + 14] = (dpi >> 8) & 0xFF;
            uint8Array[i + 15] = dpi & 0xFF;
            // Set density unit to inches (1) at offset 16
            uint8Array[i + 16] = 1;
            break;
          }
          i++;
        }

        // Create new blob with modified data
        const newBlob = new Blob([uint8Array], { type: 'image/jpeg' });

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.readAsDataURL(newBlob);
      }, 'image/jpeg', 1.0);
    });
  };

  // Process the photo with improved quality
  const handleProcessPhoto = async () => {
    if (!canvasRef.current || !imageRef.current || !highResCanvasRef.current || !selectedDocument) return;

    setIsProcessing(true);

    try {
      // Create a high-resolution canvas for the final photo
      const highResCanvas = highResCanvasRef.current
      const highResCtx = highResCanvas.getContext("2d")
      if (!highResCtx) return

      // Enable high-quality image rendering
      highResCtx.imageSmoothingEnabled = true
      highResCtx.imageSmoothingQuality = "high"

      // Calculate scaling factors between display canvas and high-res canvas
      const scaleX = highResCanvasWidth / displayCanvasWidth
      const scaleY = highResCanvasHeight / displayCanvasHeight

      // Calculate high-res box dimensions
      const highResBoxWidth = boxWidth * scaleX
      const highResBoxHeight = boxHeight * scaleY
      const highResBoxLeft = boxLeft * scaleX
      const highResBoxTop = boxTop * scaleY

      // Fill with white background
      highResCtx.fillStyle = "white"
      highResCtx.fillRect(0, 0, highResCanvasWidth, highResCanvasHeight)

      // Draw the image at high resolution
      const img = imageRef.current
      const imgScale = zoom * Math.min(scaleX, scaleY)
      const imgWidth = img.width * imgScale
      const imgHeight = img.height * imgScale

      // Center of the high-res canvas
      const centerX = highResCanvasWidth / 2
      const centerY = highResCanvasHeight / 2

      // Save the current context state
      highResCtx.save()

      // Move to the center of the canvas
      highResCtx.translate(centerX, centerY)

      // Rotate the canvas
      highResCtx.rotate((rotation * Math.PI) / 180)

      // Draw the image centered
      highResCtx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight)

      // Restore the context state (removes rotation)
      highResCtx.restore()

      // Create a new canvas for the final cropped photo
      const finalCanvas = document.createElement("canvas")
      
      // Calculate the exact dimensions based on the selected document
      const { width: pixelWidth, height: pixelHeight } = calculateDocumentDimensions(selectedDocument)
      
      // Set the canvas dimensions to the exact pixel dimensions
      finalCanvas.width = pixelWidth
      finalCanvas.height = pixelHeight
      
      // Log the dimensions and DPI for debugging
      console.log(`Document dimensions: ${selectedDocument.dimensions.width}×${selectedDocument.dimensions.height} ${selectedDocument.dimensions.units}`);
      console.log(`Required DPI: ${selectedDocument.dimensions.dpi}`);
      console.log(`Output dimensions: ${pixelWidth}×${pixelHeight} pixels`);

      // Set white background for the final canvas
      const finalCtx = finalCanvas.getContext("2d")
      if (!finalCtx) return

      // Enable high-quality image rendering
      finalCtx.imageSmoothingEnabled = true
      finalCtx.imageSmoothingQuality = "high"

      // Fill with white background
      finalCtx.fillStyle = "white"
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

      // Draw the portion of the high-res canvas that's inside the box
      finalCtx.drawImage(
        highResCanvas,
        highResBoxLeft,
        highResBoxTop,
        highResBoxWidth,
        highResBoxHeight,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
      )

      let processedImageData: string

      if (removeBackground) {
        try {
          setIsRemovingBackground(true);
          
          // First set the DPI
          const dpiAdjustedData = await setImageDpi(finalCanvas, selectedDocument.dimensions.dpi);
          
          // Convert base64 to blob
          const response = await fetch(dpiAdjustedData);
          const blob = await response.blob();

          // Create FormData and proceed with background removal
          const formData = new FormData();
          formData.append('image', blob, 'photo.jpg');
          
          // Call our API route for background removal
          const backgroundRemovalResponse = await fetch('/api/background-removal', {
            method: 'POST',
            body: formData,
          });
          
          const backgroundRemovalData = await backgroundRemovalResponse.json();
          
          if (!backgroundRemovalResponse.ok) {
            if (backgroundRemovalData.isTimeout) {
              toast({
                title: "Background Removal Failed",
                description: "The service timed out. Please try again.",
                action: (
                  <Button 
                    variant="outline" 
                    onClick={handleProcessPhoto}
                    className="bg-white hover:bg-gray-100"
                  >
                    Retry
                  </Button>
                ),
                variant: "destructive",
              });
              throw new Error('Background removal timed out');
            } else {
              toast({
                title: "Background Removal Failed",
                description: "An error occurred while removing the background. Please try again.",
                action: (
                  <Button 
                    variant="outline" 
                    onClick={handleProcessPhoto}
                    className="bg-white hover:bg-gray-100"
                  >
                    Retry
                  </Button>
                ),
                variant: "destructive",
              });
              throw new Error(backgroundRemovalData.error || 'Failed to process image');
            }
          }
          
          if (!backgroundRemovalData.success || !backgroundRemovalData.imageUrl) {
            toast({
              title: "Background Removal Failed",
              description: "The service returned an invalid response. Please try again.",
              action: (
                <Button 
                  variant="outline" 
                  onClick={handleProcessPhoto}
                  className="bg-white hover:bg-gray-100"
                >
                  Retry
                </Button>
              ),
              variant: "destructive",
            });
            throw new Error('Invalid response from server');
          }
          
          // Fetch the processed image
          const imageResponse = await fetch(backgroundRemovalData.imageUrl);
          const processedBlob = await imageResponse.blob();
          
          // Convert blob to base64
          const reader = new FileReader();
          processedImageData = await new Promise<string>((resolve) => {
            reader.onloadend = () => {
              resolve(reader.result as string);
            };
            reader.readAsDataURL(processedBlob);
          });
        } catch (error) {
          console.error("Error in image processing:", error);
          
          // Ask user if they want to proceed without background removal
          toast({
            title: "Background Removal Failed",
            description: "Would you like to proceed without background removal or try again?",
            action: (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleProcessPhoto}
                  className="bg-white hover:bg-gray-100"
                >
                  Retry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    setRemoveBackground(false);
                    processedImageData = await setImageDpi(finalCanvas, selectedDocument.dimensions.dpi);
                    setProcessedImage(processedImageData);
                    setStep(4);
                  }}
                  className="bg-white hover:bg-gray-100"
                >
                  Continue Without
                </Button>
              </div>
            ),
            variant: "destructive",
          });
          return; // Exit the function to wait for user decision
        } finally {
          setIsRemovingBackground(false);
        }
      } else {
        // Regular processing - just set the DPI
        processedImageData = await setImageDpi(finalCanvas, selectedDocument.dimensions.dpi)
      }

      setProcessedImage(processedImageData)
      setStep(4) // Move to download step

    } catch (error) {
      console.error("Error processing photo:", error)
      toast({
        title: "Error",
        description: "Failed to process the photo with the correct DPI.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResetLines = () => {
    if (selectedDocument) {
      calculateInitialGridLines(selectedDocument)
    } else {
      // Default positions if no document is selected
    setTopLine(0.3)
    setMiddleLine(0.5)
    setBottomLine(0.7)
    setCenterLine(0.5)
    }
  }

  const handleRotate = (degrees: number) => {
    setRotation((prev) => prev + degrees)
  }

  if (step !== 3) return null

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Photo Editor</h2>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <span>{selectedDocument?.name} {selectedDocument && `(${formatDimensions(selectedDocument.dimensions)})`}</span>
                  <span>for</span>
                  <span>{selectedCountry?.name}</span>
                  {selectedCountry?.flag && (
                    <Image
                      src={selectedCountry.flag}
                      alt={`${selectedCountry.name} flag`}
                      width={24}
                      height={16}
                      className="inline-block"
                    />
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back to Upload
                </Button>
                <Button
                  onClick={handleProcessPhoto}
                  disabled={isProcessing || isRemovingBackground}
                  className="px-8"
                >
                  {isProcessing || isRemovingBackground ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRemovingBackground ? "Removing Background..." : "Processing..."}
                    </>
                  ) : (
                    "Process Photo"
                  )}
                </Button>
              </div>
            </div>

            <div className="relative bg-slate-900 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={displayCanvasWidth}
                height={displayCanvasHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`w-full h-auto ${isDragging ? "cursor-move" : "cursor-default"}`}
              />
              
              {/* Hidden high-resolution canvas for processing */}
              <canvas
                ref={highResCanvasRef}
                width={highResCanvasWidth}
                height={highResCanvasHeight}
                className="hidden"
              />
              
              <div className="absolute bottom-4 left-4 bg-white/90 p-3 rounded-lg shadow-lg text-sm space-y-1">
                <p className="font-medium">Drag the colored handles to align:</p>
                <p className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                  Center line with middle of face
                </p>
                <p className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  Top red line with crown of head
                </p>
                <p className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                  Blue line with eyes
                </p>
                <p className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                  Bottom red line with chin
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRotate(-90)}
                    className="h-8 w-8"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRotate(90)}
                    className="h-8 w-8"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleResetLines}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut className="h-4 w-4 text-slate-500" />
                  <Slider
                    value={[zoom * 100]}
                    min={50}
                    max={200}
                    step={1}
                    onValueChange={(value) => setZoom(value[0] / 100)}
                    className="w-32"
                  />
                  <ZoomIn className="h-4 w-4 text-slate-500" />
                </div>
              </div>
              
              {/* Background removal toggle */}
              <div className="flex items-center justify-between border rounded-md p-3 bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="remove-background"
                    checked={removeBackground}
                    onCheckedChange={setRemoveBackground}
                    disabled={isProcessing || isRemovingBackground}
                  />
                  <Label htmlFor="remove-background" className="flex items-center gap-2">
                    <ImageDown className="h-4 w-4" />
                    Remove background (white)
                  </Label>
                </div>
                {removeBackground && (
                  <div className="text-xs text-slate-500">
                    {isRemovingBackground ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Will remove background after cropping"
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
