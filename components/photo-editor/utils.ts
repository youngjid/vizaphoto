import { ImageState } from './types'

export function drawImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
  imageState: ImageState
) {
  const { scale, offsetX, offsetY, rotation } = imageState

  // Save the current context state
  ctx.save()

  // Translate to the center of the canvas
  ctx.translate(canvasWidth / 2, canvasHeight / 2)

  // Apply rotation
  ctx.rotate((rotation * Math.PI) / 180)

  // Calculate scaled dimensions
  const scaledWidth = image.width * scale
  const scaledHeight = image.height * scale

  // Draw the image centered and scaled
  ctx.drawImage(
    image,
    -scaledWidth / 2 + offsetX,
    -scaledHeight / 2 + offsetY,
    scaledWidth,
    scaledHeight
  )

  // Restore the context state
  ctx.restore()
} 