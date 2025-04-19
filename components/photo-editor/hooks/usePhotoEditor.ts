import { useState, useRef, useEffect } from "react"
import type { DocumentType } from "@/data/countries"
import type {
  GridLinesState,
  BoxDimensions,
  ImageState,
  DragState,
  BackgroundRemovalState,
  CanvasDimensions
} from "../types"
import { drawImage } from "../utils/canvas"

export const usePhotoEditor = (
  uploadedImage: string | null,
  selectedDocument: DocumentType | null,
  step: number
) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Canvas dimensions
  const canvasDimensions: CanvasDimensions = {
    displayWidth: 500,
    displayHeight: 500,
    highResWidth: 2000,
    highResHeight: 2000,
  }

  // State
  const [gridLines, setGridLines] = useState<GridLinesState>({
    topLine: 0.3,
    middleLine: 0.5,
    bottomLine: 0.7,
    centerLine: 0.5,
  })

  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    top: 0,
    height: 0,
    width: 0,
    left: 0,
  })

  const [imageState, setImageState] = useState<ImageState>({
    zoom: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    originalWidth: 0,
    originalHeight: 0,
  })

  const [dragState, setDragState] = useState<DragState>({
    activeLine: null,
    isDragging: false,
  })

  const [backgroundState, setBackgroundState] = useState<BackgroundRemovalState>({
    removeBackground: false,
    isRemovingBackground: false,
  })

  // Calculate initial zoom to fit image in view
  const calculateInitialZoom = (imgWidth: number, imgHeight: number) => {
    if (!canvasRef.current) return 1

    const canvas = canvasRef.current
    const canvasAspect = canvas.width / canvas.height
    const imageAspect = imgWidth / imgHeight

    if (imageAspect > canvasAspect) {
      return (canvas.width * 0.9) / imgWidth
    } else {
      return (canvas.height * 0.9) / imgHeight
    }
  }

  // Calculate initial grid line positions based on document specifications
  const calculateInitialGridLines = (document: DocumentType) => {
    if (!document) return
    
    const { faceHeight, crownTop = 0, bottomEyeLine = faceHeight * 0.85 } = document.dimensions
    
    const normalizedFaceHeight = faceHeight / document.dimensions.height
    const normalizedCrownTop = crownTop / document.dimensions.height
    const normalizedBottomEyeLine = bottomEyeLine / document.dimensions.height
    
    setGridLines({
      topLine: 0.5 - normalizedFaceHeight / 2 + normalizedCrownTop,
      middleLine: 0.5 - normalizedFaceHeight / 2 + normalizedBottomEyeLine,
      bottomLine: 0.5 + normalizedFaceHeight / 2,
      centerLine: 0.5,
    })
  }

  // Initialize canvas dimensions
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasDimensions.displayWidth
      canvasRef.current.height = canvasDimensions.displayHeight

      // Initialize with white background
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvasDimensions.displayWidth, canvasDimensions.displayHeight)
      }
    }
    if (highResCanvasRef.current) {
      highResCanvasRef.current.width = canvasDimensions.highResWidth
      highResCanvasRef.current.height = canvasDimensions.highResHeight
    }
  }, [])  // Only run once on mount

  // Calculate initial grid lines when document changes
  useEffect(() => {
    if (selectedDocument) {
      calculateInitialGridLines(selectedDocument)
    }
  }, [selectedDocument])

  // Load image when uploadedImage changes
  useEffect(() => {
    if (!uploadedImage || step !== 3) return

    const img = new window.Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      imageRef.current = img
      const initialZoom = calculateInitialZoom(img.width, img.height)
      setImageState(prev => ({
        ...prev,
        originalWidth: img.width,
        originalHeight: img.height,
        zoom: initialZoom,
        scale: initialZoom,
      }))
    }

    img.src = uploadedImage

    return () => {
      imageRef.current = null
    }
  }, [uploadedImage, step])

  // Calculate box dimensions when lines or document changes
  useEffect(() => {
    if (!selectedDocument || !canvasRef.current) return

    const canvas = canvasRef.current
    const height = canvas.height
    const width = canvas.width

    const faceHeight = (gridLines.bottomLine - gridLines.topLine) * height
    const calculatedBoxHeight = faceHeight / 0.7
    const documentAspectRatio = selectedDocument.dimensions.width / selectedDocument.dimensions.height
    const calculatedBoxWidth = calculatedBoxHeight * documentAspectRatio
    const calculatedBoxLeft = gridLines.centerLine * width - calculatedBoxWidth / 2
    const eyePositionInBox = 0.45
    const calculatedBoxTop = gridLines.middleLine * height - calculatedBoxHeight * eyePositionInBox

    setBoxDimensions({
      height: calculatedBoxHeight,
      width: calculatedBoxWidth,
      left: calculatedBoxLeft,
      top: calculatedBoxTop,
    })
  }, [gridLines, selectedDocument, canvasRef])

  return {
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
  }
} 