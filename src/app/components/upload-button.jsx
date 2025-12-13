"use client"

import { useState, useRef } from "react"
import { 
  Button, 
  CircularProgress,
  Snackbar,
  Alert,
  Box
} from "@mui/material"
import { CloudUpload as UploadIcon } from "@mui/icons-material"

export function UploadButton() {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showErrorMessage("Por favor, selecione apenas arquivos de imagem")
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
      showErrorMessage("Erro ao fazer upload da foto. Tente novamente.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const [error, setError] = useState("")
  const [showError, setShowError] = useState(false)

  const handleCloseError = () => {
    setShowError(false)
  }

  const showErrorMessage = (message) => {
    setError(message)
    setShowError(true)
  }

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        style={{ display: 'none' }}
        id="file-upload"
        disabled={isUploading}
      />
      <label htmlFor="file-upload">
        <Button
          component="span"
          variant="contained"
          disabled={isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {isUploading ? "Enviando..." : "Adicionar Imagem"}
        </Button>
      </label>

      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  )
}
