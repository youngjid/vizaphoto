"use client"

import React, { useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ZoomIn, ZoomOut, RotateCcw, RotateCw, RefreshCw, Loader2, ImageDown } from "lucide-react"
import type { DocumentType } from "@/data/countries"
import { useAppContext } from "@/context/app-context"
import { usePhotoEditor } from "./hooks/usePhotoEditor"
import { usePhotoProcessor } from "./hooks/usePhotoProcessor"
import { drawImage, drawOverlay, drawGridLines } from "./utils/canvas"

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
  } = usePhotoEditor(uploadedImage, selectedDocument, step)

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

    // Draw the image if available
    if (imageRef.current) {
      drawImage(ctx, imageRef.current, canvas.width, canvas.height, imageState)
    }

    // Always draw overlay and grid lines
    drawOverlay(ctx, canvas.width, canvas.height, boxDimensions)
    drawGridLines(ctx, canvas.width, canvas.height, gridLines, boxDimensions)
  }, [imageState, gridLines, boxDimensions, modelsLoaded, modelLoadingError])

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
                  <span>{selectedDocument?.name} {selectedDocument && formatDimensions(selectedDocument.dimensions)}</span>
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
                  onClick={processPhoto}
                  disabled={isProcessing || backgroundState.isRemovingBackground}
                  className="px-8"
                >
                  {isProcessing || backgroundState.isRemovingBackground ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {backgroundState.isRemovingBackground ? "Removing Background..." : "Processing..."}
                    </>
                  ) : (
                    "Process Photo"
                  )}
                </Button>
              </div>
            </div>

            <div className="relative bg-slate-900 rounded-lg p-4">
              {(!modelsLoaded || modelLoadingError) && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col justify-center items-center z-10 rounded-lg">
                  {modelLoadingError ? (
                    <>
                      <p className="text-red-400 text-lg font-semibold mb-2">Error Loading Models</p>
                      <p className="text-red-300 text-sm text-center px-4 mb-4">{modelLoadingError}</p>
                      <Button variant="secondary" onClick={() => window.location.reload()}>
                        Reload Page
                      </Button>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-8 w-8 text-slate-400 animate-spin mb-3" />
                      <p className="text-slate-400">Loading face detection models...</p>
                    </>
                  )}
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
                className={`w-full h-auto ${dragState.isDragging ? "cursor-move" : "cursor-default"} ${(!modelsLoaded || modelLoadingError) ? 'opacity-50' : ''}`}
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

            <div className={`grid grid-cols-2 gap-6 ${(!modelsLoaded || modelLoadingError) ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-4 w-4 text-slate-500" />
                    <Slider
                      value={[imageState.zoom * 100]}
                      min={50}
                      max={200}
                      step={1}
                      onValueChange={(value) => handleZoom(value[0] / 100)}
                      className="w-32"
                    />
                    <ZoomIn className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between border rounded-md p-3 bg-slate-50">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="remove-background"
                      checked={backgroundState.removeBackground}
                      onCheckedChange={(value) => setBackgroundState(prev => ({ ...prev, removeBackground: value }))}
                      disabled={isProcessing || backgroundState.isRemovingBackground}
                    />
                    <Label htmlFor="remove-background" className="flex items-center gap-2">
                      <ImageDown className="h-4 w-4" />
                      Remove background (white)
                    </Label>
                  </div>
                  {backgroundState.removeBackground && (
                    <div className="text-xs text-slate-500">
                      {backgroundState.isRemovingBackground ? (
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 