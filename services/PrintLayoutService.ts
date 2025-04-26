import type { DocumentType } from "@/data/countries";
import { PrintLayout, PhotoPlacement, CuttingGuide } from "@/types/print";

export class PrintLayoutService {
  private readonly DPI = 300;
  private readonly PAGE_WIDTH_INCH = 6;
  private readonly PAGE_HEIGHT_INCH = 4;
  private readonly PAGE_WIDTH_PX = this.PAGE_WIDTH_INCH * this.DPI;  // 1800px
  private readonly PAGE_HEIGHT_PX = this.PAGE_HEIGHT_INCH * this.DPI; // 1200px

  calculateLayout(
    documentType: DocumentType
  ): PrintLayout {
    const { width: photoWidthPx, height: photoHeightPx } = this.getPhotoSizeInPixels(documentType.dimensions);
    const pageWidth = this.PAGE_WIDTH_PX;
    const pageHeight = this.PAGE_HEIGHT_PX;

    // Try portrait arrangement (no rotation)
    const colsPortrait = Math.floor(pageWidth / photoWidthPx);
    const rowsPortrait = Math.floor(pageHeight / photoHeightPx);
    const countPortrait = colsPortrait * rowsPortrait;

    // Try landscape arrangement (no rotation, just swap photo dimensions)
    const colsLandscape = Math.floor(pageWidth / photoHeightPx);
    const rowsLandscape = Math.floor(pageHeight / photoWidthPx);
    const countLandscape = colsLandscape * rowsLandscape;

    // Determine arrangement based on image orientation
    let slotWidth, slotHeight, cols, rows;

    // If the image is portrait, only use portrait arrangement
    if (photoWidthPx < photoHeightPx) {
      slotWidth = photoWidthPx;
      slotHeight = photoHeightPx;
      cols = colsPortrait;
      rows = rowsPortrait;
    } else {
      // If the image is landscape or square, use the arrangement that fits the most
      if (countPortrait >= countLandscape) {
        slotWidth = photoWidthPx;
        slotHeight = photoHeightPx;
        cols = colsPortrait;
        rows = rowsPortrait;
      } else {
        slotWidth = photoHeightPx;
        slotHeight = photoWidthPx;
        cols = colsLandscape;
        rows = rowsLandscape;
      }
    }

    if (cols === 0 || rows === 0) {
      // Fallback: only one photo centered
       return { 
        pageSize: { width: pageWidth, height: pageHeight, dpi: this.DPI },
        photos: [
          {
            x: (pageWidth - slotWidth) / 2,
            y: (pageHeight - slotHeight) / 2,
            width: slotWidth,
            height: slotHeight,
                rotation: 0
          }
        ],
            cuttingGuides: []
        };
    }

    // Center the grid
    const totalBlockWidth = cols * slotWidth;
    const totalBlockHeight = rows * slotHeight;
    const marginX = (pageWidth - totalBlockWidth) / 2;
    const marginY = (pageHeight - totalBlockHeight) / 2;

    // Generate slot positions
    const placements: PhotoPlacement[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        placements.push({
          x: marginX + col * slotWidth,
          y: marginY + row * slotHeight,
          width: slotWidth,
          height: slotHeight,
          rotation: 0 // Only rotate if you want to print rotated images
        });
      }
    }

    // Add cutting guides
    const guides: CuttingGuide[] = [];
    // Horizontal guides
    for (let row = 0; row <= rows; row++) {
      const y = marginY + row * slotHeight;
      guides.push({ type: 'horizontal', position: y, length: pageWidth });
    }
    // Vertical guides
    for (let col = 0; col <= cols; col++) {
      const x = marginX + col * slotWidth;
      guides.push({ type: 'vertical', position: x, length: pageHeight });
    }

    return {
      pageSize: { width: pageWidth, height: pageHeight, dpi: this.DPI },
      photos: placements,
      cuttingGuides: guides
    };
  }

  private getPhotoSizeInPixels(dimensions: DocumentType['dimensions']): { width: number; height: number } {
    // ALWAYS use the print DPI (this.DPI) for layout calculations,
    // ignoring the dpi potentially specified in the document dimensions (which might be for digital output).
    const { width, height, units } = dimensions;
    const printDpi = this.DPI; 
    let widthPx: number, heightPx: number;

    if (units === "mm") {
      widthPx = Math.round((width / 25.4) * printDpi);
      heightPx = Math.round((height / 25.4) * printDpi);
    } else if (units === "inch") {
      widthPx = Math.round(width * printDpi);
      heightPx = Math.round(height * printDpi);
    } else if (units === "cm") {
      widthPx = Math.round((width / 2.54) * printDpi);
      heightPx = Math.round((height / 2.54) * printDpi);
    } else { // Assume pixels - this case might be problematic for print layout, but we pass it through
      console.warn("Photo dimensions provided in pixels, print layout might be inaccurate.");
      widthPx = Math.round(width);
      heightPx = Math.round(height);
    }
    return { width: widthPx, height: heightPx };
  }

  validatePrintQuality(layout: PrintLayout): boolean {
    if (!layout?.photos || layout.photos.length === 0) return true;
    // Placeholder: Real validation needs original image data
    return true;
  }
} 