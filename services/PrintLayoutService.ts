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

    // 1. Determine max grid & orientation
    const arrangement = this.calculateOptimalArrangement(
      photoWidthPx,
      photoHeightPx
    );

    if (arrangement.total === 0) {
        return {
            pageSize: { width: this.PAGE_WIDTH_PX, height: this.PAGE_HEIGHT_PX, dpi: this.DPI },
            photos: [],
            cuttingGuides: []
        };
    }

    const finalPhotoWidth = arrangement.isRotated ? photoHeightPx : photoWidthPx;
    const finalPhotoHeight = arrangement.isRotated ? photoWidthPx : photoHeightPx;
    const rows = arrangement.rows;
    const cols = arrangement.cols;

    // 2. Calculate space used by photos ONLY
    const totalPhotoBlockWidth = cols * finalPhotoWidth;
    const totalPhotoBlockHeight = rows * finalPhotoHeight;

    // 3. Calculate centering margins
    const horizontalMargin = (this.PAGE_WIDTH_PX - totalPhotoBlockWidth) / 2;
    const verticalMargin = (this.PAGE_HEIGHT_PX - totalPhotoBlockHeight) / 2;

    // Ensure margins are not negative (shouldn't happen with correct arrangement calc)
    if (horizontalMargin < 0 || verticalMargin < 0) {
      console.error("Layout calculation resulted in negative margins. Check arrangement logic.");
       // Fallback to a single photo if something went wrong
       return { 
            pageSize: { width: this.PAGE_WIDTH_PX, height: this.PAGE_HEIGHT_PX, dpi: this.DPI },
             photos: [{
                x: (this.PAGE_WIDTH_PX - finalPhotoWidth) / 2,
                y: (this.PAGE_HEIGHT_PX - finalPhotoHeight) / 2,
                width: finalPhotoWidth,
                height: finalPhotoHeight,
                rotation: 0
             }],
            cuttingGuides: []
        };
    }

    // 4 & 5. Calculate spacing (distribute space *within* the block if possible)
    // Spacing is currently implicitly zero as we center the entire block.
    // To add spacing, we would need to shrink the photo block slightly
    // and distribute that space. For now, prioritize max fit (edge-to-edge within the block).
    const horizontalSpacing = 0;
    const verticalSpacing = 0;

    const placements: PhotoPlacement[] = [];
    const guides: CuttingGuide[] = [];

    // Generate photo placements
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        placements.push({
          x: horizontalMargin + c * (finalPhotoWidth + horizontalSpacing),
          y: verticalMargin + r * (finalPhotoHeight + verticalSpacing),
          width: finalPhotoWidth,
          height: finalPhotoHeight,
          rotation: 0
        });
      }
    }

    // Add cutting guides based on final placements (edge-to-edge)
    this.addCuttingGuides(
      guides,
      rows,
      cols,
      horizontalMargin,
      verticalMargin,
      finalPhotoWidth,
      finalPhotoHeight
    );

    return {
      pageSize: {
        width: this.PAGE_WIDTH_PX,
        height: this.PAGE_HEIGHT_PX,
        dpi: this.DPI
      },
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

  // Calculates the max number of photos that fit, ignoring spacing/margins initially
  private calculateOptimalArrangement(
    photoWidthPx: number,
    photoHeightPx: number
  ): { rows: number; cols: number; total: number; isRotated: boolean } {
    let bestArrangement = { rows: 0, cols: 0, total: 0, isRotated: false };

    const checkFit = (pWidth: number, pHeight: number): { rows: number; cols: number; total: number } => {
      if (pWidth <= 0 || pHeight <= 0 || pWidth > this.PAGE_WIDTH_PX || pHeight > this.PAGE_HEIGHT_PX) {
        return { rows: 0, cols: 0, total: 0 };
      }
      const maxCols = Math.floor(this.PAGE_WIDTH_PX / pWidth);
      const maxRows = Math.floor(this.PAGE_HEIGHT_PX / pHeight);
      return { rows: maxRows, cols: maxCols, total: maxRows * maxCols };
    };

    // Check normal orientation
    const normalFit = checkFit(photoWidthPx, photoHeightPx);
    if (normalFit.total > bestArrangement.total) {
      bestArrangement = { ...normalFit, isRotated: false };
    }

    // Check rotated orientation
    const rotatedFit = checkFit(photoHeightPx, photoWidthPx);
    if (rotatedFit.total > bestArrangement.total) {
      bestArrangement = { ...rotatedFit, isRotated: true };
    } else if (rotatedFit.total === bestArrangement.total && bestArrangement.total > 0) {
      // If totals are equal, prefer non-rotated (already chosen if normalFit.total > 0)
      // No action needed unless normalFit.total was 0
       if (bestArrangement.total === 0) {
            bestArrangement = { ...rotatedFit, isRotated: true }; // Choose rotated if normal didn't fit at all
       }
    }

    return bestArrangement;
  }

  private addCuttingGuides(
    guides: CuttingGuide[],
    rows: number,
    cols: number,
    horizontalMargin: number,
    verticalMargin: number,
    photoWidth: number, // Use final dimensions
    photoHeight: number // Use final dimensions
  ): void {
    // Horizontal guides (at the edges of each row)
    for (let row = 0; row <= rows; row++) {
      const y = verticalMargin + row * photoHeight;
      guides.push({
        type: 'horizontal',
        position: y,
        length: this.PAGE_WIDTH_PX
      });
    }

    // Vertical guides (at the edges of each column)
    for (let col = 0; col <= cols; col++) {
      const x = horizontalMargin + col * photoWidth;
      guides.push({
        type: 'vertical',
        position: x,
        length: this.PAGE_HEIGHT_PX
      });
    }
  }

  validatePrintQuality(layout: PrintLayout): boolean {
    if (!layout?.photos || layout.photos.length === 0) return true;
    // Placeholder: Real validation needs original image data
    return true;
  }
} 