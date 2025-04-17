"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAppContext } from "@/context/app-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, X, Check, Camera } from "lucide-react"
import Image from "next/image"
import type { DocumentType } from "@/data/countries"

export function PhotoUploader() {
  const { step, setStep, selectedCountry, selectedDocument, setUploadedImage, setIsProcessing } = useAppContext()
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      if (event && event.target && event.target.result) {
        setUploadedImage(event.target.result as string)
        setStep(3)
      }
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
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <span>{selectedDocument?.name} {selectedDocument && `(${formatDimensions(selectedDocument.dimensions)})`}</span>
          <span>|</span>
          <span>{selectedCountry?.name}</span>
          {selectedCountry?.flag && (
            <Image
              src={selectedCountry.flag}
              alt={`${selectedCountry.name} flag`}
              width={24}
              height={16}
              className="inline-block"
            />
          )}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upload your photo</CardTitle>
            <CardDescription>Drag and drop or click to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-4 transition-colors ${
                dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
              />

              <div className="flex flex-col items-center justify-center text-center">
                <Upload className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-lg font-medium">Drag a photo here to upload</p>
                <p className="text-sm text-slate-500 mt-1 mb-4">JPG, PNG, JPEG, BMP, WEBP</p>
                <Button onClick={handleButtonClick} className="mt-2">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>
            </div>
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

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button onClick={handleButtonClick}>
          <Camera className="mr-2 h-4 w-4" />
          Take or Upload Photo
        </Button>
      </div>
    </div>
  )
}
