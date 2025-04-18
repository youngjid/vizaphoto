import { Canvas, Object } from 'fabric';

export interface EditorState {
  canvas: Canvas | null;
  activeObject: Object | null;
  zoom: number;
  history: string[];
  historyIndex: number;
  error: string | null;
  isLoading: boolean;
}

export interface EditorActions {
  setCanvas: (canvas: Canvas) => void;
  setActiveObject: (object: Object | null) => void;
  setZoom: (zoom: number) => void;
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export type EditorStore = EditorState & EditorActions; 