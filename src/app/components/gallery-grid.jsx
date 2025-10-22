"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { 
  Box, 
  ImageList, 
  ImageListItem, 
  IconButton, 
  Typography, 
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  useTheme,
  useMediaQuery
} from "@mui/material"
import { Delete as DeleteIcon } from "@mui/icons-material"

export function GalleryGrid() {
  const [images, setImages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingUrl, setDeletingUrl] = useState(null)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      // Adicionar um timestamp para evitar cache
      const timestamp = Date.now();
      const response = await fetch(`/api/recursos?_t=${timestamp}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Server error:", data.error);
        throw new Error(data.error || "Failed to fetch images");
      }
      
      // Validar se temos os dados esperados
      if (!Array.isArray(data.items)) {
        console.error("Invalid response format:", data);
        throw new Error("Invalid response format");
      }
      
      // Mapear os recursos do banco para o formato esperado pela galeria
      // e garantir que não haja duplicatas usando Set com URLs
      const uniqueUrls = new Set();
      const uniqueImages = data.items
        .filter(resource => {
          // Validar se o recurso tem uma URL válida
          if (!resource?.url || typeof resource.url !== 'string') {
            console.warn('Invalid resource:', resource);
            return false;
          }
          
          // Verificar duplicatas
          if (uniqueUrls.has(resource.url)) {
            console.warn('Duplicate URL found:', resource.url);
            return false;
          }
          
          uniqueUrls.add(resource.url);
          return true;
        })
        .map(resource => ({
          url: resource.url,
          pathname: resource.filename || 'Sem nome',
          uploadedAt: resource.updatedAt || resource.createdAt || new Date().toISOString(),
          size: resource.sizeBytes || 0
        }));

      setImages(uniqueImages);
    } catch (error) {
      console.error("Error fetching images:", error);
      // Mostrar mensagem de erro para o usuário
      alert("Erro ao carregar as imagens. Por favor, tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
          Carregando fotos...
        </Typography>
      </Box>
    )
  }

  if (images.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
        <Card sx={{ maxWidth: 400, textAlign: "center", p: 4 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma foto na galeria
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Envie sua primeira foto usando o botão acima
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  // Define o número de colunas com base no tamanho da tela
  const getCols = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 4;
  };

  return (
    <ImageList 
      variant="standard" 
      cols={getCols()} 
      gap={24}
      sx={{
        // Remove o espaçamento padrão do ImageList
        m: 0,
        // Adiciona animação suave na transição do layout
        '& .MuiImageListItem-root': {
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      {images.map((image) => (
        <ImageListItem 
          key={image.url}
          sx={{
            borderRadius: 1,
            overflow: 'hidden',
            boxShadow: 1,
            '&:hover': {
              boxShadow: 3,
              '& .overlay': {
                opacity: 1
              }
            }
          }}
        >
          <Image
            src={image.url}
            alt={image.pathname}
            width={500}
            height={500}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scale(1)',
              transition: 'transform 0.3s ease-in-out'
            }}
          />
          
          {/* Overlay com botão de delete e data */}
          <Box
            className="overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: 0,
              transition: 'opacity 0.3s ease-in-out',
              p: 2
            }}
          >
            <IconButton
              onClick={() => handleDelete(image.url)}
              disabled={deletingUrl === image.url}
              sx={{
                bgcolor: 'background.paper',
                '&:hover': {
                  bgcolor: 'background.default'
                }
              }}
            >
              <DeleteIcon />
            </IconButton>

            <Typography 
              variant="caption" 
              sx={{ 
                color: 'white',
                width: '100%',
                textAlign: 'center',
                mt: 1
              }}
            >
              {new Date(image.uploadedAt).toLocaleDateString("pt-BR")}
            </Typography>
          </Box>
        </ImageListItem>
      ))}
    </ImageList>
  )
}