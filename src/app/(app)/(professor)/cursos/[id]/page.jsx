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
import { FormControlLabel, Switch } from '@mui/material';
import { 
  Add, 
  Edit, 
  Delete, 
  PostAdd,
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
  RateReview,
  Visibility,
  CheckCircle,
  Assessment as AssessmentIcon
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
  
  // Estados para listas de exercícios
  const [exercícios, setExercícios] = useState([]);
  const [loadingExercícios, setLoadingExercícios] = useState(false);
  const [listasFinalizadas, setListasFinalizadas] = useState({}); // { listaId: boolean }

  // Estados para o diálogo de adicionar questões existentes
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [selectedQuestoes, setSelectedQuestoes] = useState([]);
  const [loadingQuestoes, setLoadingQuestoes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
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

  //Estados para o diálogo de edição de lista de exercícios
  const [openEditListaDialog, setOpenEditListaDialog] = useState(false);
  const [editingLista, setEditingLista] = useState(null);
  const [loadingEditLista, setLoadingEditLista] = useState(false);
  const [editListaData, setEditListaData] = useState({
    tituloLista: '',
    nomeInstituicao: '',
  });
  const [selectedQuestoesLista, setSelectedQuestoesLista] = useState([]); // Apenas os IDs
  const [usarPontuacaoLista, setUsarPontuacaoLista] = useState(false);
  const [questoesPontuacaoLista, setQuestoesPontuacaoLista] = useState({});

  // Estado e handlers para diálogo "Gerar Lista de Exercícios"
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [includeGabarito, setIncludeGabarito] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [listaToGenerate, setListaToGenerate] = useState(null);

  const handleOpenGenerateDialog = (lista) => {
    setListaToGenerate(lista);
    setIncludeGabarito(false);
    setOpenGenerateDialog(true);
  };

  const handleConfirmGenerate = async () => {
    if (!listaToGenerate) return;
    setGenerating(true);
    setError(null);

    try {
      const rawId = listaToGenerate.id || listaToGenerate._id || listaToGenerate._id?.$oid || listaToGenerate._id?.toString?.();
      const listaId = rawId;
      if (!listaId) throw new Error('ID da lista não disponível');

      const url = `/api/cursos/${cursoId}/listas/${listaId}/gerar-lista?includeGabarito=${includeGabarito}`;

      const resp = await fetch(url, { method: 'GET' });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.message || 'Falha ao gerar a lista');
      }

      // Se o endpoint retornou conteúdo LaTeX, oferecer download / abrir em nova aba
      if (data.latexContent) {
        const blob = new Blob([data.latexContent], { type: 'text/x-tex' });
        const blobUrl = URL.createObjectURL(blob);

        // Tenta abrir em nova aba; se bloqueado, força download
        const opened = window.open(blobUrl, '_blank');
        if (!opened) {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = data.fileName || `lista_${Date.now()}.tex`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }
      }

      alert(data.message || 'Lista gerada com sucesso.');
      setOpenGenerateDialog(false);
      setListaToGenerate(null);
    } catch (err) {
      console.error('Erro ao gerar lista:', err);
      const msg = err?.message || 'Erro ao gerar lista. Tente novamente.';
      setError(msg);
      alert(msg);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    fetchCurso();
    fetchProvas();
    fetchExercícios();
  }, [cursoId]);

  // Efeito para busca (DEBOUNCE)
  useEffect(() => {
    if (!openAddDialog) return;
    
    const timer = setTimeout(() => {
      // Quando o usuário parar de digitar por 500ms, dispara uma NOVA busca (página 1)
      fetchQuestoes(1, true);
    }, 500); // 500ms de atraso

    // Limpa o timer se o usuário digitar novamente
    return () => clearTimeout(timer);
  }, [searchQuery, openAddDialog]); // Roda quando a busca ou o dialog mudam


  const fetchCurso = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`/api/cursos/${cursoId}`, { cache: 'no-store' });
      
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

  const fetchQuestoes = async (pageToFetch, isNewSearch = false) => {
    // Evita buscas duplicadas se já estiver carregando
    if (loadingQuestoes && !isNewSearch) return; 
    
    setLoadingQuestoes(true);

    try {
      // Monta a URL da API com paginação e busca
      const url = `/api/questoes?page=${pageToFetch}&limit=20&search=${searchQuery}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error('Erro ao carregar questões');
      
      const data = await res.json();
      const novasQuestoes = data.items || [];

      // Filtra questões que já estão no curso
      const questoesJaAdicionadas = curso.questoes?.map(q => q.id || q._id) || [];
      const questoesFiltradas = novasQuestoes.filter(
        q => !questoesJaAdicionadas.includes(q.id || q._id)
      );

      // Se for uma nova busca (ou página 1), substitui a lista
      if (pageToFetch === 1 || isNewSearch) {
        setQuestoesDisponiveis(questoesFiltradas);
      } else {
        // Se não, anexa os novos resultados à lista existente
        setQuestoesDisponiveis(prev => [...prev, ...questoesFiltradas]);
      }
      
      // Atualiza os controles de paginação
      setPage(pageToFetch);
      setHasMore((pageToFetch * 20) < data.total);

    } catch (err) {
      console.error('Erro ao buscar questões:', err);
      alert('Erro ao carregar questões'); 
    } finally {
      setLoadingQuestoes(false);
    }
  };

  const fetchExercícios = async () => {
    try {
      setLoadingExercícios(true);
      const res = await fetch(`/api/cursos/${cursoId}/listas`);
      if (!res.ok) throw new Error('Erro ao carregar listas');
      const data = await res.json();
      const listas = data.items || [];
      setExercícios(listas);
      
      // Para cada lista, verificar se já foi finalizada
      const statusMap = {};
      await Promise.all(
        listas.map(async (lista) => {
          try {
            const listaId = lista.id || lista._id;
            const respostasRes = await fetch(`/api/cursos/${cursoId}/listas/${listaId}/respostas`);
            if (respostasRes.ok) {
              const respostasData = await respostasRes.json();
              statusMap[listaId] = respostasData.finalizado || false;
            } else {
              statusMap[listaId] = false;
            }
          } catch (err) {
            console.error('Erro ao verificar status da lista:', err);
            statusMap[lista.id || lista._id] = false;
          }
        })
      );
      setListasFinalizadas(statusMap);
    } catch (err) {
      console.error('Erro ao buscar listas:', err);
      setExercícios([]);
    } finally {
      setLoadingExercícios(false);
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

  const handleDeleteLista = async (listaId) => {
    if (!confirm('Tem certeza que deseja excluir esta lista de exercícios?')) return;

    try {
      const res = await fetch(`/api/cursos/${cursoId}/listas/${listaId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao excluir lista');
      }

      alert('Lista excluída com sucesso!');
      fetchExercícios();
    } catch (error) {
      console.error('Erro ao excluir lista:', error);
      alert(error.message || 'Erro ao excluir lista');
    }
  }

  const handleExportLatex = async (provaId) => {
    alert('Gerando arquivo LaTeX...');
    
    try {
      const res = await fetch(`/api/cursos/${cursoId}/provas/${provaId}/gerar-prova`);
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(err.message || 'Falha ao gerar arquivo LaTeX no servidor');
      }

      const data = await res.json();
      
      if (!data.success || !data.latexContent) {
        throw new Error(data.message || 'A API não retornou o conteúdo do arquivo.');
      }
      
      const blob = new Blob([data.latexContent], { 
        type: 'text/x-latex;charset=utf-8' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', data.fileName); 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Erro ao exportar para LaTeX:', error);
      alert('Erro ao exportar prova para LaTeX: ');
    } finally {
    }
  };

  const handleGerarLista = async (listaId) => {
  }

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
    setSearchQuery(''); // Reseta a busca
    setSelectedQuestoes([]); // Reseta a seleção
    setQuestoesDisponiveis([]); // Limpa a lista antiga
    setHasMore(true); // Reseta a paginação
    fetchQuestoes(1, true); // Busca a primeira página
  };

  const handleLoadMore = () => {
    // Busca a próxima página
    fetchQuestoes(page + 1, false);
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

  const handleOpenEditLista = async (lista) => {
    setEditingLista(lista); // Armazena a lista original
    
    // Define os dados dos campos do formulário
    setEditListaData({
      tituloLista: lista.tituloLista || '',
      nomeInstituicao: lista.nomeInstituicao || '',
    });
    
    // Preenche as questões selecionadas (são apenas IDs)
    setSelectedQuestoesLista(lista.questoesIds || []);
    
    // Configurar pontuação
    setUsarPontuacaoLista(lista.usarPontuacao || false);
    setQuestoesPontuacaoLista(lista.questoesPontuacao || {});
    
    setOpenEditListaDialog(true);
  };

  const handleChangeEditLista = (field) => (event) => {
    setEditListaData({
      ...editListaData,
      [field]: event.target.value,
    });
  };

  const handleToggleQuestaoLista = (questaoId) => {
    setSelectedQuestoesLista((prev) => {
      if (prev.includes(questaoId)) {
        return prev.filter(q => q !== questaoId);
      } else {
        return [...prev, questaoId];
      }
    });
  };

  // Mover questão para cima na ordem (edição de lista)
  const handleMoveUpLista = (index) => {
    if (index === 0) return;
    setSelectedQuestoesLista((prev) => {
      const newOrder = [...prev];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      return newOrder;
    });
  };

  // Mover questão para baixo na ordem (edição de lista)
  const handleMoveDownLista = (index) => {
    if (index === selectedQuestoesLista.length - 1) return;
    setSelectedQuestoesLista((prev) => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  // Remover questão da seleção (edição de lista)
  const handleRemoveQuestaoLista = (questaoId) => {
    setSelectedQuestoesLista((prev) => prev.filter(q => q !== questaoId));
    // Remover também a pontuação se estiver usando
    if (usarPontuacaoLista) {
      setQuestoesPontuacaoLista((prev) => {
        const newPontuacao = { ...prev };
        delete newPontuacao[questaoId];
        return newPontuacao;
      });
    }
  };

  // Atualizar pontuação de uma questão (edição de lista)
  const handleChangePontuacaoLista = (questaoId, valor) => {
    const pontos = parseFloat(valor) || 0;
    setQuestoesPontuacaoLista((prev) => ({
      ...prev,
      [questaoId]: pontos,
    }));
  };

  // Calcular total de pontos (edição de lista)
  const calcularTotalPontosLista = () => {
    return selectedQuestoesLista.reduce((total, qId) => {
      return total + (questoesPontuacaoLista[qId] || 0);
    }, 0);
  };

  const handleSaveEditLista = async () => {
    if (!editListaData.tituloLista.trim()) {
      alert('O nome da matéria é obrigatório');
      return;
    }

    setLoadingEditLista(true);
    try {
      // Preparar IDs das questões
      const questoesIds = selectedQuestoesLista.map(qId => {
        const questao = curso.questoes.find(q => (q._id || q.id) === qId);
        return questao?._id || qId;
      });

      // Preparar dados para envio
      const listaData = {
        ...editListaData,
        questoesIds,
        usarPontuacao: usarPontuacaoLista,
      };

      // Se usar pontuação, incluir as pontuações
      if (usarPontuacaoLista) {
        const pontuacoes = {};
        selectedQuestoesLista.forEach(qId => {
          const questao = curso.questoes.find(q => (q._id || q.id) === qId);
          const realId = questao?._id || qId;
          pontuacoes[realId] = questoesPontuacaoLista[qId] || 0;
        });
        listaData.questoesPontuacao = pontuacoes;
      }

      const res = await fetch(`/api/cursos/${cursoId}/listas/${editingLista.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listaData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao atualizar lista');
      }

      alert('Lista atualizada com sucesso!');
      setOpenEditListaDialog(false);
      setEditingLista(null);
      fetchExercícios(); // Re-busca as listas
    } catch (error) {
      console.error('Erro ao atualizar lista:', error);
      alert(error.message || 'Erro ao atualizar lista. Tente novamente.');
    } finally {
      setLoadingEditLista(false);
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
              {curso.codigo && (
                <Chip 
                  label={`Código: ${curso.codigo}`} 
                  color="primary" 
                  variant="outlined"
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
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
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
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
          <Link href={`/provas?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
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

                      <Link href={`/provas/${prova.id}/dashboard`} passHref style={{ textDecoration: 'none' }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          startIcon={<AssessmentIcon />}
                          sx={{ mr: 1 }} 
                          title="Ver estatísticas da turma"
                        >
                          Dashboard
                        </Button>
                      </Link>

                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditProva(prova)}
                        title="Editar prova"
                      >
                        <Edit />
                      </IconButton>
                      <Link href={`/aluno/cursos/${cursoId}/provas/${prova.id}/resultado`} passHref>
                        <IconButton
                          color="info"
                          title="Ver como Aluno (Teste)"
                        >
                          <Visibility />
                        </IconButton>
                      </Link>
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

      {/* Exercícios do Curso */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Listas de Exercícios ({exercícios.length})
          </Typography>
          <Link href={`/listas/criar?cursoId=${cursoId}&cursoNome=${encodeURIComponent(curso.nome)}`} passHref style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Add />}
            >
              Criar Nova Lista de Exercícios
            </Button>
          </Link>
        </Box>
        {loadingExercícios ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : exercícios.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Nenhuma lista de exercícios criada ainda.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Crie uma lista de exercícios para este curso.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {exercícios.map((lista, index) => (
              <Card key={lista.id || index} sx={{ backgroundColor: 'background.paper' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                          {lista.tituloLista}
                        </Typography>
                        {listasFinalizadas[lista.id || lista._id] && (
                          <Chip 
                            icon={<CheckCircle />}
                            label="Finalizado" 
                            color="success" 
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                      </Box>

                      {lista.nomeInstituicao && (
                        <Box sx={{ display: 'inline-block'}}>
                          <Chip 
                            label={`Instituição: ${lista.nomeInstituicao}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      )}

                      {/* Mostrar informações sobre questões */}
                      {lista.questoesIds && lista.questoesIds.length > 0 && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                              Questões: {lista.questoesIds.length}
                            </Typography>
                            {lista.usarPontuacao && lista.questoesPontuacao && (
                              <>
                                <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                  •
                                </Typography>
                                <Chip
                                  label={`${Object.values(lista.questoesPontuacao).reduce((sum, p) => sum + (p || 0), 0).toFixed(1)} pts`}
                                  size="small"
                                  color="success"
                                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                                />
                              </>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      {lista.usarPontuacao && (
                        <IconButton
                          color="primary"
                          onClick={() => {
                            const listaId = lista.id || lista._id;
                            const isFinalizado = listasFinalizadas[listaId];
                            if (isFinalizado) {
                              router.push(`/cursos/${cursoId}/listas/${listaId}/visualizar`);
                            } else {
                              router.push(`/cursos/${cursoId}/listas/${listaId}/responder`);
                            }
                          }}
                          title={listasFinalizadas[lista.id || lista._id] ? "Visualizar Respostas" : "Responder Lista"}
                        >
                          {listasFinalizadas[lista.id || lista._id] ? <Visibility /> : <RateReview />}
                        </IconButton>
                      )}
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditLista(lista)}
                        title="Editar lista"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="success"
                        onClick={() => handleOpenGenerateDialog(lista)}
                        title="Exportar para LaTeX"
                      >
                        <PostAdd />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteLista(lista.id)}
                        title="Excluir lista"
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
          {/*Barra de busca*/}
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

          {/*Lista de questões */}
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {questoesDisponiveis.map((questao) => (
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

          {/*Feedback de Carregamento */}
          {loadingQuestoes && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          {/* 4. Botão "Carregar Mais" (NOVO) */}
          {hasMore && !loadingQuestoes && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <Button onClick={handleLoadMore}>
                Carregar Mais
              </Button>
            </Box>
          )}

          {/*Mensagem de "Nada encontrado" ou "Fim da lista"*/}
          {!hasMore && !loadingQuestoes && (
            <Typography sx={{ textAlign: 'center', p: 2, color: 'text.secondary' }}>
              {questoesDisponiveis.length === 0
                ? (searchQuery ? 'Nenhuma questão encontrada com essa busca.' : 'Nenhuma questão disponível para adicionar.')
                : 'Todas as questões foram exibidas.'
              }
            </Typography>
          )}

          {/*Contagem de selecionadas) */}
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

        {editingProva && (
          <>
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
                            // Tenta encontrar na lista de questões JÁ SALVAS na prova (isso inclui questões que podem ter sido removidas do curso)
                            let questao = editingProva.questoes.find(q => (q._id || q.id) === questaoId);

                            // Se não encontrar (é uma questão NOVA, recém-adicionada), busca na lista principal de questões do CURSO.
                            if (!questao) {
                              questao = curso.questoes.find(q => (q._id || q.id) === questaoId);
                            }
                            // Se não encontrar em NENHUM lugar (não deve acontecer), pula.
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
          </>
        )}
      </Dialog>

      {/*Dialog para Editar Lista de Exercícios*/}
      <Dialog
        open={openEditListaDialog}
        onClose={() => !loadingEditLista && setOpenEditListaDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Lista de Exercícios</DialogTitle>

        {editingLista && (
          <>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                
                {/* Informações básicas (Simplificado para Listas) */}
                <TextField
                  fullWidth
                  required
                  label="Conteúdo da Lista"
                  value={editListaData.tituloLista}
                  onChange={handleChangeEditLista('tituloLista')}
                  variant="outlined"
                />

                <TextField
                  fullWidth
                  label="Nome da Escola/Instituição"
                  value={editListaData.nomeInstituicao}
                  onChange={handleChangeEditLista('nomeInstituicao')}
                  variant="outlined"
                />
                
                <Divider sx={{ my: 1 }} />

                {/* Questões da lista */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Questões da Lista
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={usarPontuacaoLista}
                        onChange={(e) => setUsarPontuacaoLista(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Usar Pontuação"
                  />
                </Box>

                {(!curso.questoes || curso.questoes.length === 0) ? (
                  <Typography color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    Nenhuma questão cadastrada neste curso.
                  </Typography>
                ) : (
                  <Box>
                    {/* Questões Selecionadas - Ordenáveis */}
                    {selectedQuestoesLista.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Questões Selecionadas ({selectedQuestoesLista.length})
                          </Typography>
                          {usarPontuacaoLista && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Total:
                              </Typography>
                              <Chip
                                label={`${calcularTotalPontosLista().toFixed(1)} pts`}
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                              />
                            </Box>
                          )}
                        </Box>
                        <List sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1, maxHeight: 250, overflow: 'auto' }}>
                          {selectedQuestoesLista.map((questaoId, index) => {
                            
                            // LÓGICA DE BUSCA SIMPLIFICADA (A GRANDE MUDANÇA)
                            // Listas usam Referência, então *sempre* buscamos do 'curso.questoes'
                            const questao = curso.questoes.find(q => (q._id || q.id) === questaoId);
                            
                            // Se a questão foi deletada do curso, ela não aparecerá aqui.
                            // Este é o comportamento esperado para Listas (Referência).
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

                                {/* Campo de pontuação (se ativado) */}
                                {usarPontuacaoLista && (
                                  <TextField
                                    type="number"
                                    label="Pts"
                                    value={questoesPontuacaoLista[questaoId] || ''}
                                    onChange={(e) => handleChangePontuacaoLista(questaoId, e.target.value)}
                                    inputProps={{
                                      min: 0,
                                      step: 0.5,
                                      style: { textAlign: 'center', fontSize: '0.85rem' }
                                    }}
                                    sx={{ width: 70 }}
                                    size="small"
                                  />
                                )}

                                {/* Botões de controle */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveUpLista(index);
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
                                      handleMoveDownLista(index);
                                    }}
                                    disabled={index === selectedQuestoesLista.length - 1}
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
                                    handleRemoveQuestaoLista(questaoId);
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
                    {selectedQuestoesLista.length > 0 && (
                      <Divider sx={{ my: 1 }}>
                        <Chip label="Questões Disponíveis" size="small" />
                      </Divider>
                    )}

                    {/* Questões Disponíveis */}
                    <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      {curso.questoes
                        .filter(questao => !selectedQuestoesLista.includes(questao._id || questao.id))
                        .map((questao) => {
                          const questaoId = questao._id || questao.id;

                          return (
                            <ListItem
                              key={questaoId}
                              dense
                              component="div"
                              onClick={() => handleToggleQuestaoLista(questaoId)}
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
              <Button onClick={() => setOpenEditListaDialog(false)} disabled={loadingEditLista}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEditLista} variant="contained" disabled={loadingEditLista}>
                {loadingEditLista ? 'Salvando...' : 'Salvar Lista'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog para Gerar Lista de Exercícios */}
      <Dialog
        open={openGenerateDialog}
        onClose={() => !generating && setOpenGenerateDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Gerar Lista de Exercícios</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            {listaToGenerate ? `Você está prestes a gerar a lista "${listaToGenerate.tituloLista}".` : 'Você está prestes a gerar uma lista de exercícios.'}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={includeGabarito}
                onChange={(e) => setIncludeGabarito(e.target.checked)}
                color="primary"
                disabled={generating}
              />
            }
            label="Incluir o gabarito"
          />
        </DialogContent>
        <DialogActions sx={{ px: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button onClick={() => setOpenGenerateDialog(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmGenerate} variant="contained" disabled={generating}>
              {generating ? 'Gerando...' : 'Confirmar'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}