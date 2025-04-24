import React, { useState, useRef, useEffect } from "react"
// Remove explicit TFJS imports
// import '@tensorflow/tfjs'; 
// import '@tensorflow/tfjs-backend-webgl';
// Import directly from the browser bundle
import * as faceapi from 'face-api.js/dist/face-api.js'; 
import type { DocumentType } from "@/data/countries"
import type {
  GridLinesState,
  BoxDimensions,
  ImageState,
  DragState,
  BackgroundRemovalState,
  CanvasDimensions
} from "../types"
import { drawImage } from "../utils/canvas"

// Use original type definition (assuming face-api.js types are installed/resolved)
// Revert FaceDetectionResult definition temporarily if namespace errors persist
// type FaceDetectionResult = faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>
interface FaceDetectionResult { detection: any; landmarks: any; }

// Helper function to get center point of landmarks
const getCenterPoint = (landmarks: any[]) => {
  if (!landmarks || landmarks.length === 0) {
    return { x: 0, y: 0 };
  }
  const x = landmarks.reduce((sum, point) => sum + point.x, 0) / landmarks.length;
  const y = landmarks.reduce((sum, point) => sum + point.y, 0) / landmarks.length;
  return { x, y };
};

export const usePhotoEditor = (
  uploadedImage: string | null,
  selectedDocument: DocumentType | null,
  step: number
) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Canvas dimensions
  const canvasDimensions: CanvasDimensions = {
    displayWidth: 500,
    displayHeight: 500,
    highResWidth: 2000,
    highResHeight: 2000,
  }

  // State
  const [gridLines, setGridLines] = useState<GridLinesState>({
    topLine: 0.3,
    middleLine: 0.5,
    bottomLine: 0.7,
    centerLine: 0.5,
  })

  const [boxDimensions, setBoxDimensions] = useState<BoxDimensions>({
    top: 0,
    height: 0,
    width: 0,
    left: 0,
  })

  const [imageState, setImageState] = useState<ImageState>({
    zoom: 1,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    originalWidth: 0,
    originalHeight: 0,
  })

  const [dragState, setDragState] = useState<DragState>({
    activeLine: null,
    isDragging: false,
  })

  const [backgroundState, setBackgroundState] = useState<BackgroundRemovalState>({
    removeBackground: false,
    isRemovingBackground: false,
  })

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult | null>(null);
  const [autoRotationAngle, setAutoRotationAngle] = useState(0);

  // Calculate initial zoom to fit image in view
  const calculateInitialZoom = (imgWidth: number, imgHeight: number) => {
    if (!canvasRef.current) return 1

    const canvas = canvasRef.current
    const canvasAspect = canvas.width / canvas.height
    const imageAspect = imgWidth / imgHeight

    if (imageAspect > canvasAspect) {
      return (canvas.width * 0.9) / imgWidth
    } else {
      return (canvas.height * 0.9) / imgHeight
    }
  }

  // Calculate initial grid line positions based on document specifications
  const calculateInitialGridLines = (document: DocumentType) => {
    if (!document) return
    
    const { faceHeight, crownTop = 0, bottomEyeLine = faceHeight * 0.85 } = document.dimensions
    
    const normalizedFaceHeight = faceHeight / document.dimensions.height
    const normalizedCrownTop = crownTop / document.dimensions.height
    const normalizedBottomEyeLine = bottomEyeLine / document.dimensions.height
    
    setGridLines({
      topLine: 0.5 - normalizedFaceHeight / 2 + normalizedCrownTop,
      middleLine: 0.5 - normalizedFaceHeight / 2 + normalizedBottomEyeLine,
      bottomLine: 0.5 + normalizedFaceHeight / 2,
      centerLine: 0.5,
    })
  }

  // Initialize canvas dimensions
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasDimensions.displayWidth
      canvasRef.current.height = canvasDimensions.displayHeight

      // Initialize with white background
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvasDimensions.displayWidth, canvasDimensions.displayHeight)
      }
    }
    if (highResCanvasRef.current) {
      highResCanvasRef.current.width = canvasDimensions.highResWidth
      highResCanvasRef.current.height = canvasDimensions.highResHeight
    }
  }, [])  // Only run once on mount

  // Calculate initial grid lines when document changes
  useEffect(() => {
    if (selectedDocument) {
      calculateInitialGridLines(selectedDocument)
    }
  }, [selectedDocument])

  // Load models (no longer dependent on tfBackendReady)
  useEffect(() => {
    // if (!tfBackendReady) return; // Remove backend check

    const loadModels = async () => {
      const MODEL_URL = '/models';
      setModelLoadingError(null);
      setModelsLoaded(false); 
      try {
        console.log('Loading face detection models...');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), // Use static faceapi
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // Use static faceapi
        ]);
        setModelsLoaded(true);
        console.log('Face detection models loaded successfully.');
      } catch (error) {
        console.error('Error loading face detection models:', error);
        setModelLoadingError('Failed to load face detection models. Please try reloading.');
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []); // Revert dependencies to just mount

  // Load image, detect face, calculate rotation, THEN calculate guidelines
  useEffect(() => {
    if (!uploadedImage || step !== 3) {
      // Reset detection state
      setDetectionResult(null);
      setAutoRotationAngle(0);
      // Don't reset gridLines here, keep document defaults until face detected
      setImageState((prev: ImageState) => ({ ...prev, rotation: 0 }));
      return;
    }
    if (!modelsLoaded) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      imageRef.current = img;
      const initialZoom = calculateInitialZoom(img.width, img.height);
      // Apply initial zoom but reset rotation
      setImageState((prev: ImageState) => ({ 
        ...prev,
        originalWidth: img.width,
        originalHeight: img.height,
        zoom: initialZoom,
        scale: initialZoom,
        rotation: 0, 
      }));
      setAutoRotationAngle(0);
      setDetectionResult(null);
      // Reset guidelines to document defaults initially
      if (selectedDocument) calculateInitialGridLines(selectedDocument);

      // --- Perform INITIAL face detection for ROTATION --- 
      setIsDetecting(true);
      console.log("Performing initial face detection for rotation...");
      let detectedRotation = 0;
      try {
        const detection = await faceapi 
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()) 
          .withFaceLandmarks();

        if (detection) {
          console.log("Initial face detected:", detection);
          // Calculate rotation angle (negated)
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const leftEyeCenter = getCenterPoint(leftEye);
          const rightEyeCenter = getCenterPoint(rightEye);
          const deltaY = rightEyeCenter.y - leftEyeCenter.y;
          const deltaX = rightEyeCenter.x - leftEyeCenter.x;
          const angleInRadians = Math.atan2(deltaY, deltaX);
          detectedRotation = -(angleInRadians * (180 / Math.PI)); // Negate here
          console.log(`Calculated rotation angle (adjusted): ${detectedRotation.toFixed(2)} degrees`);
          setAutoRotationAngle(detectedRotation);
          
          // --- Apply auto-rotation --- 
          setImageState((prev: ImageState) => ({ 
            ...prev,
            rotation: detectedRotation 
          }));
          
          // Now, we need to detect again on the rotated image for accurate guideline placement
          // This will be handled in a separate effect triggered by rotation change

        } else {
          console.log("No face detected for rotation.");
          // Keep default rotation (0) and default guidelines
        }
      } catch (error) {
        console.error("Error during initial face detection:", error);
      } finally {
        // Don't set isDetecting false yet, guideline detection follows
      }
      // --- End initial detection ---
    };

    img.onerror = () => {
      console.error("Error loading image");
      setIsDetecting(false); 
    }

    img.src = uploadedImage;

    return () => { imageRef.current = null; };
  }, [uploadedImage, step, modelsLoaded, selectedDocument]); // Add selectedDocument

  // --- Effect to Calculate Guidelines AFTER Rotation is Set --- 
  useEffect(() => {
    // Run only if we have a loaded image, models, and canvas
    if (!imageRef.current || !modelsLoaded || !canvasRef.current || !faceapi) {
      setIsDetecting(false); // Ensure detection stops if dependencies missing
      return;
    }
    // Only run guideline detection after initial detection tried (indicated by isDetecting)
    // and image is loaded
    if (!isDetecting) return; 

    console.log("Calculating guidelines based on current rotation...");
    const calculateAndSetGuidelines = async () => {
      try {
        const canvas = canvasRef.current!;
        const image = imageRef.current!;
        
        // Create a temporary canvas to draw the rotated/scaled image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width; // Use display dimensions
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Draw the image onto the temp canvas using the current state (rotation, zoom)
        // Mimic drawImage logic but on temp canvas
        const scale = imageState.zoom;
        const imgWidth = image.naturalWidth * scale;
        const imgHeight = image.naturalHeight * scale;
        const centerX = tempCanvas.width / 2;
        const centerY = tempCanvas.height / 2;
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.save();
        tempCtx.translate(centerX, centerY);
        tempCtx.rotate((imageState.rotation * Math.PI) / 180);
        // Use naturalWidth/Height here for source image dimensions
        tempCtx.drawImage(image, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        tempCtx.restore();
        
        // --- Detect face on the TRANSFORMED image --- 
        console.log("Performing detection on transformed image for guidelines...");
        // Use 'any' for faceapi temporarily if namespace errors persist
        const faceapiAny = faceapi as any;
        const rotatedDetection = await faceapiAny
          .detectSingleFace(tempCanvas, new faceapiAny.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (rotatedDetection) {
          console.log("Face detected on transformed image:", rotatedDetection);
          const landmarks = rotatedDetection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const nose = landmarks.getNose();
          const jaw = landmarks.getJawOutline();

          // Calculate guideline positions based on these landmarks (now relative to canvas)
          const eyeLevelY = (getCenterPoint(leftEye).y + getCenterPoint(rightEye).y) / 2;
          const chinY = jaw[8].y; // Bottom of jawline
          const eyeToChinDistance = chinY - eyeLevelY;
          // Ensure crown doesn't go above 0
          const crownY = Math.max(0, eyeLevelY - (eyeToChinDistance * 0.8)); 
          // Use nose bridge or similar for center X
          const centerX = nose[3].x; // Point on the nose bridge

          // Normalize to [0, 1] based on canvas dimensions
          const normTopLine = crownY / tempCanvas.height;
          const normMiddleLine = eyeLevelY / tempCanvas.height;
          const normBottomLine = chinY / tempCanvas.height;
          const normCenterLine = centerX / tempCanvas.width;

          console.log("Setting new gridlines:", { normTopLine, normMiddleLine, normBottomLine, normCenterLine });
          
          // Update the gridLines state
          setGridLines({
            topLine: normTopLine,
            middleLine: normMiddleLine,
            bottomLine: normBottomLine,
            centerLine: normCenterLine,
          });

        } else {
          console.log("No face detected on transformed image, using default guidelines.");
          // Optionally reset to default if no face found after rotation
          if (selectedDocument) calculateInitialGridLines(selectedDocument);
        }
      } catch (error) {
        console.error("Error during guideline calculation detection:", error);
        // Optionally reset to default on error
        if (selectedDocument) calculateInitialGridLines(selectedDocument);
      } finally {
        setIsDetecting(false); // Detection process finished
        console.log("Guideline calculation finished.");
      }
    };
    
    // Debounce or delay slightly to allow rotation state to apply? Maybe not needed.
    calculateAndSetGuidelines();

  // Trigger this effect when the auto-rotation angle is determined, 
  // or if the image or models change.
  // Using imageState.rotation ensures it runs after rotation is applied.
  }, [imageState.rotation, imageRef.current, modelsLoaded, canvasRef.current, faceapi, selectedDocument]); 

  // Calculate box dimensions when lines or document changes
  useEffect(() => {
    if (!selectedDocument || !canvasRef.current) return

    const canvas = canvasRef.current
    const height = canvas.height
    const width = canvas.width

    const faceHeight = (gridLines.bottomLine - gridLines.topLine) * height
    const calculatedBoxHeight = faceHeight / 0.7
    const documentAspectRatio = selectedDocument.dimensions.width / selectedDocument.dimensions.height
    const calculatedBoxWidth = calculatedBoxHeight * documentAspectRatio
    const calculatedBoxLeft = gridLines.centerLine * width - calculatedBoxWidth / 2
    const eyePositionInBox = 0.45
    const calculatedBoxTop = gridLines.middleLine * height - calculatedBoxHeight * eyePositionInBox

    setBoxDimensions({
      height: calculatedBoxHeight,
      width: calculatedBoxWidth,
      left: calculatedBoxLeft,
      top: calculatedBoxTop,
    })
  }, [gridLines, selectedDocument, canvasRef])

  return {
    canvasRef,
    imageRef,
    highResCanvasRef,
    canvasDimensions,
    gridLines,
    setGridLines,
    boxDimensions,
    imageState,
    setImageState,
    dragState,
    setDragState,
    backgroundState,
    setBackgroundState,
    calculateInitialGridLines,
    modelsLoaded,
    modelLoadingError,
    isDetecting,
    detectionResult,
    autoRotationAngle,
  }
} 