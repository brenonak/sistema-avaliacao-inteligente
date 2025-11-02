import { Container, Box, Typography, Paper, Divider } from "@mui/material"

export default function CorrecaoPage() {
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
              Correção
            </Typography>
          </Box>
        </Container>

      {/* Main Content */}
      <Container maxWidth="lg">
        
      </Container>
    </Box>
  )
}
