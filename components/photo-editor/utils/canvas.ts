import type { DocumentType } from "@/data/countries"
import type { BoxDimensions, GridLinesState, ImageState } from "../types"

export const drawImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  { zoom, rotation }: Pick<ImageState, "zoom" | "rotation">
) => {
  // Enable high-quality image rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  // Clear canvas with white background
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Calculate dimensions to maintain aspect ratio
  const scale = zoom
  const imgWidth = img.width * scale
  const imgHeight = img.height * scale

  // Center of the canvas
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

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
}

export const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  boxDimensions: BoxDimensions
) => {
  const { top, height, width, left } = boxDimensions

  // Create a semi-transparent overlay for the entire canvas
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"

  // Draw four rectangles around the box to create the darkened effect
  ctx.fillRect(0, 0, canvasWidth, top) // Top
  ctx.fillRect(0, top + height, canvasWidth, canvasHeight - (top + height)) // Bottom
  ctx.fillRect(0, top, left, height) // Left
  ctx.fillRect(left + width, top, canvasWidth - (left + width), height) // Right
}

export const drawGridLines = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  gridLines: GridLinesState,
  boxDimensions: BoxDimensions
) => {
  const { topLine, middleLine, bottomLine, centerLine } = gridLines
  const { top, height, width, left } = boxDimensions

  // Draw center vertical line (green)
  ctx.beginPath()
  ctx.strokeStyle = "rgba(0, 255, 0, 0.5)"
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1
  const centerX = canvasWidth * centerLine
  ctx.moveTo(centerX, 0)
  ctx.lineTo(centerX, canvasHeight)
  ctx.stroke()

  // Draw horizontal lines
  const lines = [
    { y: topLine, color: "rgba(255, 0, 0, 0.5)" }, // Top (red)
    { y: middleLine, color: "rgba(0, 0, 255, 0.5)" }, // Middle (blue)
    { y: bottomLine, color: "rgba(255, 0, 0, 0.5)" }, // Bottom (red)
  ]

  lines.forEach(({ y, color }) => {
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.setLineDash([3, 3])
    ctx.lineWidth = 1
    ctx.moveTo(0, canvasHeight * y)
    ctx.lineTo(canvasWidth, canvasHeight * y)
    ctx.stroke()
  })

  // Draw border for the photo area
  ctx.beginPath()
  ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
  ctx.setLineDash([])
  ctx.lineWidth = 2
  ctx.rect(left, top, width, height)
  ctx.stroke()
}

export const calculateDocumentDimensions = (document: DocumentType) => {
  if (!document) return { width: 0, height: 0 }
  
  const { width, height, dpi, units } = document.dimensions
  
  // Convert dimensions to pixels based on DPI and units
  let pixelWidth, pixelHeight
  
  if (units === "mm") {
    // Convert mm to pixels (1 inch = 25.4 mm)
    pixelWidth = Math.round((width / 25.4) * dpi)
    pixelHeight = Math.round((height / 25.4) * dpi)
  } else if (units === "inch") {
    // Convert inches to pixels
    pixelWidth = Math.round(width * dpi)
    pixelHeight = Math.round(height * dpi)
  } else if (units === "cm") {
    // Convert cm to pixels (1 inch = 2.54 cm)
    pixelWidth = Math.round((width / 2.54) * dpi)
    pixelHeight = Math.round((height / 2.54) * dpi)
  } else {
    // Default to pixels if units not specified
    pixelWidth = Math.round(width)
    pixelHeight = Math.round(height)
  }
  
  return { width: pixelWidth, height: pixelHeight }
}

export const setImageDpi = async (canvas: HTMLCanvasElement, dpi: number): Promise<string> => {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(canvas.toDataURL('image/jpeg', 1.0))
        return
      }

      // Create array to store the image data
      const arrayBuffer = await blob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Find the APP0 marker (JFIF header)
      let i = 0
      while (i < uint8Array.length - 1) {
        if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xE0) {
          // Found APP0 marker
          // Set x density at offset 12 (2 bytes)
          uint8Array[i + 12] = (dpi >> 8) & 0xFF
          uint8Array[i + 13] = dpi & 0xFF
          // Set y density at offset 14 (2 bytes)
          uint8Array[i + 14] = (dpi >> 8) & 0xFF
          uint8Array[i + 15] = dpi & 0xFF
          // Set density unit to inches (1) at offset 16
          uint8Array[i + 16] = 1
          break
        }
        i++
      }

      // Create new blob with modified data
      const newBlob = new Blob([uint8Array], { type: 'image/jpeg' })

      // Convert blob to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64data = reader.result as string
        resolve(base64data)
      }
      reader.readAsDataURL(newBlob)
    }, 'image/jpeg', 1.0)
  })
} 