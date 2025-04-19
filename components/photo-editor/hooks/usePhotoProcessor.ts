import { useToast } from "@/components/ui/use-toast"
import type { DocumentType } from "@/data/countries"
import type { BoxDimensions, CanvasDimensions, ImageState } from "../types"
import { calculateDocumentDimensions, setImageDpi } from "../utils/canvas"

interface UsePhotoProcessorProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  imageRef: React.RefObject<HTMLImageElement>
  highResCanvasRef: React.RefObject<HTMLCanvasElement>
  selectedDocument: DocumentType | null
  canvasDimensions: CanvasDimensions
  boxDimensions: BoxDimensions
  imageState: ImageState
  removeBackground: boolean
  setIsRemovingBackground: (value: boolean) => void
  setProcessedImage: (image: string) => void
  setStep: (step: number) => void
  setIsProcessing: (value: boolean) => void
}

export const usePhotoProcessor = ({
  canvasRef,
  imageRef,
  highResCanvasRef,
  selectedDocument,
  canvasDimensions,
  boxDimensions,
  imageState,
  removeBackground,
  setIsRemovingBackground,
  setProcessedImage,
  setStep,
  setIsProcessing,
}: UsePhotoProcessorProps) => {
  const { toast } = useToast()

  const processPhoto = async () => {
    if (!canvasRef.current || !imageRef.current || !highResCanvasRef.current || !selectedDocument) return

    try {
      setIsProcessing(true)
      // Create a high-resolution canvas for the final photo
      const highResCanvas = highResCanvasRef.current
      const highResCtx = highResCanvas.getContext("2d")
      if (!highResCtx) return

      // Enable high-quality image rendering
      highResCtx.imageSmoothingEnabled = true
      highResCtx.imageSmoothingQuality = "high"

      // Calculate scaling factors between display canvas and high-res canvas
      const scaleX = canvasDimensions.highResWidth / canvasDimensions.displayWidth
      const scaleY = canvasDimensions.highResHeight / canvasDimensions.displayHeight

      // Calculate high-res box dimensions
      const highResBoxWidth = boxDimensions.width * scaleX
      const highResBoxHeight = boxDimensions.height * scaleY
      const highResBoxLeft = boxDimensions.left * scaleX
      const highResBoxTop = boxDimensions.top * scaleY

      // Fill with white background
      highResCtx.fillStyle = "white"
      highResCtx.fillRect(0, 0, canvasDimensions.highResWidth, canvasDimensions.highResHeight)

      // Draw the image at high resolution
      const img = imageRef.current
      const imgScale = imageState.zoom * Math.min(scaleX, scaleY)
      const imgWidth = img.width * imgScale
      const imgHeight = img.height * imgScale

      // Center of the high-res canvas
      const centerX = canvasDimensions.highResWidth / 2
      const centerY = canvasDimensions.highResHeight / 2

      // Save the current context state
      highResCtx.save()

      // Move to the center of the canvas
      highResCtx.translate(centerX, centerY)

      // Rotate the canvas
      highResCtx.rotate((imageState.rotation * Math.PI) / 180)

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
          setIsRemovingBackground(true)
          
          // First set the DPI
          const dpiAdjustedData = await setImageDpi(finalCanvas, selectedDocument.dimensions.dpi)
          
          // Convert base64 to blob
          const response = await fetch(dpiAdjustedData)
          const blob = await response.blob()

          // Create FormData and proceed with background removal
          const formData = new FormData()
          formData.append('image', blob, 'photo.jpg')
          
          // Call our API route for background removal
          const backgroundRemovalResponse = await fetch('/api/background-removal', {
            method: 'POST',
            body: formData,
          })
          
          const backgroundRemovalData = await backgroundRemovalResponse.json()
          
          if (!backgroundRemovalResponse.ok) {
            if (backgroundRemovalData.isTimeout) {
              toast({
                title: "Background Removal Failed",
                description: "The service timed out. Please try again.",
                variant: "destructive",
              })
              throw new Error('Background removal timed out')
            } else {
              toast({
                title: "Background Removal Failed",
                description: "An error occurred while removing the background. Please try again.",
                variant: "destructive",
              })
              throw new Error(backgroundRemovalData.error || 'Failed to process image')
            }
          }
          
          if (!backgroundRemovalData.success || !backgroundRemovalData.imageUrl) {
            toast({
              title: "Background Removal Failed",
              description: "The service returned an invalid response. Please try again.",
              variant: "destructive",
            })
            throw new Error('Invalid response from server')
          }

          processedImageData = backgroundRemovalData.imageUrl
        } finally {
          setIsRemovingBackground(false)
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

  return { processPhoto }
} 