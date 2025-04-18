import React from 'react';
import { render, screen } from '@testing-library/react';
import { PhotoEditor } from '../PhotoEditor';
import { useEditorStore } from '../../../store/editorStore';

// Mock fabric
jest.mock('fabric', () => {
  const mockCanvas = jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    renderAll: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(),
    getActiveObject: jest.fn(),
  }));

  return {
    Canvas: mockCanvas,
    Image: {
      fromURL: jest.fn((url, options, callback) => {
        const mockImage = {
          width: 100,
          height: 100,
          scale: jest.fn(),
          set: jest.fn(),
        };
        callback(mockImage);
      }),
    },
  };
});

// Mock the store
const mockSetCanvas = jest.fn();
const mockSetActiveObject = jest.fn();
const mockAddToHistory = jest.fn();

jest.mock('../../../store/editorStore', () => ({
  useEditorStore: () => ({
    setCanvas: mockSetCanvas,
    setActiveObject: mockSetActiveObject,
    addToHistory: mockAddToHistory,
  }),
}));

describe('PhotoEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders canvas element', () => {
    render(<PhotoEditor />);
    const canvas = screen.getByTestId('editor-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('initializes canvas with correct dimensions', () => {
    const width = 1000;
    const height = 800;
    render(<PhotoEditor width={width} height={height} />);
    
    // Canvas dimensions are set through Fabric.js, not directly on the DOM element
    const Canvas = require('fabric').Canvas;
    expect(Canvas).toHaveBeenCalledWith(
      expect.any(HTMLCanvasElement),
      expect.objectContaining({
        width,
        height,
        backgroundColor: '#ffffff',
      })
    );
  });

  it('loads image when imageUrl is provided', () => {
    const imageUrl = 'test.jpg';
    render(<PhotoEditor imageUrl={imageUrl} />);
    
    const { fromURL } = require('fabric').Image;
    expect(fromURL).toHaveBeenCalledWith(
      imageUrl,
      expect.any(Object),
      expect.any(Function)
    );
  });

  it('cleans up on unmount', () => {
    const mockDispose = jest.fn();
    const Canvas = require('fabric').Canvas;
    Canvas.mockImplementation(() => ({
      dispose: mockDispose,
      on: jest.fn(),
    }));

    const { unmount } = render(<PhotoEditor />);
    unmount();
    
    expect(mockDispose).toHaveBeenCalled();
  });
}); 