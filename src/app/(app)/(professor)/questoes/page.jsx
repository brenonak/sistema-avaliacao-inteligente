"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import { Box, Typography, Button, Card, CardContent, List, ListItem, ListItemText, CircularProgress, CardActions, Pagination, FormControl, InputLabel, Select, MenuItem, IconButton, TextField, InputAdornment, Chip, Autocomplete, Snackbar, Alert } from '@mui/material';
import { ArrowUpward, ArrowDownward, Search, Clear, FilterList, Assessment } from '@mui/icons-material';
import EditQuestionModal from '../../../components/EditQuestionModal';
import ConfirmDeleteDialog from '../../../components/ConfirmDeleteDialog';
import VisibilityIcon from '@mui/icons-material/Visibility'; 
import AssessmentIcon from '@mui/icons-material/Assessment';

export default function ListarQuestoesPage() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [limit] = useState(10); // 10 questões por página
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Estados para busca
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Estados para filtros de tags
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Carregar tags disponíveis
  useEffect(() => {
    async function fetchTags() {
      try {
        setLoadingTags(true);
        const res = await fetch('/api/questoes/tags');
        if (!res.ok) throw new Error('Erro ao buscar tags');
        const data = await res.json();
        setAvailableTags(data.tags || []);
      } catch (err) {
        console.error('Erro ao carregar tags:', err);
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }
    }
    fetchTags();
  }, []);

  useEffect(() => {
    async function fetchQuestoes() {
      try {
        setLoading(true);
        const searchParam = debouncedSearchQuery ? `&search=${encodeURIComponent(debouncedSearchQuery)}` : '';
        const tagsParam = selectedTags.length > 0 ? `&tags=${selectedTags.map(tag => encodeURIComponent(tag)).join(',')}` : '';
        const res = await fetch(`/api/questoes?page=${currentPage}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${searchParam}${tagsParam}`);
        if (!res.ok) throw new Error('Erro ao buscar questões');
        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];
        
        // Atualizar informações de paginação
        setTotalPages(data.total ? Math.ceil(data.total / limit) : 1);
        setTotalQuestoes(data.total || 0);
        
        // As imagens agora vêm populadas no campo 'imagens' da API
        setQuestoes(items);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestoes();
  }, [currentPage, limit, sortBy, sortOrder, debouncedSearchQuery, selectedTags]);

  const handleDelete = async () => {
    if (!questionToDelete) return; // Segurança extra
    try {
      // TODO: A chamada para a API abaixo está pronta.
      // Ela funcionará corretamente assim que o endpoint DELETE /api/questoes/:id estiver implementado no back-end.
      // Atualmente, essa chamada retornará um erro 404.
      // Implemente o endpoint no back-end para que a exclusão funcione corretamente.
      // Após implementar, teste a funcionalidade para garantir que tudo está funcionando como esperado.
      const res = await fetch(`/api/questoes/${questionToDelete.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao excluir questão');
      }
      setSnackbar({ open: true, message: 'Questão excluída com sucesso', severity: 'success' });
    
      // Remover a questão da lista localmente
      setQuestoes((prevQuestoes) => prevQuestoes.filter((q) => q.id !== questionToDelete.id));
    //console.log('Questão excluída com sucesso');

    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message || 'Erro desconhecido ao excluir questão', severity: 'error' });
    }

    //setOpenExclusionPopup(false);
    setQuestionToDelete(null);
  };

  const handleOpenEditModal = (questao) => {
    setEditingQuestion(questao); // Guarda a questão que o usuário clicou
    setIsModalOpen(true);      // Abre o modal
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);     // Fecha o modal
    setEditingQuestion(null);  // Limpa a questão em edição
  };


  const handleSaveSuccess = (updatedQuestion) => {
    setQuestoes(prevQuestoes =>
      prevQuestoes.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
    setSnackbar({ open: true, message: 'Questão atualizada com sucesso!', severity: 'success' });
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleSortFieldChange = (event) => {
    setSortBy(event.target.value);
    setCurrentPage(1); // Reset para primeira página ao mudar ordenação
  };

  const handleSortOrderToggle = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1); // Reset para primeira página ao mudar ordenação
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset para primeira página ao buscar
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleTagsChange = (event, newValue) => {
    setSelectedTags(newValue);
    setCurrentPage(1); // Reset para primeira página ao filtrar
  };

  const handleClearTags = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const toRoman = (num) => {
    const romans = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
    return romans[num] || String(num + 1);
  };

  const handleExportarLatex = async () => {
    try {
      setExporting(true);
      const res = await fetch('/api/gerar-prova', { method: 'POST' });

      if (!res.ok) {
        throw new Error('Erro ao gerar arquivo LaTeX');
      }

      const data = await res.json();

      if (!data?.latexContent) {
        throw new Error('Conteúdo LaTeX indisponível');
      }

      const blob = new Blob([data.latexContent], { type: 'application/x-tex;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.fileName || 'prova_gemini.tex';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({ open: true, message: 'Arquivo LaTeX gerado com sucesso!', severity: 'success' });
      
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: err.message || 'Falha ao gerar arquivo LaTeX', severity: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
        Questões Cadastradas
      </Typography>
      
      {/* Linha 1: Barra de pesquisa (esquerda) + Ordenação (direita) */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
        {/* Barra de pesquisa */}
        <TextField
          placeholder="Buscar por enunciado..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ 
            flexGrow: 1,
            maxWidth: 600,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClearSearch}
                  edge="end"
                  size="small"
                  title="Limpar busca"
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Seletor de ordenação */}
        {!loading && !error && totalQuestoes > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300 }}>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="sort-field-label">Ordenar por</InputLabel>
              <Select
                labelId="sort-field-label"
                value={sortBy}
                label="Ordenar por"
                onChange={handleSortFieldChange}
              >
                <MenuItem value="createdAt">Data de criação</MenuItem>
                <MenuItem value="updatedAt">Data de atualização</MenuItem>
              </Select>
            </FormControl>
            
            <IconButton 
              onClick={handleSortOrderToggle}
              color="primary"
              sx={{ 
                border: 1, 
                borderColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'white'
                }
              }}
              title={sortOrder === 'desc' ? 'Mais recentes primeiro' : 'Mais antigas primeiro'}
            >
              {sortOrder === 'desc' ? <ArrowDownward /> : <ArrowUpward />}
            </IconButton>
            
            <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 100 }}>
              {sortOrder === 'desc' ? 'Mais recentes' : 'Mais antigas'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Linha 2: Filtro de tags */}
      {availableTags.length > 0 && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Autocomplete
            multiple
            options={availableTags}
            value={selectedTags}
            onChange={handleTagsChange}
            loading={loadingTags}
            sx={{ minWidth: 300, maxWidth: 400 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Filtrar por tags"
                placeholder="Selecione as tags..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <FilterList color="action" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  endAdornment: (
                    <>
                      {selectedTags.length > 0 && (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleClearTags}
                            size="small"
                            title="Limpar filtros"
                          >
                            <Clear />
                          </IconButton>
                        </InputAdornment>
                      )}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
          />
        </Box>
      )}

      {/* Linha 3: Informações de paginação */}
      {!loading && !error && totalQuestoes > 0 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Página {currentPage} de {totalPages} • {totalQuestoes} quest{totalQuestoes !== 1 ? 'ões' : 'ão'} no total
            {debouncedSearchQuery && (
              <span> • Buscando por: "<strong>{debouncedSearchQuery}</strong>"</span>
            )}
            {selectedTags.length > 0 && (
              <span> • Filtrado por tags: <strong>{selectedTags.join(', ')}</strong></span>
            )}
          </Typography>
        </Box>
      )}
      
      {/* Componente de paginação no topo */}
      {!loading && !error && totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
      
      {/* Só mostra o botão se não estiver carregando, não houver erro, e houver pelo menos uma questão na lista */}
      {!loading && !error && questoes.length > 0 && (
        <Button
          variant="contained"
          color="success"
          onClick={handleExportarLatex}
          disabled={exporting}
          sx={{ mb: 3 }}
        >
          {exporting ? 'Gerando...' : 'Exportar para LaTeX'}
        </Button>
      )}
      
      <Box sx={{ width: '100%', maxWidth: 800 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'text.secondary' }}>Carregando...</Typography>
          </Box>
        )}
        {error && (
          <Typography color="error" sx={{ textAlign: 'center', p: 2 }}>
            {error}
          </Typography>
        )}
        {!loading && !error && questoes.length === 0 && (
          <Typography sx={{ color: 'text.secondary', textAlign: 'center', p: 2 }}>
            Nenhuma questão cadastrada.
          </Typography>
        )}
        {questoes.map((questao, idx) => (
          <Card
            key={questao.id || idx}
            sx={{ 
              mb: 2, 
              backgroundColor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" component="p" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                {questao.enunciado}
              </Typography>
              {/* Exibir imagens associadas se houver */}
              {Array.isArray(questao.imagens) && questao.imagens.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {questao.imagens.map((imagem, imgIdx) => (
                    <Box
                      key={imagem.id || imgIdx}
                      component="img"
                      src={imagem.url}
                      alt={imagem.filename || `Imagem ${imgIdx + 1} da questão`}
                      sx={{
                        width: '100%',
                        maxHeight: 300,
                        objectFit: 'contain',
                        borderRadius: 1,
                        backgroundColor: 'background.default',
                        border: 1,
                        borderColor: 'divider'
                      }}
                    />
                  ))}
                </Box>
              )}
              
              {/* Exibir tipo e tags da questão */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={questao.tipo === 'alternativa' ? 'Múltipla escolha' : 
                         questao.tipo === 'afirmacoes' ? 'Verdadeiro ou Falso' : 
                         questao.tipo === 'proposicoes' ? 'Verdadeiro ou Falso - Somatório' : 
                         questao.tipo === 'dissertativa' ? 'Dissertativa' : 
                         questao.tipo === 'numerica' ? 'Resposta Numérica' : questao.tipo}
                  size="small"
                  color="primary"
                />
                {questao.tags && questao.tags.map((tag, idx) => (
                  <Chip key={idx} label={tag} size="small" variant="outlined" />
                ))}
              </Box>
              
              {/* Exibir resposta numérica se for questão numérica */}
              {questao.tipo === 'numerica' && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    Resposta correta: {questao.respostaCorreta}
                    {questao.margemErro > 0 && ` (± ${questao.margemErro})`}
                  </Typography>
                </Box>
              )}
              
              {/* Exibir gabarito para questões dissertativas */}
              {questao.tipo === 'dissertativa' && questao.gabarito && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                    Gabarito: {questao.gabarito}
                  </Typography>
                </Box>
              )}
              
              {/* Exibir alternativas para questões de múltipla escolha */}
              {questao.tipo === 'alternativa' && (
                <List dense>
                  {questao.alternativas?.map((alt, index) => (
                    <ListItem key={index} sx={{ pl: 2 }}>
                      <ListItemText
                        primary={`${(alt.letra || String.fromCharCode(65 + index))}) ${alt.texto} ${alt.correta ? '(Correta)' : ''}`}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: alt.correta ? 'bold' : 'normal',
                            color: alt.correta ? 'success.main' : 'text.secondary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Exibir afirmações (novo tipo) com gabarito visível */}
              {questao.tipo === 'afirmacoes' && Array.isArray(questao.afirmacoes) && (
                <List dense>
                  {questao.afirmacoes.map((af, index) => (
                    <ListItem key={index} sx={{ pl: 2, alignItems: 'flex-start' }}>
                      <Typography sx={{ mr: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                        {toRoman(index)}.
                      </Typography>
                      <Typography sx={{ mr: 1, fontWeight: 'bold', color: af.correta ? 'success.main' : 'error.main' }}>
                        ({af.correta ? 'V' : 'F'})
                      </Typography>
                      <ListItemText primary={af.texto} />
                    </ListItem>
                  ))}
                </List>
              )}

              {/* Exibir proposições (somatório) com valor e gabarito */}
              {questao.tipo === 'proposicoes' && Array.isArray(questao.proposicoes) && (
                <>
                  <List dense>
                    {questao.proposicoes.map((p, index) => (
                      <ListItem key={index} sx={{ pl: 2, alignItems: 'flex-start' }}>
                        <Typography sx={{ mr: 1, fontWeight: 'bold', color: 'text.secondary', fontFamily: 'monospace' }}>
                          {String(p.valor).padStart(2, '0')}
                        </Typography>
                        <Typography sx={{ mr: 1, fontWeight: 'bold', color: p.correta ? 'success.main' : 'error.main' }}>
                          ({p.correta ? 'V' : 'F'})
                        </Typography>
                        <ListItemText primary={p.texto} />
                      </ListItem>
                    ))}
                  </List>
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                      Gabarito (Soma):{' '}
                      <Typography component="span" sx={{ color: 'success.main' }}>
                        {questao.proposicoes.reduce((acc, p) => acc + (p.correta ? (Number(p.valor) || 0) : 0), 0)}
                      </Typography>
                    </Typography>
                  </Box>
                </>
              )}
              </CardContent>
            <CardActions sx={{ marginTop: 'auto', alignSelf: 'flex-end', p: 2 }}>
              <Link href={`/questoes/${questao.id}`} passHref style={{ textDecoration: 'none' }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<Assessment />}
                  sx={{ mr: 1 }}
                >
                  Detalhes
                </Button>
              </Link>

              <Button 
                size="small" 
                variant="contained" 
                color="secondary"
                onClick={() => handleOpenEditModal(questao)}
              >
                Editar
              </Button>
              <>
                <Button 
                  size="small"
                  color="error" 
                  variant="contained" 
                  onClick={() => setQuestionToDelete(questao)}
                >
                  Excluir
                </Button>
        
                <ConfirmDeleteDialog
                  open={!!questionToDelete && questionToDelete.id === questao.id} // Abre apenas se o ID corresponder
                  elementText='esta questão'
                  onClose={() => setQuestionToDelete(null)} // Limpa o estado para fechar
                  onConfirm={handleDelete} // A função já sabe quem deletar pelo estado
                />
              </>
            </CardActions>
          </Card>
        ))}
        
        {/* Componente de paginação no final */}
        {!loading && !error && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* O Modal é renderizado aqui, mas só aparece quando está "aberto" */}
      {editingQuestion && (
        <EditQuestionModal
          open={isModalOpen}
          onClose={handleCloseModal}
          question={editingQuestion}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%', fontSize: '1.1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}