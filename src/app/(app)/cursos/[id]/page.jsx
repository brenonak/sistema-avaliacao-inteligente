'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  ArrowBack, 
  Search, 
  Clear,
  QuestionAnswer,
  School
} from '@mui/icons-material';

export default function CursoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id;
  
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para o diálogo de adicionar questões existentes
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCurso();
  }, [cursoId]);

  const fetchCurso = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/cursos/${cursoId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Curso não encontrado');
        } else {
          throw new Error('Erro ao carregar curso');
        }
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      setCurso(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar curso:', err);
      setError(err.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  const handleOpenAddDialog = async () => {
    setOpenAddDialog(true);
    setLoadingQuestoes(true);
    
    try {
      // Buscar todas as questões disponíveis
      const res = await fetch('/api/questoes');
      if (!res.ok) throw new Error('Erro ao carregar questões');
      
      const data = await res.json();
      const todasQuestoes = data.items || [];
      
      // Filtrar questões que já estão no curso
      const questoesJaAdicionadas = curso.questoes?.map(q => q.id || q._id) || [];
      const questoesFiltradas = todasQuestoes.filter(
        q => !questoesJaAdicionadas.includes(q.id || q._id)
      );
      
      setQuestoesDisponiveis(questoesFiltradas);
    } catch (error) {
      console.error('Erro ao carregar questões:', error);
      alert('Erro ao carregar questões disponíveis');
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const handleToggleQuestao = (questaoId) => {
    setSelectedQuestoes((prev) => {
      if (prev.includes(questaoId)) {
        return prev.filter(id => id !== questaoId);
      } else {
        return [...prev, questaoId];
      }
    });
  };

  const handleAddQuestoes = async () => {
    if (selectedQuestoes.length === 0) {
      alert('Selecione pelo menos uma questão');
      return;
    }

    try {
      // Chamar API para adicionar questões ao curso
      const res = await fetch(`/api/cursos/${cursoId}/questoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questaoIds: selectedQuestoes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao adicionar questões');
      }

      const result = await res.json();
      
      // Atualizar lista local de questões
      const questoesParaAdicionar = questoesDisponiveis.filter(q => 
        selectedQuestoes.includes(q.id || q._id)
      );
      
      setCurso(prevCurso => ({
        ...prevCurso,
        questoes: [...(prevCurso.questoes || []), ...questoesParaAdicionar]
      }));
      
      alert(result.message || `${selectedQuestoes.length} questão(ões) adicionada(s) com sucesso!`);
      setOpenAddDialog(false);
      setSelectedQuestoes([]);
      
      // Recarregar dados do curso para garantir sincronização
      fetchCurso();
    } catch (error) {
      console.error('Erro ao adicionar questões:', error);
      alert(error.message || 'Erro ao adicionar questões ao curso');
    }
  };

  const handleRemoveQuestao = async (questaoId) => {
    if (!confirm('Tem certeza que deseja remover esta questão do curso?')) return;

    try {
      // Chamar API para remover questão do curso
      const res = await fetch(`/api/cursos/${cursoId}/questoes?questaoId=${questaoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao remover questão');
      }

      const result = await res.json();
      
      // Atualizar lista local
      setCurso(prevCurso => ({
        ...prevCurso,
        questoes: (prevCurso.questoes || []).filter(q => (q.id || q._id) !== questaoId)
      }));
      
      alert(result.message || 'Questão removida com sucesso!');
      
      // Recarregar dados do curso para garantir sincronização
      fetchCurso();
    } catch (error) {
      console.error('Erro ao remover questão:', error);
      alert(error.message || 'Erro ao remover questão do curso');
    }
  };

  const handleDeleteCurso = async () => {
    if (!confirm('Tem certeza que deseja excluir este curso? Esta ação não pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/cursos/${cursoId}`, { 
        method: 'DELETE' 
      });
      
      if (!res.ok) throw new Error('Erro ao excluir curso');
      
      alert('Curso excluído com sucesso!');
      router.push('/cursos');
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      alert('Erro ao excluir curso');
    }
  };

  const filteredQuestoes = questoesDisponiveis.filter(q => 
    q.enunciado?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando curso...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', p: 3 }}>
        <Typography color="error" variant="h5" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => router.push('/cursos')}>
          Voltar para Cursos
        </Button>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        p: 3,
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => router.push('/cursos')}
          sx={{ mb: 2 }}
        >
          Voltar para Cursos
        </Button>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <School sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {curso.nome}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleDeleteCurso}
              >
                Excluir Curso
              </Button>
            </Box>
          </Box>

          {curso.descricao && (
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
              {curso.descricao}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Questões do Curso */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Questões do Curso ({curso.questoes?.length || 0})
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Add />}
              onClick={handleOpenAddDialog}
            >
              Adicionar Questões Existentes
            </Button>
            <Link href={`/questoes/criar?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
              >
                Criar Nova Questão
              </Button>
            </Link>
          </Box>
        </Box>

        {(!curso.questoes || curso.questoes.length === 0) ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <QuestionAnswer sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Nenhuma questão adicionada ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Adicione questões existentes ou crie novas questões para este curso.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {curso.questoes.map((questao, index) => (
              <Card key={questao.id || index} sx={{ backgroundColor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {index + 1}. {questao.enunciado}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip 
                          label={questao.tipo === 'alternativa' ? 'Múltipla escolha' : 
                                 questao.tipo === 'afirmacoes' ? 'Verdadeiro ou Falso' : 
                                 questao.tipo === 'proposicoes' ? 'Somatório' : 
                                 questao.tipo === 'dissertativa' ? 'Dissertativa' : 
                                 questao.tipo === 'numerica' ? 'Numérica' : questao.tipo}
                          size="small"
                          color="primary"
                        />
                        {questao.tags && questao.tags.map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>

                      {/* Preview das alternativas/afirmações */}
                      {questao.alternativas && questao.alternativas.length > 0 && (
                        <Box sx={{ pl: 2 }}>
                          {questao.alternativas.slice(0, 2).map((alt, idx) => (
                            <Typography key={idx} variant="body2" sx={{ color: 'text.secondary' }}>
                              {alt.letra}) {alt.texto.substring(0, 50)}{alt.texto.length > 50 ? '...' : ''}
                            </Typography>
                          ))}
                          {questao.alternativas.length > 2 && (
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                              +{questao.alternativas.length - 2} alternativas
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveQuestao(questao.id)}
                      title="Remover do curso"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialog para adicionar questões existentes */}
      <Dialog 
        open={openAddDialog} 
        onClose={() => setOpenAddDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Adicionar Questões Existentes
        </DialogTitle>
        <DialogContent>
          {/* Barra de busca */}
          <TextField
            placeholder="Buscar questões..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            sx={{ mb: 2, mt: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')} size="small">
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {loadingQuestoes ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredQuestoes.length === 0 ? (
            <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              {questoesDisponiveis.length === 0 
                ? 'Todas as questões já foram adicionadas ao curso.' 
                : 'Nenhuma questão encontrada com os critérios de busca.'}
            </Typography>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredQuestoes.map((questao) => (
                <ListItem
                  key={questao.id}
                  dense
                  button
                  onClick={() => handleToggleQuestao(questao.id)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Checkbox
                    checked={selectedQuestoes.includes(questao.id)}
                    tabIndex={-1}
                    disableRipple
                  />
                  <ListItemText
                    primary={questao.enunciado}
                    secondary={
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                        <Chip label={questao.tipo} size="small" />
                        {questao.tags?.slice(0, 3).map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {selectedQuestoes.length > 0 && (
            <Typography variant="body2" sx={{ mt: 2, color: 'primary.main' }}>
              {selectedQuestoes.length} questão(ões) selecionada(s)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleAddQuestoes} 
            variant="contained"
            disabled={selectedQuestoes.length === 0}
          >
            Adicionar Selecionadas
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
