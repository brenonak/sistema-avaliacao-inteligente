"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Card, CardContent, List, ListItem, ListItemText, CircularProgress, CardActions } from '@mui/material';
import ColorModeButtons from '../components/ColorModeButtons';

export default function ListarQuestoesPage() {
  const [questoes, setQuestoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <ColorModeButtons />
      
      <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold', color: 'text.primary' }}>
        Questões Cadastradas
      </Typography>
      
      {/* Só mostra o botão se não estiver carregando, não houver erro, e houver pelo menos uma questão na lista */}
      {!loading && !error && questoes.length > 0 && (
        <Button
          variant="contained"
          color="success"
          onClick={() => alert('Funcionalidade de exportação ainda a ser implementada')}
          sx={{ mb: 3 }}
        >
          Exportar para PDF
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
            key={questao.id || questao._id || idx}
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
                <Link href={`/questoes/${questao._id}/editar`} passHref>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="secondary"
                      onClick={() => alert(`A função de editar será implementada na próxima task.`)}
                      >
                        Editar
                    </Button>
                </Link>
                <Button 
                    size="small" 
                    variant="contained" 
                    color="error"
                    onClick={() => alert(`A função de excluir será implementada na próxima task.`)}
                >
                    Excluir
                </Button>
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}