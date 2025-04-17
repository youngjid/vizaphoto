import { Header } from "@/components/header"
import { StepIndicator } from "@/components/step-indicator"
import { CountrySelector } from "@/components/country-selector"
import { PhotoUploader } from "@/components/photo-uploader"
import { PhotoEditor } from "@/components/photo-editor"
import { DownloadOptions } from "@/components/download-options"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <StepIndicator />
        <div className="mt-8">
          <CountrySelector />
          <PhotoUploader />
          <PhotoEditor />
          <DownloadOptions />
        </div>
      </main>
      <Footer />
    </div>
  )
}
