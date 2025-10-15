import { GalleryGrid } from "../components/gallery-grid"
import { UploadButton } from "../components/upload-button"

export default function GaleriaPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="font-serif text-4xl md:text-5xl font-light text-balance">Galeria</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Upload Section */}
        <div className="mb-12 flex justify-center">
          <UploadButton />
        </div>

        {/* Gallery Grid */}
        <GalleryGrid />
      </main>
    </div>
  )
}
