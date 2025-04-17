"use client"

import { useAppContext } from "@/context/app-context"
import { Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function StepIndicator() {
  const { step, setStep, selectedCountry, selectedDocument, uploadedImage, processedImage } = useAppContext()

  const steps = [
    { id: 1, name: "Choose country" },
    { id: 2, name: "Upload photo" },
    { id: 3, name: "Edit photo" },
    { id: 4, name: "Download" },
  ]

  const canNavigateToStep = (stepId: number) => {
    if (stepId === 1) return true
    if (stepId === 2) return !!selectedCountry && !!selectedDocument
    if (stepId === 3) return !!uploadedImage
    if (stepId === 4) return !!processedImage
    return false
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <nav aria-label="Progress">
        <ol className="flex items-center">
          {steps.map((s, i) => (
            <li key={s.id} className={`relative ${i === steps.length - 1 ? "flex-1" : "flex-1 pr-8"}`}>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    step > s.id 
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600 hover:text-white" 
                      : step === s.id
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-600 hover:text-white"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  } ${!canNavigateToStep(s.id) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  onClick={() => canNavigateToStep(s.id) && setStep(s.id)}
                  disabled={!canNavigateToStep(s.id)}
                >
                  {step > s.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{s.id}</span>
                  )}
                </Button>
                <span
                  className={`ml-3 text-sm font-medium ${
                    step === s.id || step > s.id
                      ? "text-blue-600" 
                      : "text-slate-600"
                  }`}
                >
                  {s.name}
                </span>
              </div>
              {i !== steps.length - 1 && (
                <div className="absolute top-4 right-0 hidden md:block">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
