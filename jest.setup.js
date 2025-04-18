import '@testing-library/jest-dom';

// Mock fabric.js
jest.mock('fabric', () => ({
  Canvas: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
    remove: jest.fn(),
    renderAll: jest.fn(),
    setZoom: jest.fn(),
    getZoom: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn(),
    getActiveObject: jest.fn(),
    loadFromJSON: jest.fn(),
    toJSON: jest.fn(),
  })),
  Image: {
    fromURL: jest.fn(),
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
})); 