import { GalleryGrid } from "../components/gallery-grid"
import { UploadButton } from "../components/upload-button"
import { Container, Box, Typography, Paper, Divider } from "@mui/material"
import { Collections as GalleryIcon } from "@mui/icons-material"

export default function GaleriaPage() {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderBottom: 1, 
          borderColor: "divider",
          backgroundColor: "background.paper",
          mb: 4
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <GalleryIcon sx={{ fontSize: 40, color: "primary.main" }} />
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: "light",
                fontFamily: "var(--font-serif)",
              }}
            >
              Galeria
            </Typography>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="lg">
        {/* Upload Section */}
        <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
          <UploadButton />
        </Box>

        <Divider sx={{ mb: 4 }} />

        {/* Gallery Grid */}
        <GalleryGrid />
      </Container>
    </Box>
  )
}
