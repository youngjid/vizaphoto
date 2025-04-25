"use client"

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, RotateCw } from "lucide-react";
import type { PrintLayout } from "@/types/print";

interface PrintPreviewProps {
  processedImage: string;
  printLayout: PrintLayout;
  onDownload: () => void;
  onDigitalDownload: () => void;
}

export function PrintPreview({
  processedImage,
  printLayout,
  onDownload,
  onDigitalDownload
}: PrintPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  
  useEffect(() => {
    if (!canvasRef.current || !processedImage) return;
    
    setIsLoading(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to 4x6 at 300 DPI
    canvas.width = printLayout.pageSize.width;
    canvas.height = printLayout.pageSize.height;
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load and draw photos
    const img = new window.Image();
    img.onload = () => {
      setPhotoCount(printLayout.photos.length);
      
      // Draw each photo placement
      printLayout.photos.forEach(placement => {
        ctx.save();
        
        // Center the photo at its placement position
        ctx.translate(
          placement.x + placement.width / 2,
          placement.y + placement.height / 2
        );
        
        // Apply rotation if any
        if (placement.rotation !== 0) {
          ctx.rotate(placement.rotation * Math.PI / 180);
        }
        
        // Draw the photo centered at the placement position
        ctx.drawImage(
          img,
          -placement.width / 2,
          -placement.height / 2,
          placement.width,
          placement.height
        );
        
        // Draw thin border around each photo
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
      
      // Draw all guides with light dashed lines first
      ctx.strokeStyle = '#00000033';
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
      
      // Reset line dash
      ctx.setLineDash([]);
      setIsLoading(false);
    };
    
    img.src = processedImage;
  }, [processedImage, printLayout]);
  
  // Get dimensions in readable format
  const getPhotoSizeInfo = () => {
    if (!printLayout || printLayout.photos.length === 0) return '';
    
    const firstPhoto = printLayout.photos[0];
    // Calculate size in inches based on the actual placed dimensions
    const widthInInches = (firstPhoto.width / printLayout.pageSize.dpi).toFixed(2);
    const heightInInches = (firstPhoto.height / printLayout.pageSize.dpi).toFixed(2);
    
    return `${widthInInches}″ × ${heightInInches}″`;
  };
  
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left side - Original photo */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Digital Photo</h3>
              <Button onClick={onDigitalDownload} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Digital
              </Button>
            </div>
            
            <div className="relative bg-slate-50 rounded-lg p-4">
              <img 
                src={processedImage}
                alt="Original photo"
                className="w-full h-auto"
                style={{
                  maxHeight: '400px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right side - Print layout */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Print Layout (4×6 inches)</h3>
              <Button onClick={onDownload} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" />
                Download for Print
              </Button>
            </div>
            
            <div className="relative bg-slate-50 rounded-lg p-4">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50 bg-opacity-80 z-10">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
              <canvas 
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
              <div className="mt-2 text-center text-sm text-slate-500">
                <div>{`${photoCount} photos on 4×6 inch print at ${printLayout.pageSize.dpi} DPI`}</div>
                <div>{`Each photo: ${getPhotoSizeInfo()}`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 