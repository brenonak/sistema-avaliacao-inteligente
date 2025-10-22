import { GalleryGrid } from "../../components/gallery-grid"
import { UploadButton } from "../../components/upload-button"
import { Container, Box, Typography, Paper, Divider } from "@mui/material"
import { Collections as GalleryIcon } from "@mui/icons-material"

export default function GaleriaPage() {
  return (
    <Box sx={{ minHeight: "100vh" }}>
      {/* Header */}
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Box sx={{ minHeight: '10vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        p: 3,
        backgroundColor: 'background.default' }}>
            <Typography 
              variant="h3" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}
            >
              Galeria
            </Typography>
          </Box>
        </Container>

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
