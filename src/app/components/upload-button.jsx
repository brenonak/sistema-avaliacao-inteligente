"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/galeria", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Falha no upload")
      }

      // Refresh the page to show the new image
      window.location.reload()
    } catch (error) {
      console.error("Upload error:", error)
      alert("Erro ao fazer upload da foto. Tente novamente.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="file-upload"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          <Upload className="w-5 h-5" />
          {isUploading ? "Enviando..." : "Enviar Foto"}
        </button>
      </label>
    </div>
  )
}
