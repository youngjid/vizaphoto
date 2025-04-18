import React from 'react';
import { useEditorStore } from '@/store/editorStore';

export const Toolbar: React.FC = () => {
  const { canvas, activeObject, setZoom, undo, redo } = useEditorStore();

  const handleZoomIn = () => {
    if (canvas) {
      const currentZoom = canvas.getZoom();
      setZoom(currentZoom * 1.1);
    }
  };

  const handleZoomOut = () => {
    if (canvas) {
      const currentZoom = canvas.getZoom();
      setZoom(currentZoom / 1.1);
    }
  };

  const handleDelete = () => {
    if (canvas && activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  };

  return (
    <div className="flex gap-2 p-4 bg-gray-100 rounded-lg">
      <button
        onClick={handleZoomIn}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Zoom In
      </button>
      <button
        onClick={handleZoomOut}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Zoom Out
      </button>
      <button
        onClick={undo}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Undo
      </button>
      <button
        onClick={redo}
        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Redo
      </button>
      <button
        onClick={handleDelete}
        disabled={!activeObject}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}; 