"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAppContext } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, Check, Camera, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import type { DocumentType } from "@/data/countries"
import * as faceapi from 'face-api.js/dist/face-api.js'

export function PhotoUploader() {
  const { step, setStep, selectedCountry, selectedDocument, setUploadedImage } = useAppContext()
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [modelLoadingError, setModelLoadingError] = useState<string | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectionError, setDetectionError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (step !== 2) return

    const loadModels = async () => {
      const MODEL_URL = window.location.origin + '/models'
      setModelLoadingError(null)
      setModelsLoaded(false)
      try {
        console.log('Loading face detection models in uploader...')
        console.log('Model URL:', MODEL_URL)
        // Load both detection models for better coverage
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL)
        ])
        setModelsLoaded(true)
        console.log('Face detection models loaded successfully in uploader.')
      } catch (error) {
        console.error('Error loading face detection models:', error)
        setModelLoadingError('Failed to load face detection models. Please ensure WebGL is enabled in your browser and try reloading.')
        setModelsLoaded(false)
      }
    }
    loadModels()
  }, [step])

  if (step !== 2) return null

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!modelsLoaded || isDetecting) return

    setDetectionError(null)
    setIsDetecting(true)
    setPreviewUrl(URL.createObjectURL(file))

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string

      const img = new window.Image()
      img.onload = async () => {
        try {
          console.log("Performing face detection...")
          const detection = await faceapi.detectSingleFace(
            img, 
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,      // Increased from default 320
              scoreThreshold: 0.3  // Lowered from default 0.5 for better detection
            })
          )

          if (detection) {
            console.log("Face detected!", detection)
            setUploadedImage(dataUrl)
            setStep(3)
            setPreviewUrl(null)
          } else {
            console.log("Trying fallback detection method...")
            const fallbackDetection = await faceapi.detectSingleFace(img)
            
            if (fallbackDetection) {
              console.log("Face detected with fallback method!", fallbackDetection)
              setUploadedImage(dataUrl)
              setStep(3)
              setPreviewUrl(null)
            } else {
              console.log("No face detected.")
              setDetectionError("No face detected. Please ensure your face is clearly visible and well-lit.")
              setPreviewUrl(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
            }
          }
        } catch (error) {
          console.error("Error during face detection:", error)
          setDetectionError("An error occurred during face detection. Please try again.")
          setPreviewUrl(null)
        } finally {
          setIsDetecting(false)
        }
      }
      img.onerror = () => {
        console.error("Error loading image element for detection")
        setDetectionError("Could not load the image file for analysis.")
        setIsDetecting(false)
        setPreviewUrl(null)
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      console.error("Error reading file")
      setDetectionError("Could not read the selected file.")
      setIsDetecting(false)
      setPreviewUrl(null)
    }
    reader.readAsDataURL(file)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  const formatDimensions = (dimensions: DocumentType["dimensions"]) => {
    return `${dimensions.width} × ${dimensions.height} ${dimensions.units}`
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">Upload Photo</h2>
          {selectedDocument && selectedCountry && (
            <div className="inline-block bg-gray-100 text-orange-600 text-sm rounded px-3 py-1 font-semibold">
              {selectedDocument.name} {selectedDocument.dimensions && `(${formatDimensions(selectedDocument.dimensions)})`} <span className="text-slate-700 font-normal">| {selectedCountry.name}</span>
              {selectedCountry.flag && (
                <Image
                  src={selectedCountry.flag}
                  alt={`${selectedCountry.name} flag`}
                  width={20}
                  height={14}
                  className="inline-block ml-2 align-middle"
                />
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(1)}>
            Back
          </Button>
          <Button onClick={handleButtonClick} disabled={isDetecting || !modelsLoaded}>
            <Camera className="mr-2 h-4 w-4" />
            Take or Upload Photo
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upload your photo</CardTitle>
            <CardDescription>Drag and drop or click to upload</CardDescription>
          </CardHeader>
          <CardContent>
            {!modelsLoaded && !modelLoadingError && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Loading face detection...</p>
              </div>
            )}
            {modelLoadingError && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-red-300 rounded-lg p-4 bg-red-50 text-red-700">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="font-semibold">Error loading model</p>
                <p className="text-sm text-center mb-3">{modelLoadingError}</p>
                <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>Reload Page</Button>
              </div>
            )}

            {modelsLoaded && !modelLoadingError && (
              <div
                className={`relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-4 transition-colors ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
                } ${isDetecting ? "opacity-50 cursor-not-allowed" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {isDetecting && (
                  <div className="absolute inset-0 bg-slate-900/50 flex flex-col items-center justify-center z-10 rounded-lg">
                    <Loader2 className="h-8 w-8 text-white animate-spin mb-2" />
                    <p className="text-white">Detecting face...</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg, image/png, image/webp, image/bmp"
                  onChange={handleChange}
                  className="hidden"
                  id="file-upload"
                  disabled={isDetecting || !modelsLoaded}
                />

                {previewUrl ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image src={previewUrl} alt="Preview" layout="fill" objectFit="contain" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-lg font-medium">Drag a photo here or click</p>
                    <p className="text-sm text-slate-500 mt-1 mb-2">JPG, PNG, WEBP, BMP</p>
                    <Button
                      onClick={handleButtonClick}
                      disabled={isDetecting || !modelsLoaded}
                      className="mt-2"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Photo
                    </Button>
                    {detectionError && (
                      <p className="text-sm text-red-600 mt-3 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {detectionError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Uploading requirements</CardTitle>
            <CardDescription>Follow these guidelines for best results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-green-200 bg-green-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Frontal portrait"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-green-500 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Frontal portrait</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-red-200 bg-red-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Not full face"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Not full face</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-red-200 bg-red-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Unnatural expressions"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Unnatural expressions</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-red-200 bg-red-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="High resolution"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Low resolution</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-red-200 bg-red-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Wearing glasses"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Wearing glasses</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-full pt-[100%] rounded-md overflow-hidden border border-red-200 bg-red-50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/placeholder.svg?height=100&width=100"
                      alt="Headwear"
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-red-500 rounded-full p-1">
                      <X className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                <span className="text-xs mt-1 text-center">Headwear</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
