"use client";

import { useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Grid,
  List,
  ListItem,
  // --- NOVOS IMPORTS para o novo schema ---
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FileItem from "../../components/FileItem"; // Assumindo que este componente existe

export default function CorrecaoPage() {
  const [files, setFiles] = useState([]);
  
  // --- ESTADOS ---
  const [extractedQuestoes, setExtractedQuestoes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // -----------------

  const handleFileChange = (event) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleFileExclude = (fileToRemove) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
  };

  const handleClearFiles = () => {
    setFiles([]);
    setExtractedQuestoes([]);
    setError(null);
  };

  // --- LÓGICA DE CORREÇÃO (CHAMADA À API) ---
  const handleCorrection = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setExtractedQuestoes([]);

    try {
      const uploadPromises = files.map((file) => {
        const formData = new FormData();
        formData.append("prova", file);

        return fetch("/api/correcao", {
          method: "POST",
          body: formData,
        }).then(async (response) => {
          if (!response.ok) {
            // Tenta ler o erro como JSON
            let errData;
            try {
              errData = await response.json();
            } catch (e) {
              // Se falhar (ex: erro de <!DOCTYPE...>), usa o status
              throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            throw new Error(
              `Erro ao processar ${file.name}: ${
                errData.details || errData.error
              }`
            );
          }
          // A API retorna o array de questões no formato complexo
          return response.json();
        });
      });

      const resultsArrays = await Promise.all(uploadPromises);
      const allQuestoes = resultsArrays.flat();
      
      setExtractedQuestoes(allQuestoes);
      setFiles([]);

    } catch (err) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- HANDLER DE EDIÇÃO DE TEXTO (Enunciado, Tags) ---
  const handleQuestaoChange = (
    index,
    field,
    value
  ) => {
    setExtractedQuestoes((prev) =>
      prev.map((questao, i) => {
        if (i === index) {
          if (field === 'tags') {
            return {
              ...questao,
              [field]: value.split(',').map(tag => tag.trim()),
            };
          }
          return { ...questao, [field]: value };
        }
        return questao;
      })
    );
  };
  
  // --- HANDLER PARA TEXTO DA ALTERNATIVA/PROPOSIÇÃO ---
  const handleSubItemChange = (
    qIndex,
    itemType, // "alternativas", "proposicoes", etc.
    itemIndex,
    value
  ) => {
     setExtractedQuestoes(prev => 
       prev.map((questao, i) => {
         if (i === qIndex) {
           const newItems = [...questao[itemType]];
           // Atualiza o *texto* do item, mantendo o resto (letra, correta)
           newItems[itemIndex] = { ...newItems[itemIndex], texto: value };
           
           return {
             ...questao,
             [itemType]: newItems
           };
         }
         return questao;
       })
     );
  };

  // --- NOVO HANDLER ---
  // Para definir qual alternativa é a CORRETA
  const handleCorretaChange = (qIndex, alternativaIndexCorreta) => {
    // alternativaIndexCorreta é o *índice* (0, 1, 2...)
    const indexNumber = parseInt(alternativaIndexCorreta, 10);

    setExtractedQuestoes(prev => 
      prev.map((questao, i) => {
        if (i === qIndex) {
          // Mapeia as alternativas, marcando a nova como 'correta'
          // e todas as outras como 'false'
          const newAlternativas = questao.alternativas.map((alt, altIndex) => ({
            ...alt,
            correta: altIndex === indexNumber
          }));
          return { ...questao, alternativas: newAlternativas };
        }
        return questao;
      })
    );
  };

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
        Correção Automática
      </Typography>

      {/* --- SEÇÃO DE UPLOAD --- */}
      <Tooltip
        title="Insira as imagens das provas para extração."
        arrow
        placement="bottom"
      >
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={isLoading}
        >
          Adicionar Imagem
          <input
            type="file"
            accept="image/*" // Focado apenas em imagem por enquanto
            multiple
            hidden
            onChange={handleFileChange}
          />
        </Button>
      </Tooltip>

      <Divider sx={{ my: 3, width: "100%", maxWidth: "lg" }} />

      {/* SEÇÃO DE ARQUIVOS ADICIONADOS */}
      {files.length > 0 && (
        <Container maxWidth="md" sx={{ mb: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Arquivos adicionados:
            </Typography>

            {files.map((file, index) => (
              <FileItem
                key={`${file.name}-${index}`}
                file={file}
                onExclude={handleFileExclude}
              />
            ))}

            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                fullWidth
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                disabled={isLoading}
                onClick={handleCorrection}
              >
                {isLoading ? "Processando..." : "Extrair Questões"}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={handleClearFiles}
                disabled={isLoading}
                sx={{
                  borderColor: "primary.main", color: "primary.main",
                  "&:hover": { /* ... */ },
                }}
              >
                Limpar
              </Button>
            </Box>
          </Paper>
        </Container>
      )}
      
      {/* --- SEÇÃO DE RESULTADOS --- */}
      {isLoading && <CircularProgress sx={{ my: 4 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 'md' }}>
          {error}
        </Alert>
      )}

      {extractedQuestoes.length > 0 && !isLoading && (
        <Container maxWidth="lg" sx={{ mb: 6 }}>
           <Typography variant="h5" sx={{ mb: 2 }}>
             Resultados da Extração ({extractedQuestoes.length})
           </Typography>
           <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
             Revise os dados extraídos pela IA e corrija o que for necessário.
           </Typography>
        
          {extractedQuestoes.map((questao, index) => (
            <Accordion key={questao._id || index} defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  backgroundColor: 'action.hover', 
                  '& .MuiAccordionSummary-content': { 
                    flexDirection: 'column' 
                  } 
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Questão {index + 1} (Tipo: {questao.tipo})
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {questao.enunciado.substring(0, 150)}...
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="form" noValidate autoComplete="off" sx={{ width: '100%' }}>
                  <Grid container spacing={2}>
                    
                    {/* ENUNCIADO */}
                    <Grid item xs={12}>
                      <TextField
                        label="Enunciado"
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        value={questao.enunciado}
                        onChange={(e) =>
                          handleQuestaoChange(index, "enunciado", e.target.value)
                        }
                      />
                    </Grid>
                    
                    {/* TAGS */}
                    <Grid item xs={12}>
                       <TextField
                        label="Tags (separadas por vírgula)"
                        fullWidth
                        variant="outlined"
                        value={questao.tags ? questao.tags.join(', ') : ''}
                        onChange={(e) =>
                          handleQuestaoChange(index, "tags", e.target.value)
                        }
                      />
                    </Grid>

                    {/* RENDERIZAÇÃO DAS ALTERNATIVAS (com seletor de 'correta') */}
                    {questao.tipo === 'alternativa' && questao.alternativas && questao.alternativas.length > 0 && (
                      <Grid item xs={12}>
                        <FormControl component="fieldset" fullWidth>
                          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                            Alternativas (Marque a correta):
                          </FormLabel>
                          {/* O RadioGroup controla qual alternativa está marcada como 'correta' */}
                          <RadioGroup
                            // Encontra o índice da alternativa que está 'correta: true'
                            // e o converte para string
                            value={String(questao.alternativas.findIndex(alt => alt.correta === true))}
                            // O 'value' do RadioGroup é o *índice* da alternativa (0, 1, 2...)
                            onChange={(e) => handleCorretaChange(index, e.target.value)}
                          >
                            {questao.alternativas.map((item, itemIdx) => (
                              <Box key={itemIdx} sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                                {/* Botão de Rádio para marcar como 'correta' */}
                                <FormControlLabel 
                                  value={String(itemIdx)} // O valor é o índice
                                  control={<Radio />} 
                                  label={item.letra} // Mostra a letra "A", "B", etc.
                                />
                                {/* Campo de Texto para editar o 'texto' */}
                                <TextField
                                  fullWidth
                                  variant="outlined"
                                  value={item.texto}
                                  onChange={(e) => handleSubItemChange(index, 'alternativas', itemIdx, e.target.value)}
                                  size="small"
                                />
                              </Box>
                            ))}
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    )}
                    
                    {/* TODO: Adicionar lógica de renderização para 'proposicoes' e 'afirmacoes' */}
                    {/* Ex: (baseado no código antigo) */}
                    {questao.tipo === 'proposicoes' && questao.proposicoes && questao.proposicoes.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 'bold' }}>Proposições:</Typography>
                        <List dense>
                          {questao.proposicoes.map((item, itemIdx) => (
                            <ListItem key={itemIdx} sx={{p:0, mb: 1}}>
                              <TextField
                                label={`Proposição ${itemIdx + 1}`}
                                fullWidth
                                variant="outlined"
                                value={item.texto} // Assumindo que proposição também tenha {texto: '...'}
                                onChange={(e) => handleSubItemChange(index, 'proposicoes', itemIdx, e.target.value)}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Grid>
                    )}

                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
            <Button variant="outlined" onClick={handleClearFiles}>
              Cancelar
            </Button>
             <Button variant="contained" color="primary">
               Salvar Questões (Ainda não implementado)
             </Button>
          </Box>
          
        </Container>
      )}
    </Box>
  );
}