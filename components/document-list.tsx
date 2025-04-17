"use client"

import type React from "react"

import { useState, useContext, createContext } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"

// Create a context to share document selection state
const DocumentContext = createContext<{
  selectedDocument: number | null
  setSelectedDocument: (id: number | null) => void
  aspectRatio: number
  setAspectRatio: (ratio: number) => void
}>({
  selectedDocument: null,
  setSelectedDocument: () => {},
  aspectRatio: 1,
  setAspectRatio: () => {},
})

export const useDocumentContext = () => useContext(DocumentContext)

export const DocumentProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null)
  const [aspectRatio, setAspectRatio] = useState(1)

  return (
    <DocumentContext.Provider value={{ selectedDocument, setSelectedDocument, aspectRatio, setAspectRatio }}>
      {children}
    </DocumentContext.Provider>
  )
}

const documents = [
  { id: 1, name: "Diversity Visa Lottery", size: "600x600 px", icon: "✈️", aspectRatio: 1 },
  { id: 2, name: "Firearms License", size: "2.00x2.00", icon: "🪪", aspectRatio: 1 },
  { id: 3, name: "Firearms License Digital", size: "900x900 px", icon: "🪪", aspectRatio: 1 },
  { id: 4, name: "Green Card", size: "600x600 px", icon: "🪪", aspectRatio: 1 },
  { id: 5, name: "Passport", size: '2"x2"', icon: "🛂", aspectRatio: 0.75 },
  { id: 6, name: "Passport Digital", size: "900x900 px", icon: "🛂", aspectRatio: 0.75 },
  { id: 7, name: "US Immigrant Visa", size: "2.00x2.00", icon: "✈️", aspectRatio: 1.33 },
]

export function DocumentList() {
  const [selectedDocument, setSelectedDocument] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<number[]>([])
  const { setAspectRatio } = useDocumentContext()

  const toggleFavorite = (id: number) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id))
    } else {
      setFavorites([...favorites, id])
    }
  }

  const handleDocumentSelect = (id: number) => {
    setSelectedDocument(id)
    const document = documents.find((doc) => doc.id === id)
    if (document) {
      setAspectRatio(document.aspectRatio)
    }
  }

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <h3 className="mb-2 font-medium">Select Document Type</h3>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className={`flex cursor-pointer items-center justify-between rounded-md border p-2 hover:bg-gray-50 ${
              selectedDocument === doc.id ? "border-green-500 bg-green-50" : ""
            }`}
            onClick={() => handleDocumentSelect(doc.id)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{doc.icon}</span>
              <div>
                <p className="text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-gray-500">{doc.size}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(doc.id)
              }}
            >
              <Star
                className={`h-4 w-4 ${
                  favorites.includes(doc.id) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
