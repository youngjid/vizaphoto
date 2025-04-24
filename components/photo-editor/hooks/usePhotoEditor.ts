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
type FaceDetectionResult = faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }, faceapi.FaceLandmarks68>

// Helper function to get center point of landmarks
const getCenterPoint = (landmarks: faceapi.Point[]) => {
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

  // Load image and perform face detection (dependent on modelsLoaded)
  useEffect(() => {
    if (!uploadedImage || step !== 3) {
      // Reset detection state
      setDetectionResult(null);
      setAutoRotationAngle(0);
      setImageState((prev: ImageState) => ({ ...prev, rotation: 0 }));
      return;
    }
    if (!modelsLoaded) return; 

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      imageRef.current = img;
      const initialZoom = calculateInitialZoom(img.width, img.height);
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

      // --- Perform face detection --- 
      setIsDetecting(true);
      console.log("Performing face detection...");
      try {
        // Use static faceapi
        const detection = await faceapi 
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()) 
          .withFaceLandmarks();

        if (detection) {
          // Use static faceapi types
          const typedDetection = detection; // No assertion needed with static types
          console.log("Face detected:", typedDetection);
          setDetectionResult(typedDetection);

          const landmarks = typedDetection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const leftEyeCenter = getCenterPoint(leftEye);
          const rightEyeCenter = getCenterPoint(rightEye);
          const deltaY = rightEyeCenter.y - leftEyeCenter.y;
          const deltaX = rightEyeCenter.x - leftEyeCenter.x;
          const angleInRadians = Math.atan2(deltaY, deltaX);
          let angleInDegrees = angleInRadians * (180 / Math.PI);

          // <-- Try negating the angle -->
          angleInDegrees = -angleInDegrees;

          console.log(`Calculated rotation angle (adjusted): ${angleInDegrees.toFixed(2)} degrees`);
          setAutoRotationAngle(angleInDegrees); 

          // Apply auto-rotation
          setImageState((prev: ImageState) => ({ 
            ...prev,
            rotation: angleInDegrees 
          }));

          // TODO: Calculate detected guideline positions based on landmarks
          // const nose = landmarks.getNose();
          // const jaw = landmarks.getJawOutline();
          // ... calculate guideline positions ...
          // setDetectedGuidelines(...) 

        } else {
          console.log("No face detected.");
          setDetectionResult(null);
          setAutoRotationAngle(0);
          setImageState((prev: ImageState) => ({ ...prev, rotation: 0 }));
        }
      } catch (error) {
        console.error("Error during face detection:", error);
        setDetectionResult(null);
        setAutoRotationAngle(0);
        setImageState((prev: ImageState) => ({ ...prev, rotation: 0 }));
      } finally {
        setIsDetecting(false);
        console.log("Face detection finished.");
      }
      // --- End face detection ---
    }

    img.onerror = () => {
      console.error("Error loading image for detection");
      setIsDetecting(false); // Ensure loading state is turned off
    }

    img.src = uploadedImage

    return () => {
      imageRef.current = null
      // Cleanup if needed
    }
  }, [uploadedImage, step, modelsLoaded]) // Revert dependencies

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