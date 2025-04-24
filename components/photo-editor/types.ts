import type { DocumentType } from "@/data/countries"

export interface PhotoEditorProps {
  step: number
  setStep: (step: number) => void
  selectedCountry: {
    name: string
    flag?: string
  } | null
  selectedDocument: DocumentType | null
  uploadedImage: string | null
  setProcessedImage: (image: string) => void
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
}

export interface GridLinesState {
  topLine: number
  middleLine: number
  bottomLine: number
  centerLine: number
}

export interface BoxDimensions {
  top: number
  height: number
  width: number
  left: number
}

export interface CanvasDimensions {
  displayWidth: number
  displayHeight: number
  highResWidth: number
  highResHeight: number
}

export interface ImageState {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
  zoom: number
  originalWidth: number
  originalHeight: number
  initialZoom: number
}

export interface DragState {
  activeLine: string | null
  isDragging: boolean
}

export interface BackgroundRemovalState {
  removeBackground: boolean
  isRemovingBackground: boolean
} 