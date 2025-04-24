import { create } from 'zustand';
import { Canvas, Object } from 'fabric';

interface EditorState {
  canvas: Canvas | null;
  activeObject: Object | null;
  zoom: number;
  history: string[];
  historyIndex: number;
  setCanvas: (canvas: Canvas) => void;
  setActiveObject: (object: Object | null) => void;
  setZoom: (zoom: number) => void;
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  canvas: null,
  activeObject: null,
  zoom: 1,
  history: [],
  historyIndex: -1,
  
  setCanvas: (canvas) => set({ canvas }),
  
  setActiveObject: (object) => set({ activeObject: object }),
  
  setZoom: (zoom) => {
    const { canvas } = get();
    if (canvas) {
      canvas.setZoom(zoom);
      set({ zoom });
    }
  },
  
  addToHistory: () => {
    const { canvas, history, historyIndex } = get();
    if (canvas) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(canvas.toJSON()));
      set({ 
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    }
  },
  
  undo: () => {
    const { canvas, history, historyIndex } = get();
    if (canvas && historyIndex > 0) {
      const json = history[historyIndex - 1];
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        set({ historyIndex: historyIndex - 1 });
      });
    }
  },
  
  redo: () => {
    const { canvas, history, historyIndex } = get();
    if (canvas && historyIndex < history.length - 1) {
      const json = history[historyIndex + 1];
      canvas.loadFromJSON(json, () => {
        canvas.renderAll();
        set({ historyIndex: historyIndex + 1 });
      });
    }
  }
})); 