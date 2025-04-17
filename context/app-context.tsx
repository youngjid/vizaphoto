"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Country, DocumentType } from "@/data/countries"
import { countries } from "@/data/countries"

type AppContextType = {
  step: number
  setStep: (step: number) => void
  selectedCountry: Country | null
  setSelectedCountry: (country: Country | null) => void
  selectedDocument: DocumentType | null
  setSelectedDocument: (document: DocumentType | null) => void
  uploadedImage: string | null
  setUploadedImage: (image: string | null) => void
  processedImage: string | null
  setProcessedImage: (image: string | null) => void
  isProcessing: boolean
  setIsProcessing: (isProcessing: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const usCountry = countries.find(country => country.code === 'US')
  const [step, setStep] = useState(1)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(usCountry || null)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(
    usCountry?.documents[0] || null
  )
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <AppContext.Provider
      value={{
        step,
        setStep,
        selectedCountry,
        setSelectedCountry,
        selectedDocument,
        setSelectedDocument,
        uploadedImage,
        setUploadedImage,
        processedImage,
        setProcessedImage,
        isProcessing,
        setIsProcessing,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
