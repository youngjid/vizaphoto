import React, { useEffect, useRef } from 'react';
import { Canvas, Image, Object } from 'fabric';
import { useEditorStore } from '@/store/editorStore';

interface PhotoEditorProps {
  imageUrl?: string;
  width?: number;
  height?: number;
}

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  imageUrl,
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setCanvas, setActiveObject, addToHistory } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
    });

    // Set canvas in store
    setCanvas(canvas);

    // Load image if provided
    if (imageUrl) {
      Image.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      }, (img: Image) => {
        if (!img) return;
        
        // Scale image to fit canvas while maintaining aspect ratio
        const scale = Math.min(
          width / img.width!,
          height / img.height!
        );
        img.scale(scale);
        
        // Center image
        img.set({
          left: (width - img.width! * scale) / 2,
          top: (height - img.height! * scale) / 2,
        });

        canvas.add(img);
        canvas.renderAll();
        addToHistory();
      });
    }

    // Event listeners
    canvas.on('selection:created', () => {
      const activeObject = canvas.getActiveObject();
      setActiveObject(activeObject || null);
    });

    canvas.on('selection:updated', () => {
      const activeObject = canvas.getActiveObject();
      setActiveObject(activeObject || null);
    });

    canvas.on('selection:cleared', () => {
      setActiveObject(null);
    });

    // Save to history on object modification
    canvas.on('object:modified', () => {
      addToHistory();
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [imageUrl, width, height, setCanvas, setActiveObject, addToHistory]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} />
    </div>
  );
}; 