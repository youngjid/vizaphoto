"use client"

import { useState, useEffect } from "react"
import { useAppContext } from "@/context/app-context"
import { countries } from "@/data/countries"
import { Check, ChevronDown, Globe, Search, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export function CountrySelector() {
  const { step, setStep, selectedCountry, setSelectedCountry, selectedDocument, setSelectedDocument } = useAppContext()
  const [openCountry, setOpenCountry] = useState(false)
  const [openDocument, setOpenDocument] = useState(false)

  // Reset selected document when country changes
  useEffect(() => {
    if (
      selectedCountry &&
      (!selectedDocument || !selectedCountry.documents.some((d) => d.id === selectedDocument.id))
    ) {
      setSelectedDocument(selectedCountry.documents[0] || null)
    }
  }, [selectedCountry, selectedDocument, setSelectedDocument])

  if (step !== 1) return null

  const formatDimensions = (dimensions: any) => {
    return `${dimensions.width} x ${dimensions.height} ${dimensions.units}`
  }

  return (
    <div className="max-w-6xl mx-auto mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 px-2 sm:px-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4 md:gap-8">
        <Card className="border-slate-200 shadow-sm w-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-slate-900">Free Passport Photo Maker</CardTitle>
            <CardDescription>Select country/region and photo type, then click Start</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Country
              </Label>
              <Popover open={openCountry} onOpenChange={setOpenCountry}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openCountry}
                    className="w-full justify-between h-16 text-base"
                  >
                    {selectedCountry ? (
                      <div className="flex items-center">
                        <Image
                          src={selectedCountry.flag}
                          alt={selectedCountry.name}
                          width={32}
                          height={24}
                          className="mr-3"
                        />
                        <div className="font-medium">{selectedCountry.name}</div>
                      </div>
                    ) : (
                      <div className="flex items-center text-slate-500">
                        <Globe className="mr-2 h-5 w-5" />
                        Select country...
                      </div>
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Search country..." className="h-12" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {/* US at the top */}
                        {countries
                          .filter(country => country.code === 'US')
                          .map((country) => (
                          <CommandItem
                            key={country.code}
                            value={country.name}
                            onSelect={() => {
                              setSelectedCountry(country)
                              setOpenCountry(false)
                            }}
                            className="flex items-center space-x-2 rounded-md p-4 cursor-pointer hover:bg-slate-50 border-b"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <Image
                                src={country.flag}
                                alt={country.name}
                                width={40}
                                height={30}
                                className="rounded"
                              />
                              <div className="font-medium text-base">{country.name}</div>
                            </div>
                            {selectedCountry?.code === country.code && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </CommandItem>
                        ))}
                        {/* Rest of the countries */}
                        {countries
                          .filter(country => country.code !== 'US')
                          .map((country) => (
                          <CommandItem
                            key={country.code}
                            value={country.name}
                            onSelect={() => {
                              setSelectedCountry(country)
                              setOpenCountry(false)
                            }}
                            className="flex items-center space-x-2 rounded-md p-4 cursor-pointer hover:bg-slate-50"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <Image
                                src={country.flag}
                                alt={country.name}
                                width={40}
                                height={30}
                                className="rounded"
                              />
                              <div className="font-medium text-base">{country.name}</div>
                            </div>
                            {selectedCountry?.code === country.code && (
                              <Check className="h-5 w-5 text-blue-600" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {selectedCountry && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Document Type</Label>
                <Popover open={openDocument} onOpenChange={setOpenDocument}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDocument}
                      className="w-full justify-between h-16 text-base"
                    >
                      {selectedDocument ? (
                        <div className="flex items-center">
                          <Image
                            src={selectedDocument.thumbnail}
                            alt={selectedDocument.name}
                            width={40}
                            height={40}
                            className="rounded mr-3"
                          />
                          <div>
                            <div className="font-medium">{selectedDocument.name}</div>
                            <div className="text-sm text-slate-500">
                              {formatDimensions(selectedDocument.dimensions)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-slate-500">
                          <FileText className="mr-2 h-5 w-5" />
                          Select document type...
                        </div>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command className="w-full">
                      <CommandInput placeholder="Search document type..." className="h-12" />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No document type found.</CommandEmpty>
                        <CommandGroup>
                          {selectedCountry.documents.map((doc) => (
                            <CommandItem
                              key={doc.id}
                              value={doc.name}
                              onSelect={() => {
                                setSelectedDocument(doc)
                                setOpenDocument(false)
                              }}
                              className="flex items-center space-x-2 rounded-md p-4 cursor-pointer hover:bg-slate-50"
                            >
                              <div className="flex items-center space-x-3 flex-1">
                                <Image
                                  src={doc.thumbnail}
                                  alt={doc.name}
                                  width={40}
                                  height={40}
                                  className="rounded"
                                />
                                <div>
                                  <div className="font-medium text-base">{doc.name}</div>
                                  <div className="text-sm text-slate-500">
                                    {formatDimensions(doc.dimensions)}
                                  </div>
                                </div>
                              </div>
                              {selectedDocument?.id === doc.id && (
                                <Check className="h-5 w-5 text-blue-600" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2 sm:gap-x-4 sm:gap-y-0">
              <div className="text-sm text-slate-500 text-center sm:text-left">
                {selectedCountry && selectedDocument
                  ? `${selectedDocument.name} (${formatDimensions(selectedDocument.dimensions)}) for ${selectedCountry.name}`
                  : "Please select country and document type"}
              </div>
              <Button
                size="lg"
                disabled={!selectedCountry || !selectedDocument}
                onClick={() => setStep(2)}
                className="px-8 w-full sm:w-auto mt-2 sm:mt-0"
              >
                Make Free Passport Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How it works section */}
        <div className="w-full mt-8 md:mt-0 bg-white rounded-lg p-4 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold mb-4 sm:mb-6">How it works</h2>
          <div className="relative">
            <div className="absolute -top-6 right-0 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium transform rotate-6">
              Your Image
            </div>
            <div className="relative mb-8">
              <Image
                src="/placeholder.svg?height=300&width=200"
                alt="Phone with camera"
                width={200}
                height={300}
                className="rounded-lg shadow-lg mx-auto"
              />
              {selectedCountry && selectedDocument && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-28 sm:w-24 sm:h-32 bg-white p-1 rounded-md shadow-lg">
                  <Image
                    src={selectedDocument.thumbnail}
                    alt={`${selectedCountry.name} ${selectedDocument.name}`}
                    width={90}
                    height={120}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-medium">Select your country and document</h3>
                <p className="text-sm text-slate-500">Choose from over 100 countries and document types</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-medium">Upload your photo</h3>
                <p className="text-sm text-slate-500">Take a new photo or upload an existing one</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-medium">Download your passport photo</h3>
                <p className="text-sm text-slate-500">Get your photo in digital format or ready to print</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  )
}
