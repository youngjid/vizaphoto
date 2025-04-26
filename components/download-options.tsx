"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Image from "next/image"
import { PrintLayoutService } from "@/services/PrintLayoutService"
import { PrintPreview } from "./print-preview"
import type { PrintLayout } from "@/types/print"

export function DownloadOptions() {
  const { step, setStep, selectedCountry, selectedDocument, processedImage } = useAppContext()
  const [printLayout, setPrintLayout] = useState<PrintLayout | null>(null)

  // Initialize or reset print layout based on step and data
  useEffect(() => {
    if (step === 4 && processedImage && selectedDocument) {
      // Avoid recalculating if layout already exists for the current doc/image
      if (!printLayout) {
        console.log("Calculating print layout..."); // Added for debugging
        const printLayoutService = new PrintLayoutService();
        setPrintLayout(printLayoutService.calculateLayout(selectedDocument));
      }
    } else {
      // Reset layout if step changes or data is missing
      if (printLayout) {
        console.log("Resetting print layout..."); // Added for debugging
        setPrintLayout(null);
      }
    }
    // Dependencies: Recalculate only when step, image, or document changes.
    // Excluded printLayout from deps to prevent loops after setting it.
  }, [step, processedImage, selectedDocument]);

  // Early return *after* all hooks have been called
  if (step !== 4 || !processedImage) {
    return null;
  }

  // Get the actual photo dimensions based on document type
  const getPhotoSize = () => {
    if (!selectedDocument) return "";
    const { width, height, units } = selectedDocument.dimensions;
    return `${width}×${height} ${units}`;
  }

  const handleDigitalDownload = () => {
    if (!processedImage) return; // Guard clause

    // Create a temporary image element to load the image
    const img = new window.Image(); // Use window.Image to avoid conflict with Next.js Image
    img.crossOrigin = 'anonymous'; // Enable CORS if needed
    img.onload = () => {
      // Create a canvas to draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vizaphoto-${selectedCountry?.code}-${selectedDocument?.id}-digital.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    };
    img.onerror = () => {
      // Fallback to direct download if canvas approach fails
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `vizaphoto-${selectedCountry?.code}-${selectedDocument?.id}-digital.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    // Add a timestamp to prevent caching, but only for non-data URLs
    let imgSrc = processedImage;
    const isDataUrl = imgSrc.startsWith('data:');
    if (!isDataUrl) {
      imgSrc += `?t=${Date.now()}`;
    }
    img.src = imgSrc;
  }

  const handlePrintDownload = () => {
    if (!printLayout || !processedImage || !selectedDocument) return;

    const canvas = document.createElement('canvas');
    canvas.width = printLayout.pageSize.width;
    canvas.height = printLayout.pageSize.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw the image (use same logic as digital download)
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw each photo placement
      printLayout.photos.forEach(placement => {
        ctx.save();
        ctx.translate(
          placement.x + placement.width / 2,
          placement.y + placement.height / 2
        );
        ctx.drawImage(
          img,
          -placement.width / 2,
          -placement.height / 2,
          placement.width,
          placement.height
        );
        ctx.strokeStyle = '#00000022';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          -placement.width / 2,
          -placement.height / 2,
          placement.width,
          placement.height
        );
        ctx.restore();
      });
      // Draw cutting guides
      ctx.strokeStyle = '#00000022';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      printLayout.cuttingGuides.forEach(guide => {
        ctx.beginPath();
        if (guide.type === 'horizontal') {
          ctx.moveTo(0, guide.position);
          ctx.lineTo(guide.length, guide.position);
        } else {
          ctx.moveTo(guide.position, 0);
          ctx.lineTo(guide.position, guide.length);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vizaphoto-${selectedCountry?.code}-${selectedDocument?.id}-4x6-print.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/jpeg', 0.95);
    };
    img.onerror = () => {
      console.error("Failed to load image for print download canvas.");
      // Fallback to direct download if canvas approach fails
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = `vizaphoto-${selectedCountry?.code}-${selectedDocument?.id}-4x6-print.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    // Add a timestamp to prevent caching, but only for non-data URLs
    let imgSrc = processedImage;
    const isDataUrl = imgSrc.startsWith('data:');
    if (!isDataUrl) {
      imgSrc += `?t=${Date.now()}`;
    }
    img.src = imgSrc;
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Download Options</h2>
        <div className="text-sm text-slate-500 flex items-center gap-2">
          {selectedDocument?.name} ({getPhotoSize()}) for {selectedCountry?.name}{" "}
          {selectedCountry?.flag && (
            <Image
              src={selectedCountry.flag}
              alt={`${selectedCountry.name} flag`}
              width={24}
              height={16}
              className="inline-block"
            />
          )}
        </div>
      </div>

      {/* Conditional rendering based on printLayout being calculated */}
      {printLayout ? (
        <PrintPreview
          processedImage={processedImage}
          printLayout={printLayout}
          onDownload={handlePrintDownload}
          onDigitalDownload={handleDigitalDownload}
        />
      ) : (
        <div className="flex justify-center items-center h-64">
          {/* Optional: Add a loading indicator here */}
          <p>Calculating print layout...</p>
        </div>
      )}

      <div className="mt-6">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <h4 className="font-medium mb-2">Photo Specifications</h4>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>Document: {selectedDocument?.name}</li>
                <li>Country: {selectedCountry?.name}</li>
                <li>Physical size: {getPhotoSize()}</li>
                <li>Digital size: {selectedDocument && `${Math.round((selectedDocument.dimensions.width / (selectedDocument.dimensions.units === "mm" ? 25.4 : 1)) * selectedDocument.dimensions.dpi)}×${Math.round((selectedDocument.dimensions.height / (selectedDocument.dimensions.units === "mm" ? 25.4 : 1)) * selectedDocument.dimensions.dpi)} pixels at ${selectedDocument.dimensions.dpi} DPI`}</li>
                <li>Background color: {selectedDocument?.backgroundColor === "#ffffff" ? "White" : selectedDocument?.backgroundColor === "#eeeeee" ? "Light gray" : selectedDocument?.backgroundColor}</li>
                <li>Format: JPG</li>
              </ul>
              {selectedDocument?.officialLinks && selectedDocument.officialLinks.length > 0 && (
                <>
                  <h4 className="font-medium mb-2">Official Resources</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {selectedDocument.officialLinks.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Official document requirements
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>

      {/* Digital Photo Section */}
      <div className="relative w-full h-full flex items-center justify-center">
        {!processedImage ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-blue-600" />
            <p className="text-blue-800 font-medium">Preparing digital photo...</p>
          </div>
        ) : (
          <img
            src={processedImage}
            alt="Digital Photo"
            className="max-w-full max-h-96 rounded shadow"
          />
        )}
      </div>
    </div>
  )
}
