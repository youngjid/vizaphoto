export interface PrintLayout {
  pageSize: {
    width: number;  // 4 inches in pixels at 300dpi
    height: number; // 6 inches in pixels at 300dpi
    dpi: number;    // 300 DPI standard for photo printing
  };
  photos: Array<PhotoPlacement>;
  cuttingGuides: Array<CuttingGuide>;
}

export interface PhotoPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface CuttingGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  length: number;
}

export interface PrintConfig {
  photosPerPage: number;
  arrangement: {
    rows: number;
    cols: number;
  };
  spacing: {
    horizontal: number;
    vertical: number;
    margin: number;
  };
}

export const PRINT_LAYOUTS: Record<string, PrintConfig> = {
  '2x2inch': {
    photosPerPage: 6,
    arrangement: { rows: 3, cols: 2 },
    spacing: { horizontal: 20, vertical: 20, margin: 30 }
  },
  '35x45mm': {
    photosPerPage: 8,
    arrangement: { rows: 4, cols: 2 },
    spacing: { horizontal: 20, vertical: 20, margin: 30 }
  }
}; 