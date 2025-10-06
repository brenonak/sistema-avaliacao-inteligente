"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link'; 
import { Box, Typography, Button, Card, CardContent, List, ListItem, ListItemText, CircularProgress, CardActions } from '@mui/material';
import EditQuestionModal from '../components/EditQuestionModal';


export default function ListarQuestoesPage() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(() => {
    async function fetchQuestoes() {
      try {
        setLoading(true);
        const res = await fetch('/api/questoes');
        if (!res.ok) throw new Error('Erro ao buscar questões');
        const data = await res.json();
        setQuestoes(data.items || []);
      } catch (err) {
        setError(err.message || 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestoes();
  }, []);

  const handleDelete = async (questionId) => {
    if (!confirm('Tem certeza que deseja excluir esta questão? A ação não poderá ser desfeita')) {
      return;
    }

    try {
      // TODO: A chamada para a API abaixo está pronta.
      // Ela funcionará corretamente assim que o endpoint DELETE /api/questoes/:id estiver implementado no back-end.
      // Atualmente, essa chamada retornará um erro 404.
      // Implemente o endpoint no back-end para que a exclusão funcione corretamente.
      // Após implementar, teste a funcionalidade para garantir que tudo está funcionando como esperado.
      const res = await fetch(`/api/questoes/${questionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir questão');
      }

      // Remover a questão da lista localmente
      setQuestoes((prevQuestoes) => prevQuestoes.filter((q) => q.id !== questionId));
      alert('Questão excluída com sucesso');

    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro desconhecido ao excluir questão');
    }
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

      alert('Arquivo LaTeX gerado com sucesso!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Falha ao gerar arquivo LaTeX');
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
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
        Questões Cadastradas
      </Typography>
      
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
              <List dense>
                {questao.alternativas?.map((alt, index) => (
                  <ListItem key={index} sx={{ pl: 2 }}>
                    <ListItemText
                      primary={`${alt.texto} ${alt.correta ? '(Correta)' : ''}`}
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
            </CardContent>
            <CardActions sx={{ marginTop: 'auto', alignSelf: 'flex-end', p: 2 }}>
                <Button 
                  size="small" 
                  variant="contained" 
                  color="secondary"
                  onClick={() => handleOpenEditModal(questao)}
                >
                  Editar
                </Button>
                <Button 
                    size="small" 
                    variant="contained" 
                    color="error"
                    onClick={() => handleDelete(questao.id)}
                >
                    Excluir
                </Button>
            </CardActions>
          </Card>
        ))}
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

    </Box>
  );
}