import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import sharp from 'sharp';

// Configure fal-ai client
fal.config({
  credentials: process.env.NEXT_PUBLIC_FAL_KEY,
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Upload the file to fal-ai storage
    const uploadedFileUrl = await fal.storage.upload(imageFile);
    
    // Process the image with background removal
    const result = await fal.subscribe("fal-ai/birefnet/v2", {
      input: {
        image_url: uploadedFileUrl,
        model: "Portrait", // Best for ID photos
        operating_resolution: "2048x2048", // Higher resolution for better quality
        output_format: "png", // Use PNG as the API only supports PNG or WebP
        refine_foreground: true
      }
    });

    // Get the processed image URL from the result
    const processedImageUrl = result.data.image.url;
    
    // Fetch the processed image
    const imageResponse = await fetch(processedImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Process the image with sharp to add white background and convert to JPG
    const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Add white background
      .jpeg({ quality: 95 }) // Convert to JPG with high quality
      .toBuffer();
    
    // Create a file with explicit JPG extension and content type
    const finalImageFile = new File(
      [processedImageBuffer], 
      'processed-image.jpg', 
      { type: 'image/jpeg' }
    );
    
    // Upload the processed image back to fal-ai storage
    const finalImageUrl = await fal.storage.upload(finalImageFile);

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl
    });
  } catch (error) {
    // Check if it's a timeout error
    const isTimeout = error instanceof Error && 
      (error.message.includes('ETIMEDOUT') || 
       error.message.includes('timeout') || 
       (error.cause && typeof error.cause === 'object' && 'code' in error.cause && error.cause.code === 'ETIMEDOUT'));
    
    if (isTimeout) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'The background removal service timed out. Please try again.',
          isTimeout: true
        },
        { status: 504 } // Gateway Timeout
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to process image. Please try again.' },
      { status: 500 }
    );
  }
} 