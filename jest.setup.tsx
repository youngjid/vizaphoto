import React from 'react';
import '@testing-library/jest-dom';
import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}

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
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ""} />;
  },
})); 