"use client"

import { useAppContext } from "@/context/app-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import Image from "next/image"

export function DownloadOptions() {
  const { step, setStep, selectedCountry, selectedDocument, processedImage } = useAppContext()

  if (step !== 4 || !processedImage) return null

  // Get the actual photo dimensions based on document type
  const getPhotoSize = () => {
    const docId = Number(selectedDocument?.id) || 0
    switch (docId) {
      case 2: // Firearms License
      case 5: // Passport
      case 1: // Diversity Visa
      case 4: // Green Card
      case 7: // US Immigrant Visa
        return "2×2 inch"
      case 3: // Digital formats
      case 6:
        return "900×900 px"
      default:
        return "35×45mm"
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = processedImage
    link.download = `vizaphoto-${selectedCountry?.code}-${selectedDocument?.id}-digital.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h3 className="font-medium">Your Photo is Ready!</h3>
              <div className="text-sm text-slate-500">
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

            <div className="w-full max-w-md mx-auto">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-4">
                {processedImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={processedImage}
                    alt="Processed photo"
                    className="w-full h-auto"
                  />
                )}
              </div>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Photo
              </Button>
            </div>

            <div className="mt-8 w-full">
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
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Start Over
        </Button>
      </div>
    </div>
  )
}
