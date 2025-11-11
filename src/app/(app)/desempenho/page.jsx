"use client";

import {
  Box,
  Typography,
} from "@mui/material";

export default function DesempenhoPage() {

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        backgroundColor: "background.default",
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ mb: 4, fontWeight: "bold", color: "text.primary", textAlign: "center" }}
      >
        Desempenho
      </Typography>
    </Box>
  );
}