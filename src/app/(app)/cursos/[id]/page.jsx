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
  School,
  Assignment,
  Description,
  ArrowUpward,
  ArrowDownward,
  Clear as ClearIcon,
  Download,
} from '@mui/icons-material';

export default function CursoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const cursoId = params.id;
  
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para provas
  const [provas, setProvas] = useState([]);
  const [loadingProvas, setLoadingProvas] = useState(false);
  
  // Estados para o diálogo de adicionar questões existentes
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para o diálogo de edição do curso
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [loadingEdit, setLoadingEdit] = useState(false);
  
  // Estados para o diálogo de edição de prova
  const [openEditProvaDialog, setOpenEditProvaDialog] = useState(false);
  const [editingProva, setEditingProva] = useState(null);
  const [loadingEditProva, setLoadingEditProva] = useState(false);
  const [editProvaData, setEditProvaData] = useState({
    titulo: '',
    instrucoes: '',
    nomeEscola: '',
    disciplina: '',
    professor: '',
    data: '',
    duracao: '',
    valorTotal: '',
    observacoes: '',
  });
  const [selectedQuestoesProva, setSelectedQuestoesProva] = useState([]);
  const [questoesPontuacaoProva, setQuestoesPontuacaoProva] = useState({}); // Pontuação por questão na edição

  useEffect(() => {
    fetchCurso();
    fetchProvas();
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
      
      // Para cada questão, se houver recurso por ID, buscar a URL
      if (data.questoes && data.questoes.length > 0) {
        const questoesWithResourceUrl = await Promise.all(
          data.questoes.map(async (q) => {
            try {
              const firstResourceId = Array.isArray(q.recursos) && q.recursos.length > 0 ? q.recursos[0] : null;
              if (!firstResourceId) return q;
              const r = await fetch(`/api/resources/${firstResourceId}`);
              if (!r.ok) return q;
              const rjson = await r.json();
              const url = rjson?.resource?.url;
              if (!url) return q;
              return { ...q, recursoUrl: url };
            } catch (_) {
              return q;
            }
          })
        );
        data.questoes = questoesWithResourceUrl;
      }
      
      setCurso(data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao buscar curso:', err);
      setError(err.message || 'Erro desconhecido');
      setLoading(false);
    }
  };

  const fetchProvas = async () => {
    try {
      setLoadingProvas(true);
      const res = await fetch(`/api/cursos/${cursoId}/provas`);
      if (!res.ok) throw new Error('Erro ao carregar provas');
      const data = await res.json();
      setProvas(data.items || []);
    } catch (err) {
      console.error('Erro ao buscar provas:', err);
      setProvas([]);
    } finally {
      setLoadingProvas(false);
    }
  };

  const handleDeleteProva = async (provaId) => {
    if (!confirm('Tem certeza que deseja excluir esta prova?')) return;

    try {
      const res = await fetch(`/api/cursos/${cursoId}/provas/${provaId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao excluir prova');
      }

      alert('Prova excluída com sucesso!');
      fetchProvas();
    } catch (error) {
      console.error('Erro ao excluir prova:', error);
      alert(error.message || 'Erro ao excluir prova');
    }
  };

  const handleExportLatex = async (provaId) => {
    try {
      // TODO: Implementar chamada para endpoint de exportação LaTeX
      // Por exemplo: const res = await fetch(`/api/gerar-prova?provaId=${provaId}&format=latex`);
      alert(`Funcionalidade de exportar para LaTeX será implementada em breve para a prova ${provaId}`);
    } catch (error) {
      console.error('Erro ao exportar para LaTeX:', error);
      alert('Erro ao exportar prova para LaTeX');
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

  const handleOpenEditDialog = () => {
    setEditNome(curso.nome || '');
    setEditDescricao(curso.descricao || '');
    setOpenEditDialog(true);
  };

  const handleEditSave = async () => {
    if (!editNome.trim()) {
      alert('O nome do curso é obrigatório');
      return;
    }

    setLoadingEdit(true);
    try {
      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: editNome.trim(),
          descricao: editDescricao.trim(),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao atualizar curso');
      }

      const updatedCurso = await res.json();
      
      // Atualizar o estado local com os novos dados
      setCurso(prevCurso => ({
        ...prevCurso,
        nome: updatedCurso.nome,
        descricao: updatedCurso.descricao,
      }));
      
      setOpenEditDialog(false);
      alert('Curso atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      alert(error.message || 'Erro ao atualizar curso. Tente novamente.');
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleOpenEditProva = async (prova) => {
    setEditingProva(prova);
    setEditProvaData({
      titulo: prova.titulo || '',
      instrucoes: prova.instrucoes || '',
      nomeEscola: prova.nomeEscola || '',
      disciplina: prova.disciplina || '',
      professor: prova.professor || '',
      data: prova.data || '',
      duracao: prova.duracao || '',
      valorTotal: prova.valorTotal || '',
      observacoes: prova.observacoes || '',
    });
    
    // Preencher questões selecionadas da prova
    const questoesProvaIds = (prova.questoes || []).map(q => q._id || q.id);
    setSelectedQuestoesProva(questoesProvaIds);
    
    // Preencher pontuações
    const pontuacoes = {};
    (prova.questoes || []).forEach(q => {
      const qId = q._id || q.id;
      pontuacoes[qId] = q.pontuacao || 0;
    });
    setQuestoesPontuacaoProva(pontuacoes);
    
    setOpenEditProvaDialog(true);
  };

  const handleChangeEditProva = (field) => (event) => {
    setEditProvaData({
      ...editProvaData,
      [field]: event.target.value,
    });
  };

  const handleToggleQuestaoProva = (questaoId) => {
    setSelectedQuestoesProva((prev) => {
      if (prev.includes(questaoId)) {
        // Remover questão
        return prev.filter(q => q !== questaoId);
      } else {
        // Adicionar questão no final da lista
        return [...prev, questaoId];
      }
    });
  };

  // Mover questão para cima na ordem (edição de prova)
  const handleMoveUpProva = (index) => {
    if (index === 0) return;
    setSelectedQuestoesProva((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  };

  // Mover questão para baixo na ordem (edição de prova)
  const handleMoveDownProva = (index) => {
    if (index === selectedQuestoesProva.length - 1) return;
    setSelectedQuestoesProva((prev) => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  // Remover questão da seleção (edição de prova)
  const handleRemoveQuestaoProva = (questaoId) => {
    setSelectedQuestoesProva((prev) => prev.filter(q => q !== questaoId));
    // Remover também a pontuação
    setQuestoesPontuacaoProva((prev) => {
      const newPontuacao = { ...prev };
      delete newPontuacao[questaoId];
      return newPontuacao;
    });
  };

  // Atualizar pontuação de uma questão (edição de prova)
  const handleChangePontuacaoProva = (questaoId, valor) => {
    const pontos = parseFloat(valor) || 0;
    setQuestoesPontuacaoProva((prev) => ({
      ...prev,
      [questaoId]: pontos,
    }));
  };

  // Calcular total de pontos (edição de prova)
  const calcularTotalPontosProva = () => {
    return selectedQuestoesProva.reduce((total, qId) => {
      return total + (questoesPontuacaoProva[qId] || 0);
    }, 0);
  };

  const handleSaveEditProva = async () => {
    if (!editProvaData.titulo.trim()) {
      alert('O título da prova é obrigatório');
      return;
    }

    if (!editProvaData.instrucoes.trim()) {
      alert('As instruções são obrigatórias');
      return;
    }

    setLoadingEditProva(true);
    try {
      const questoesSelecionadas = selectedQuestoesProva.map(qId => {
        const questao = curso.questoes.find(q => (q._id || q.id) === qId);
        return questao?._id || qId;
      });

      // Preparar pontuações usando os IDs reais
      const pontuacoes = {};
      selectedQuestoesProva.forEach(qId => {
        const questao = curso.questoes.find(q => (q._id || q.id) === qId);
        const realId = questao?._id || qId;
        pontuacoes[realId] = questoesPontuacaoProva[qId] || 0;
      });

      const res = await fetch(`/api/cursos/${cursoId}/provas/${editingProva.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editProvaData,
          questoesSelecionadas,
          questoesPontuacao: pontuacoes,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar prova');
      }

      alert('Prova atualizada com sucesso!');
      setOpenEditProvaDialog(false);
      setEditingProva(null);
      fetchProvas();
    } catch (error) {
      console.error('Erro ao atualizar prova:', error);
      alert(error.message || 'Erro ao atualizar prova. Tente novamente.');
    } finally {
      setLoadingEditProva(false);
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
                color="primary"
                startIcon={<Edit />}
                onClick={handleOpenEditDialog}
              >
                Editar Curso
              </Button>
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

      {/* Provas do Curso */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Provas ({provas.length})
          </Typography>
          <Link href={`/provas/criar?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
            >
              Criar Nova Prova
            </Button>
          </Link>
        </Box>

        {loadingProvas ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : provas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Nenhuma prova criada ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Crie uma prova para este curso.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {provas.map((prova, index) => (
              <Card key={prova.id || index} sx={{ backgroundColor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
                        {prova.titulo}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {prova.instrucoes}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        {prova.disciplina && (
                          <Chip 
                            label={`Disciplina: ${prova.disciplina}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {prova.professor && (
                          <Chip 
                            label={`Professor: ${prova.professor}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {prova.data && (
                          <Chip 
                            label={`Data: ${prova.data}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {prova.duracao && (
                          <Chip 
                            label={`Duração: ${prova.duracao}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {prova.valorTotal && (
                          <Chip 
                            label={`Valor: ${prova.valorTotal}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {prova.observacoes && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
                          Obs: {prova.observacoes}
                        </Typography>
                      )}

                      {/* Mostrar informações sobre questões e pontuação */}
                      {prova.questoes && prova.questoes.length > 0 && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                              Questões: {prova.questoes.length}
                            </Typography>
                            {prova.questoes.some(q => q.pontuacao > 0) && (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                  •
                                </Typography>
                                <Chip
                                  label={`${prova.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0).toFixed(1)} pts`}
                                  size="small"
                                  color={
                                    prova.valorTotal && 
                                    prova.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0) > parseFloat(prova.valorTotal)
                                      ? 'warning'
                                      : 'success'
                                  }
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                                />
                                {prova.valorTotal && 
                                 prova.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0) > parseFloat(prova.valorTotal) && (
                                  <Chip
                                    label={`+${(prova.questoes.reduce((sum, q) => sum + (q.pontuacao || 0), 0) - parseFloat(prova.valorTotal)).toFixed(1)} pts extra`}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditProva(prova)}
                        title="Editar prova"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="success"
                        onClick={() => handleExportLatex(prova.id)}
                        title="Exportar para LaTeX"
                      >
                        <Download />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteProva(prova.id)}
                        title="Excluir prova"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
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
            <Link href={`/provas/criar?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Assignment />}
              >
                Criar Prova
              </Button>
            </Link>
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
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
                        {index + 1}. {questao.enunciado}
                      </Typography>
                      
                      {/* Exibir recurso associado (imagem) se houver */}
                      {questao.recursoUrl && (
                        <Box
                          component="img"
                          src={questao.recursoUrl}
                          alt="Recurso da questão"
                          sx={{
                            width: '100%',
                            maxHeight: 300,
                            objectFit: 'contain',
                            borderRadius: 1,
                            mb: 2,
                            backgroundColor: 'background.default'
                          }}
                        />
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
                      
                      {/* Exibir alternativas completas para questões de múltipla escolha */}
                      {questao.tipo === 'alternativa' && questao.alternativas && questao.alternativas.length > 0 && (
                        <List dense>
                          {questao.alternativas.map((alt, idx) => (
                            <ListItem key={idx} sx={{ pl: 2 }}>
                              <ListItemText
                                primary={`${alt.letra || String.fromCharCode(65 + idx)}) ${alt.texto} ${alt.correta ? '(Correta)' : ''}`}
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

                      {/* Exibir afirmações (V ou F) com gabarito */}
                      {questao.tipo === 'afirmacoes' && Array.isArray(questao.afirmacoes) && (
                        <List dense>
                          {questao.afirmacoes.map((af, idx) => (
                            <ListItem key={idx} sx={{ pl: 2, alignItems: 'flex-start' }}>
                              <Typography sx={{ mr: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                                {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][idx] || (idx + 1)}.
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
                            {questao.proposicoes.map((p, idx) => (
                              <ListItem key={idx} sx={{ pl: 2, alignItems: 'flex-start' }}>
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
                    </Box>

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveQuestao(questao.id)}
                      title="Remover do curso"
                      sx={{ ml: 2 }}
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
                  component="div"
                  onClick={() => handleToggleQuestao(questao.id)}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1,
                    cursor: 'pointer',
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
                    secondaryTypographyProps={{ component: 'div' }}
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

      {/* Dialog de Edição do Curso */}
      <Dialog
        open={openEditDialog}
        onClose={() => !loadingEdit && setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Curso</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome do Curso"
            type="text"
            fullWidth
            variant="outlined"
            value={editNome}
            onChange={(e) => setEditNome(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            label="Descrição"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editDescricao}
            onChange={(e) => setEditDescricao(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={loadingEdit}>
            Cancelar
          </Button>
          <Button onClick={handleEditSave} variant="contained" disabled={loadingEdit}>
            {loadingEdit ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Edição de Prova */}
      <Dialog
        open={openEditProvaDialog}
        onClose={() => !loadingEditProva && setOpenEditProvaDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Prova</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Informações básicas */}
            <TextField
              fullWidth
              required
              label="Título da Prova"
              value={editProvaData.titulo}
              onChange={handleChangeEditProva('titulo')}
              variant="outlined"
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              required
              label="Instruções"
              value={editProvaData.instrucoes}
              onChange={handleChangeEditProva('instrucoes')}
              variant="outlined"
              multiline
              rows={3}
            />

            <TextField
              fullWidth
              label="Observações"
              value={editProvaData.observacoes}
              onChange={handleChangeEditProva('observacoes')}
              variant="outlined"
              multiline
              rows={2}
            />

            <Divider sx={{ my: 1 }} />

            {/* Dados do cabeçalho */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Dados do Cabeçalho
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                label="Nome da Escola/Instituição"
                value={editProvaData.nomeEscola}
                onChange={handleChangeEditProva('nomeEscola')}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Disciplina"
                value={editProvaData.disciplina}
                onChange={handleChangeEditProva('disciplina')}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Nome do Professor"
                value={editProvaData.professor}
                onChange={handleChangeEditProva('professor')}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Data"
                type="date"
                value={editProvaData.data}
                onChange={handleChangeEditProva('data')}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />

              <TextField
                fullWidth
                label="Duração"
                value={editProvaData.duracao}
                onChange={handleChangeEditProva('duracao')}
                variant="outlined"
              />

              <TextField
                fullWidth
                label="Valor Total"
                value={editProvaData.valorTotal}
                onChange={handleChangeEditProva('valorTotal')}
                variant="outlined"
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Questões da prova */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Questões da Prova
            </Typography>

            {(!curso.questoes || curso.questoes.length === 0) ? (
              <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Nenhuma questão cadastrada neste curso.
              </Typography>
            ) : (
              <Box>
                {/* Questões Selecionadas - Ordenáveis */}
                {selectedQuestoesProva.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        Questões Selecionadas ({selectedQuestoesProva.length})
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Total:
                        </Typography>
                        <Chip
                          label={`${calcularTotalPontosProva().toFixed(1)} pts`}
                          size="small"
                          color={
                            editProvaData.valorTotal && calcularTotalPontosProva() > parseFloat(editProvaData.valorTotal)
                              ? 'warning'
                              : 'success'
                          }
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                        />
                        {editProvaData.valorTotal && calcularTotalPontosProva() > parseFloat(editProvaData.valorTotal) && (
                          <Chip
                            label={`+${(calcularTotalPontosProva() - parseFloat(editProvaData.valorTotal)).toFixed(1)} extra`}
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    </Box>
                    <List sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1, maxHeight: 250, overflow: 'auto' }}>
                      {selectedQuestoesProva.map((questaoId, index) => {
                        const questao = curso.questoes.find(q => (q._id || q.id) === questaoId);
                        if (!questao) return null;

                        return (
                          <ListItem
                            key={`selected-${questaoId}`}
                            sx={{
                              border: 1,
                              borderColor: 'primary.main',
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: 'background.paper',
                              p: 1,
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {/* Número da ordem */}
                            <Box
                              sx={{
                                minWidth: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                borderRadius: 1,
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                              }}
                            >
                              {index + 1}
                            </Box>

                            {/* Conteúdo da questão */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }} noWrap>
                                {questao.enunciado || 'Sem enunciado'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {questao.tipo && (
                                  <Chip label={questao.tipo} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                )}
                                {questao.tags?.slice(0, 2).map((tag, idx) => (
                                  <Chip 
                                    key={`sel-tag-${questaoId}-${idx}`} 
                                    label={tag} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                ))}
                              </Box>
                            </Box>

                            {/* Campo de pontuação */}
                            <TextField
                              type="number"
                              label="Pts"
                              value={questoesPontuacaoProva[questaoId] || ''}
                              onChange={(e) => handleChangePontuacaoProva(questaoId, e.target.value)}
                              inputProps={{
                                min: 0,
                                step: 0.5,
                                style: { textAlign: 'center', fontSize: '0.85rem' }
                              }}
                              sx={{ width: 70 }}
                              size="small"
                            />

                            {/* Botões de controle */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveUpProva(index);
                                }}
                                disabled={index === 0}
                                sx={{ minWidth: 'auto', p: 0.25 }}
                              >
                                <ArrowUpward fontSize="small" />
                              </Button>
                              <Button
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveDownProva(index);
                                }}
                                disabled={index === selectedQuestoesProva.length - 1}
                                sx={{ minWidth: 'auto', p: 0.25 }}
                              >
                                <ArrowDownward fontSize="small" />
                              </Button>
                            </Box>

                            <Button
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveQuestaoProva(questaoId);
                              }}
                              sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                              <ClearIcon fontSize="small" />
                            </Button>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}

                {/* Divider se houver questões selecionadas */}
                {selectedQuestoesProva.length > 0 && (
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Questões Disponíveis" size="small" />
                  </Divider>
                )}

                {/* Questões Disponíveis */}
                <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {curso.questoes
                    .filter(questao => !selectedQuestoesProva.includes(questao._id || questao.id))
                    .map((questao) => {
                      const questaoId = questao._id || questao.id;

                      return (
                        <ListItem
                          key={questaoId}
                          dense
                          component="div"
                          onClick={() => handleToggleQuestaoProva(questaoId)}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <Checkbox
                            checked={false}
                            tabIndex={-1}
                            disableRipple
                          />
                          <ListItemText
                            primary={questao.enunciado || 'Sem enunciado'}
                            secondaryTypographyProps={{ component: 'div' }}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {questao.tipo && (
                                  <Chip label={questao.tipo} size="small" />
                                )}
                                {questao.tags?.slice(0, 2).map((tag, idx) => (
                                  <Chip key={idx} label={tag} size="small" variant="outlined" />
                                ))}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditProvaDialog(false)} disabled={loadingEditProva}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEditProva} variant="contained" disabled={loadingEditProva}>
            {loadingEditProva ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
