"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Trash2 } from "lucide-react"

export function GalleryGrid() {
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingUrl, setDeletingUrl] = useState(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch("/api/recursos")
      if (!response.ok) throw new Error("Failed to fetch images")
      const data = await response.json()
      
      // Mapear os recursos do banco para o formato esperado pela galeria
      // e garantir que não haja duplicatas usando Set com URLs
      const uniqueUrls = new Set()
      const uniqueImages = (data.items || [])
        .filter(resource => {
          if (uniqueUrls.has(resource.url)) {
            return false // Skip duplicadas
          }
          uniqueUrls.add(resource.url)
          return true
        })
        .map(resource => ({
          url: resource.url,
          pathname: resource.filename,
          uploadedAt: resource.updatedAt || resource.createdAt,
          size: resource.sizeBytes
        }))

      setImages(uniqueImages)
    } catch (error) {
      console.error("Error fetching images:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (url) => {
    if (!confirm("Tem certeza que deseja excluir esta foto?")) return

    setDeletingUrl(url)
    try {
      const response = await fetch("/api/galeria", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete image")
      }

      if (data.success) {
        // Remove from state only if deletion was successful
        setImages((prev) => prev.filter((img) => img.url !== url))
      } else {
        throw new Error(data.error || "Failed to delete image")
      }
    } catch (error) {
      console.error("Error deleting image:", error)
      alert("Erro ao excluir a foto. Tente novamente.")
    } finally {
      setDeletingUrl(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-muted-foreground">Carregando fotos...</div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-2">Nenhuma foto na galeria</p>
          <p className="text-muted-foreground text-sm">Envie sua primeira foto usando o botão acima</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {images.map((image) => (
        <div
          key={image.url}
          className="group relative aspect-square bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
        >
          {/* Image */}
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={image.url || "/placeholder.svg"}
              alt={image.pathname}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/60 transition-colors duration-300 flex items-center justify-center">
            <button
              onClick={() => handleDelete(image.url)}
              disabled={deletingUrl === image.url}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3 bg-card rounded-full hover:bg-muted disabled:opacity-50 cursor-pointer"
              aria-label="Excluir foto"
            >
              <Trash2 className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-secondary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-xs truncate">{new Date(image.uploadedAt).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      ))}
    </div>
  )
}