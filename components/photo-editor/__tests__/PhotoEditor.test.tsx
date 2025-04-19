import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoEditor } from '../PhotoEditor'

// Mock the useAppContext hook
jest.mock('@/context/app-context', () => ({
  useAppContext: () => mockContextValue
}))

// Mock the canvas API
const mockGetContext = jest.fn()
HTMLCanvasElement.prototype.getContext = mockGetContext

// Mock context methods
const mockContext = {
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
}

// Mock props
const mockContextValue = {
  step: 3,
  setStep: jest.fn(),
  selectedCountry: {
    name: 'Test Country',
    flag: '/test-flag.png',
  },
  selectedDocument: {
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
  },
  uploadedImage: 'data:image/png;base64,test',
  setProcessedImage: jest.fn(),
  isProcessing: false,
  setIsProcessing: jest.fn(),
  setSelectedCountry: jest.fn(),
  setSelectedDocument: jest.fn(),
  setUploadedImage: jest.fn(),
}

describe('PhotoEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetContext.mockReturnValue(mockContext)
  })

  it('renders correctly with all props', () => {
    render(<PhotoEditor />)
    
    // Check for main elements
    expect(screen.getByText('Photo Editor')).toBeInTheDocument()
    expect(screen.getByText('Test Country')).toBeInTheDocument()
    expect(screen.getByText('Test Document')).toBeInTheDocument()
    
    // Check for control buttons
    expect(screen.getByText('Back to Upload')).toBeInTheDocument()
    expect(screen.getByText('Process Photo')).toBeInTheDocument()
  })

  it('handles rotation correctly', () => {
    render(<PhotoEditor />)
    
    const rotateLeftButton = screen.getByLabelText('Rotate left')
    const rotateRightButton = screen.getByLabelText('Rotate right')
    
    fireEvent.click(rotateLeftButton)
    expect(mockContext.rotate).toHaveBeenCalledWith(-Math.PI / 2)
    
    fireEvent.click(rotateRightButton)
    expect(mockContext.rotate).toHaveBeenCalledWith(Math.PI / 2)
  })

  it('handles zoom correctly', () => {
    render(<PhotoEditor />)
    
    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '150' } })
    
    // Check if image was redrawn with new scale
    expect(mockContext.drawImage).toHaveBeenCalled()
  })

  it('handles background removal toggle correctly', () => {
    render(<PhotoEditor />)
    
    const toggle = screen.getByRole('switch')
    fireEvent.click(toggle)
    
    expect(screen.getByText('Will remove background after cropping')).toBeInTheDocument()
  })

  it('disables controls when processing', () => {
    jest.mock('@/context/app-context', () => ({
      useAppContext: () => ({ ...mockContextValue, isProcessing: true })
    }))
    render(<PhotoEditor />)
    
    expect(screen.getByText('Process Photo')).toBeDisabled()
    expect(screen.getByRole('switch')).toBeDisabled()
  })

  it('returns null when step is not 3', () => {
    jest.mock('@/context/app-context', () => ({
      useAppContext: () => ({ ...mockContextValue, step: 2 })
    }))
    const { container } = render(<PhotoEditor />)
    expect(container).toBeEmptyDOMElement()
  })
}) 