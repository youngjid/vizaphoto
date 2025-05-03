"use client"

import React, { useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider, EditableSlider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Loader2, ImageDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DocumentType } from "@/data/countries"
import { useAppContext } from "@/context/app-context"
import { usePhotoEditor } from "./hooks/usePhotoEditor"
import { usePhotoProcessor } from "./hooks/usePhotoProcessor"
import { drawImage, drawOverlay, drawGridLines } from "./utils/canvas"
import { RemoveBgSwitch } from "./RemoveBgSwitch"

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

  const [rotate, setRotate] = React.useState(0)
  const [initialAutoRotation, setInitialAutoRotation] = React.useState(0)

  // When auto-rotation is calculated (in usePhotoEditor callback)
  const handleAutoRotation = (autoRotation: number) => {
    setRotate(autoRotation);
    setInitialAutoRotation(autoRotation);
  };

  const {
    canvasRef,
    imageRef,
    highResCanvasRef,
    canvasDimensions,
    gridLines,
    setGridLines,
    boxDimensions,
    imageState,
    setImageState,
    dragState,
    setDragState,
    backgroundState,
    setBackgroundState,
    calculateInitialGridLines,
    modelsLoaded,
    modelLoadingError,
    isDetecting,
    isInitialAlignmentDone,
    triggerGuidelineRecalculation,
  } = usePhotoEditor(uploadedImage, selectedDocument, step, handleAutoRotation)

  const { processPhoto } = usePhotoProcessor({
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>,
    imageRef: imageRef as React.RefObject<HTMLImageElement>,
    highResCanvasRef: highResCanvasRef as React.RefObject<HTMLCanvasElement>,
    selectedDocument,
    canvasDimensions,
    boxDimensions,
    imageState,
    removeBackground: backgroundState.removeBackground,
    setIsRemovingBackground: (value) => setBackgroundState(prev => ({ ...prev, isRemovingBackground: value })),
    setProcessedImage,
    setStep,
    setIsProcessing,
  })

  // Add state for each slider
  const [brightness, setBrightness] = React.useState(50)
  const [contrast, setContrast] = React.useState(50)
  const [exposure, setExposure] = React.useState(50)
  const [saturate, setSaturate] = React.useState(50)

  // Draw canvas when any parameters change
  useEffect(() => {
    if (!modelsLoaded || modelLoadingError) return;
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Clear the canvas with white background
    ctx.fillStyle = "white"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Build filter string
    // Brightness: 0-100 (default 50), CSS: 1 is normal
    // Contrast: 0-100 (default 50), CSS: 1 is normal
    // Exposure: 0-100 (default 50), map to brightness (1 is normal, 2 is max, 0 is min)
    // Saturate: 0-100 (default 50), CSS: 1 is normal
    const brightnessVal = 1 + (brightness - 50) / 50; // 0 to 2
    const contrastVal = 1 + (contrast - 50) / 50; // 0 to 2
    const exposureVal = 1 + (exposure - 50) / 50; // 0 to 2
    const saturateVal = 1 + (saturate - 50) / 50; // 0 to 2
    // Combine exposure and brightness for a more photographic effect
    const filterString = `brightness(${brightnessVal * exposureVal}) contrast(${contrastVal}) saturate(${saturateVal})`;

    // Draw the image if available
    if (imageRef.current) {
      drawImage(ctx, imageRef.current, canvas.width, canvas.height, imageState, filterString)
    }

    // Always draw overlay and grid lines
    drawOverlay(ctx, canvas.width, canvas.height, boxDimensions)
    drawGridLines(ctx, canvas.width, canvas.height, gridLines, boxDimensions)
  }, [imageState, gridLines, boxDimensions, modelsLoaded, modelLoadingError, brightness, contrast, exposure, saturate])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!modelsLoaded || modelLoadingError) return;
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    // Check if click is near any of the lines
    const threshold = 10
    const lines = [
      { id: "center", pos: gridLines.centerLine * canvas.width, y },
      { id: "top", x, pos: gridLines.topLine * canvas.height },
      { id: "middle", x, pos: gridLines.middleLine * canvas.height },
      { id: "bottom", x, pos: gridLines.bottomLine * canvas.height },
    ]

    const activeLine = lines.find(line => {
      if (line.id === "center") {
        return Math.abs(line.pos - x) < threshold
      } else {
        return Math.abs(line.pos - y) < threshold
      }
    })

    if (activeLine) {
      setDragState({ activeLine: activeLine.id, isDragging: true })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !canvasRef.current) return

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height

    // Normalize coordinates to 0-1 range
    const normalizedX = Math.max(0, Math.min(1, x / canvas.width))
    const normalizedY = Math.max(0, Math.min(1, y / canvas.height))

    switch (dragState.activeLine) {
      case "center":
        setGridLines(prev => ({ ...prev, centerLine: normalizedX }))
        break
      case "top":
        if (normalizedY < gridLines.middleLine) {
          setGridLines(prev => ({ ...prev, topLine: normalizedY }))
        }
        break
      case "middle":
        if (normalizedY > gridLines.topLine && normalizedY < gridLines.bottomLine) {
          setGridLines(prev => ({ ...prev, middleLine: normalizedY }))
        }
        break
      case "bottom":
        if (normalizedY > gridLines.middleLine) {
          setGridLines(prev => ({ ...prev, bottomLine: normalizedY }))
        }
        break
    }
  }

  const handleMouseUp = () => {
    setDragState({ activeLine: null, isDragging: false })
  }

  const handleRotate = (degrees: number) => {
    setImageState(prev => ({ ...prev, rotation: prev.rotation + degrees }))
  }

  const handleZoom = (zoomValue: number) => {
    setImageState(prev => ({
      ...prev,
      zoom: zoomValue,
      scale: zoomValue,
    }))
  }

  const formatDimensions = (dimensions: DocumentType['dimensions']) => {
    const width = dimensions.width.toFixed(1)
    const height = dimensions.height.toFixed(1)
    const units = dimensions.units
    const dpi = dimensions.dpi ? ` (${dimensions.dpi} DPI)` : ''
    return `${width} × ${height} ${units}${dpi}`
  }

  // On Re-align click, reset rotation to initial auto value
  const handleReAlign = () => {
    setRotate(initialAutoRotation);
    setImageState(prev => ({ ...prev, rotation: initialAutoRotation }));
    triggerGuidelineRecalculation();
  };

  if (step !== 3) return null

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-1">Photo Editor</h2>
            {selectedDocument && (
              <p className="text-gray-500">
                {selectedDocument.name} ({formatDimensions(selectedDocument.dimensions)}) for {selectedCountry?.name}{" "}
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
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}>Back to Upload</Button>
            <Button variant="default" className="bg-black hover:bg-black/90" onClick={processPhoto}>Process Photo</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[600px_1fr] gap-6 items-stretch">
        {/* Left side - Canvas */}
        <div className="relative bg-gray-200 rounded-lg p-4 h-full flex flex-col justify-center">
          {(isDetecting || !isInitialAlignmentDone || isProcessing || backgroundState.isRemovingBackground) && (
            <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
              <p className="text-blue-800 font-medium">
                {isDetecting || !isInitialAlignmentDone
                  ? "Aligning and calculating guidelines..."
                  : backgroundState.isRemovingBackground
                    ? "Removing background..."
                    : "Processing..."}
              </p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={canvasDimensions.displayWidth}
            height={canvasDimensions.displayHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`w-full h-auto border-2 border-white shadow-lg ${dragState.isDragging ? "cursor-move" : "cursor-default"} ${(!modelsLoaded || modelLoadingError) ? 'opacity-50' : ''}`}
            style={{
              imageRendering: '-webkit-optimize-contrast',
              maxWidth: '100%',
            }}
          />

          <canvas
            ref={highResCanvasRef}
            width={canvasDimensions.highResWidth}
            height={canvasDimensions.highResHeight}
            className="hidden"
          />
        </div>

        {/* Right side - Controls */}
        <div className="h-full flex flex-col bg-gray-200 rounded-lg p-4 justify-between">
          {/* Image adjustments */}
          <div className="space-y-6">
            <div className="space-y-4">
              <EditableSlider label="Brightness" min={0} max={100} value={brightness} onChange={setBrightness} />
              <EditableSlider label="Contrast" min={0} max={100} value={contrast} onChange={setContrast} />
              <EditableSlider label="Exposure" min={0} max={100} value={exposure} onChange={setExposure} />
              <EditableSlider label="Saturate" min={0} max={100} value={saturate} onChange={setSaturate} />
              <EditableSlider label="Rotate" min={-45} max={45} value={rotate} onChange={val => { setRotate(val); setImageState(prev => ({ ...prev, rotation: val })); }} valueSuffix="°" />
            </div>

            <div className="flex items-center mt-4">
              <Button
                variant="secondary"
                className="bg-gray-900 text-white hover:bg-gray-800 w-40"
                onClick={handleReAlign}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Re-align
              </Button>
              <div className="flex-1" />
              <RemoveBgSwitch
                checked={backgroundState.removeBackground}
                onChange={val => setBackgroundState(prev => ({ ...prev, removeBackground: val }))}
              />
            </div>
          </div>

          {/* Alignment instructions */}
          <div className="bg-white rounded-lg p-4 mt-6">
            <div className="space-y-3">
              <h3 className="font-medium">Drag the colored handles to align:</h3>
              <div className="space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  )
} 