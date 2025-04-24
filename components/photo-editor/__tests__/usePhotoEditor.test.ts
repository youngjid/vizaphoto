import { renderHook, act } from '@testing-library/react'
import { usePhotoEditor } from '../hooks/usePhotoEditor'
import type { DocumentType } from '@/data/countries'

describe('usePhotoEditor', () => {
  const mockDocument: DocumentType = {
    id: '1',
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

  const mockImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks()
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 3)
    )

    expect(result.current.canvasRef).toBeDefined()
    expect(result.current.imageRef).toBeDefined()
    expect(result.current.highResCanvasRef).toBeDefined()
    expect(result.current.gridLines).toBeDefined()
    expect(result.current.boxDimensions).toBeDefined()
    expect(result.current.imageState).toBeDefined()
    expect(result.current.dragState).toBeDefined()
    expect(result.current.backgroundState).toBeDefined()
  })

  it('calculates initial zoom correctly', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 3)
    )

    expect(result.current.imageState.zoom).toBeGreaterThan(0)
  })

  it('updates grid lines when document changes', () => {
    const { result, rerender } = renderHook(
      ({ document }) => usePhotoEditor(mockImageUrl, document, 3),
      {
        initialProps: { document: mockDocument },
      }
    )

    const initialGridLines = { ...result.current.gridLines }

    const newDocument = {
      ...mockDocument,
      dimensions: {
        ...mockDocument.dimensions,
        height: 60,
      },
    }

    rerender({ document: newDocument })

    expect(result.current.gridLines).not.toEqual(initialGridLines)
  })

  it('handles drag state changes', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 3)
    )

    act(() => {
      result.current.setDragState({
        activeLine: 'topLine',
        isDragging: true,
      })
    })

    expect(result.current.dragState.activeLine).toBe('topLine')
    expect(result.current.dragState.isDragging).toBe(true)
  })

  it('handles background state changes', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 3)
    )

    act(() => {
      result.current.setBackgroundState({
        removeBackground: true,
        isRemovingBackground: false,
      })
    })

    expect(result.current.backgroundState.removeBackground).toBe(true)
    expect(result.current.backgroundState.isRemovingBackground).toBe(false)
  })

  it('updates box dimensions when grid lines change', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 3)
    )

    const initialBoxDimensions = { ...result.current.boxDimensions }

    act(() => {
      result.current.setGridLines({
        ...result.current.gridLines,
        topLine: 0.2,
        bottomLine: 0.8,
      })
    })

    expect(result.current.boxDimensions).not.toEqual(initialBoxDimensions)
  })

  it('returns null when step is not 3', () => {
    const { result } = renderHook(() =>
      usePhotoEditor(mockImageUrl, mockDocument, 2)
    )

    expect(result.current).toBeNull()
  })
}) 