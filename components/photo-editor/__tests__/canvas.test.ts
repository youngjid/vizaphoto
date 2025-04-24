import {
  drawImage,
  drawOverlay,
  drawGridLines,
  calculateDocumentDimensions,
  setImageDpi,
} from '../utils/canvas'

// Mock canvas context
const createMockContext = () => ({
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  drawImage: jest.fn(),
  fillRect: jest.fn(),
  fillStyle: '',
  beginPath: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  setLineDash: jest.fn(),
  rect: jest.fn(),
  strokeStyle: '',
  lineWidth: 1,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'high',
})

describe('Canvas Utilities', () => {
  describe('drawImage', () => {
    it('draws image with correct transformations', () => {
      const ctx = createMockContext()
      const img = new Image()
      const zoom = 1.5
      const rotation = 90
      
      drawImage(ctx as any, img, 800, 600, { zoom, rotation })
      
      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.translate).toHaveBeenCalledWith(400, 300) // center of canvas
      expect(ctx.rotate).toHaveBeenCalledWith((90 * Math.PI) / 180)
      expect(ctx.drawImage).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })
  })

  describe('drawOverlay', () => {
    it('draws overlay rectangles correctly', () => {
      const ctx = createMockContext()
      const boxDimensions = {
        top: 100,
        height: 200,
        width: 150,
        left: 50,
      }
      
      drawOverlay(ctx as any, 800, 600, boxDimensions)
      
      // Should draw 4 rectangles for the overlay
      expect(ctx.fillRect).toHaveBeenCalledTimes(4)
      expect(ctx.fillStyle).toBe('rgba(0, 0, 0, 0.5)')
    })
  })

  describe('drawGridLines', () => {
    it('draws grid lines with correct styles', () => {
      const ctx = createMockContext()
      const gridLines = {
        topLine: 0.3,
        middleLine: 0.5,
        bottomLine: 0.7,
        centerLine: 0.5,
      }
      const boxDimensions = {
        top: 100,
        height: 200,
        width: 150,
        left: 50,
      }
      
      drawGridLines(ctx as any, 800, 600, gridLines, boxDimensions)
      
      expect(ctx.beginPath).toHaveBeenCalled()
      expect(ctx.setLineDash).toHaveBeenCalledWith([3, 3])
      expect(ctx.stroke).toHaveBeenCalled()
    })
  })

  describe('calculateDocumentDimensions', () => {
    it('calculates dimensions correctly for mm units', () => {
      const document = {
        id: 'test-doc',
        name: 'Test Document',
        dimensions: {
          width: 35,
          height: 45,
          units: 'mm',
          dpi: 300,
          faceHeight: 34,
          bottomEyeLine: 28.9,
          crownTop: 5.1
        },
        backgroundColor: '#FFFFFF',
        printable: true,
        officialLinks: [],
        comments: [],
        thumbnail: 'test.jpg'
      }
      
      const { width, height } = calculateDocumentDimensions(document)
      
      // 35mm at 300dpi = 413 pixels (rounded)
      // 45mm at 300dpi = 531 pixels (rounded)
      expect(width).toBe(413)
      expect(height).toBe(531)
    })

    it('calculates dimensions correctly for inches', () => {
      const document = {
        id: 'test-doc',
        name: 'Test Document',
        dimensions: {
          width: 2,
          height: 2,
          units: 'inch',
          dpi: 300,
          faceHeight: 1.5,
          bottomEyeLine: 1.275,
          crownTop: 0.225
        },
        backgroundColor: '#FFFFFF',
        printable: true,
        officialLinks: [],
        comments: [],
        thumbnail: 'test.jpg'
      }
      
      const { width, height } = calculateDocumentDimensions(document)
      
      // 2 inches at 300dpi = 600 pixels
      expect(width).toBe(600)
      expect(height).toBe(600)
    })

    it('returns zeros for invalid document', () => {
      const { width, height } = calculateDocumentDimensions(undefined as any)
      
      expect(width).toBe(0)
      expect(height).toBe(0)
    })
  })

  describe('setImageDpi', () => {
    it('sets DPI metadata correctly', async () => {
      const canvas = document.createElement('canvas')
      const dpi = 300
      
      // Mock canvas.toBlob
      canvas.toBlob = jest.fn((callback) => {
        const blob = new Blob(['test'], { type: 'image/jpeg' })
        callback(blob)
      })
      
      const result = await setImageDpi(canvas, dpi)
      
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.startsWith('data:image/jpeg;base64,')).toBe(true)
    })

    it('handles null blob gracefully', async () => {
      const canvas = document.createElement('canvas')
      const dpi = 300
      
      // Mock canvas.toBlob to return null
      canvas.toBlob = jest.fn((callback) => {
        callback(null)
      })
      
      const result = await setImageDpi(canvas, dpi)
      
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.startsWith('data:image/jpeg;base64,')).toBe(true)
    })
  })
}) 