import { useState, useRef, useEffect } from "react"
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

// Define a type for landmark points
type LandmarkPoint = { x: number; y: number };

// Helper function to get center point of landmarks
const getCenterPoint = (landmarks: LandmarkPoint[]) => {
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
  step: number,
  onAutoRotation?: (rotation: number) => void
) => {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const highResCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Canvas dimensions
  const canvasDimensions: CanvasDimensions = {
    displayWidth: 600,
    displayHeight: 600,
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
    initialZoom: 1,
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
  // Add state to track if initial alignment is done
  const [isInitialAlignmentDone, setIsInitialAlignmentDone] = useState(false);
  // Add state to manually trigger recalculation
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);

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

  // Load models (only landmark model needed now)
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = window.location.origin + '/models';
      setModelLoadingError(null);
      setModelsLoaded(false);
      try {
        console.log('Loading face landmark model...');
        console.log('Model URL:', MODEL_URL);
        // Only load the landmark model needed for guidelines
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        console.log('Face landmark model loaded successfully.');
      } catch (error) {
        console.error('Error loading face landmark model:', error);
        setModelLoadingError('Failed to load face landmark model. Please ensure WebGL is enabled in your browser and try reloading.');
        setModelsLoaded(false);
      }
    };
    loadModels();
  }, []); // Load only on mount

  // --- Effect to Load Image and Calculate ROTATION ---
  useEffect(() => {
    // Run only if we have an image, models, and are on the correct step
    // No canvas check needed here yet
    if (!uploadedImage || step !== 3 || !modelsLoaded || !faceapi) {
      // Reset state if dependencies change or step is wrong
      imageRef.current = null;
      setImageState((prev) => ({ ...prev, rotation: 0, originalWidth: 0, originalHeight: 0, zoom: 1, scale: 1, initialZoom: 1 }));
      // Reset initial alignment flag
      setIsInitialAlignmentDone(false);
      // Reset trigger counter
      setRecalculationTrigger(0);
      // Don't reset guidelines here, let the other effect handle defaults
      // if (selectedDocument) calculateInitialGridLines(selectedDocument);
      // No need to set isDetecting false here, handled by guideline effect
      // setIsDetecting(false);
      return;
    }

    console.log("Loading image and calculating rotation...");
    // Don't set isDetecting true here, only for guideline calculation
    // setIsDetecting(true);

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = async () => {
      imageRef.current = img;
      const initialZoom = calculateInitialZoom(img.width, img.height);

      // Set initial image state, including initialZoom
      setImageState((prev: ImageState) => ({
        ...prev,
        originalWidth: img.width,
        originalHeight: img.height,
        zoom: initialZoom,
        scale: initialZoom,
        rotation: 0,
        initialZoom: initialZoom,
      }));
      // Reset guidelines to document defaults initially
      if (selectedDocument) calculateInitialGridLines(selectedDocument);

      let calculatedRotation = 0;

      try {
        console.log("Performing detection for rotation and landmarks...");
        // Detect face with landmarks using the loaded model
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()) // Still need a basic detector option here
          .withFaceLandmarks();

        if (detection) {
          console.log("Face detected for rotation/guidelines:", detection);

          // Calculate rotation angle
          const landmarks = detection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const leftEyeCenter = getCenterPoint(leftEye);
          const rightEyeCenter = getCenterPoint(rightEye);
          const deltaY = rightEyeCenter.y - leftEyeCenter.y;
          const deltaX = rightEyeCenter.x - leftEyeCenter.x;
          const angleInRadians = Math.atan2(deltaY, deltaX);
          calculatedRotation = -(angleInRadians * (180 / Math.PI)); // Negate
          console.log(`Calculated rotation angle: ${calculatedRotation.toFixed(2)} degrees`);

          // --- Apply auto-rotation ---
          setImageState((prev: ImageState) => ({
            ...prev,
            rotation: calculatedRotation
          }));
          if (onAutoRotation) onAutoRotation(calculatedRotation);

        } else {
          console.log("No face detected for rotation/guidelines. Using defaults.");
          // Keep default rotation (0) and default guidelines
        }

      } catch (error) {
        console.error("Error during initial face/landmark detection:", error);
        // Keep defaults on error
      } finally {
        // Set detecting false AFTER rotation is attempted/set
        // Mark initial alignment as done regardless of detection success
        setIsInitialAlignmentDone(true);
        // This will trigger the guideline calculation effect
        // If rotation was set, that effect uses it.
        // If not, it uses 0 rotation.
        // setIsDetecting(false); // Moved to guideline effect
      }

      // --- Guideline calculation is MOVED to a separate effect ---

    };

    img.onerror = () => {
      console.error("Error loading image");
      // setIsDetecting(false); // Moved to guideline effect
      // Maybe set an error state here?
    };

    img.src = uploadedImage;

    return () => {
      imageRef.current = null;
    };
    // Dependencies: Run when the image, step, or models changes.
    // REMOVED canvasRef from dependencies here.
  }, [uploadedImage, step, modelsLoaded, selectedDocument]);

  // --- NEW Effect to Calculate Guidelines AFTER Rotation is Set ---
  useEffect(() => {
    // Run only AFTER initial alignment attempt is done, AND we have image/canvas/models, and are on step 3
    if (!isInitialAlignmentDone || step !== 3 || !imageRef.current || !canvasRef.current || !modelsLoaded || !faceapi) {
      // If dependencies aren't ready, ensure detection stops
      if (isDetecting) setIsDetecting(false);
      return;
    }

    // If already detecting, don't start again (prevent potential loops)
    if (isDetecting) return;

    console.log("Calculating guidelines based on current rotation...");
    setIsDetecting(true); // Start detection state here

    const calculateAndSetGuidelines = async () => {
      try {
        const canvas = canvasRef.current!;
        const image = imageRef.current!;

        // Create a temporary canvas to draw the rotated/scaled image
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width; // Use display dimensions
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d')!;

        // Draw the image onto the temp canvas using the CURRENT state (rotation, zoom)
        // This state should be stable now because this effect runs AFTER rotation is set
        const scale = imageState.scale; // Use current scale from state
        const rotation = imageState.rotation; // Use current rotation from state
        const imgWidth = image.naturalWidth * scale;
        const imgHeight = image.naturalHeight * scale;
        const centerX = tempCanvas.width / 2;
        const centerY = tempCanvas.height / 2;
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.save();
        tempCtx.translate(centerX, centerY);
        tempCtx.rotate((rotation * Math.PI) / 180); // Apply current rotation
        tempCtx.drawImage(image, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        tempCtx.restore();

        // --- Detect face AGAIN on the TRANSFORMED image for accurate guideline placement ---
        console.log("Performing detection on transformed image for guidelines...");
        const rotatedDetection = await faceapi
          .detectSingleFace(tempCanvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (rotatedDetection) {
          console.log("Face detected on transformed image:", rotatedDetection);
          const landmarks = rotatedDetection.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const nose = landmarks.getNose();
          const jaw = landmarks.getJawOutline();

          const eyeLevelY = (getCenterPoint(leftEye).y + getCenterPoint(rightEye).y) / 2;
          const chinY = jaw[8].y;

          // Estimate crown (P) based on nose bridge (M) and chin (Q) distance
          const noseTopY = nose[0].y; // Approx M point Y
          const chinPointY = chinY;   // Approx Q point Y
          const chinToNoseYDist = chinPointY - noseTopY; // Distance MQ
          // Estimate crown Y = M.y - MQ distance
          const crownY = Math.max(0, noseTopY - chinToNoseYDist);

          const centerPointX = nose[3].x; // Use nose bridge point for center X

          const normTopLine = crownY / tempCanvas.height;
          const normMiddleLine = eyeLevelY / tempCanvas.height;
          const normBottomLine = chinY / tempCanvas.height;
          const normCenterLine = centerPointX / tempCanvas.width;

          console.log("Setting new gridlines:", { normTopLine, normMiddleLine, normBottomLine, normCenterLine });

          setGridLines({
            topLine: normTopLine,
            middleLine: normMiddleLine,
            bottomLine: normBottomLine,
            centerLine: normCenterLine,
          });

        } else {
          console.log("No face detected on transformed image, using default guidelines.");
          if (selectedDocument) calculateInitialGridLines(selectedDocument);
        }
      } catch (error) {
        console.error("Error during guideline calculation detection:", error);
        if (selectedDocument) calculateInitialGridLines(selectedDocument);
      } finally {
        setIsDetecting(false); // Detection process finished
        console.log("Guideline calculation finished.");
      }
    };

    // Call the async function
    calculateAndSetGuidelines();

    // Dependencies: Run when initial alignment is marked done, or other core elements needed for calculation change.
  }, [isInitialAlignmentDone, recalculationTrigger, imageRef, canvasRef, modelsLoaded, faceapi, step, selectedDocument, imageState, calculateInitialGridLines, setGridLines, isDetecting, setIsDetecting]);

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
    isInitialAlignmentDone,
    triggerGuidelineRecalculation: () => setRecalculationTrigger(prev => prev + 1),
  }
}