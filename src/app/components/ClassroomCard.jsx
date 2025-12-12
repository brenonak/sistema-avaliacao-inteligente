import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardOptionsButton from './CardOptionsButton';
import { CardActionArea, Box, IconButton, Chip, Tooltip } from '@mui/material';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { ContentCopy } from '@mui/icons-material';

export default function ClassroomCard(props) {
  const { 
    imgSrc, 
    imgTitle, 
    classroomTitle, 
    teacherName, 
    cursoId, 
    onDelete,
    cursoDescricao = '',
    questoesCount,
    href,
    aluno = false, // adiciona aluno ao href quando verdadeiro
    codigoAcesso, // novo prop para o código de acesso
  } = props;

  const computedHref = href ?? (cursoId ? (aluno ? `/aluno/cursos/${cursoId}` : `/cursos/${cursoId}`) : '#');

  const handleCopyCodigo = (e) => {
    e.preventDefault();
    if (codigoAcesso) {
      navigator.clipboard.writeText(codigoAcesso).then(() => {
        // Mostrar feedback visual (pode ser melhorado com Snackbar)
        alert('Código copiado: ' + codigoAcesso);
      });
    }
  };

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 320 },
        borderRadius: 3,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Link href={computedHref} passHref style={{ textDecoration: 'none' }}>
        <CardActionArea sx={{ flexGrow: 1 }}>
          <CardMedia
            sx={{ 
              height: { xs: 140, sm: 100 }, 
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            image={imgSrc}
            title={imgTitle}
          />
          <CardContent>
            <Typography
              gutterBottom
              variant="h5"
              component="div"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' }, 
                fontWeight: 700,
                lineHeight: 1.1,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {classroomTitle}
            </Typography>
            {teacherName && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {teacherName}
              </Typography>
            )}
            {questoesCount !== undefined && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {questoesCount} {questoesCount === 1 ? 'questão' : 'questões'}
              </Typography>
            )}
            {codigoAcesso && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Código:
                </Typography>
                <Chip
                  label={codigoAcesso}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}
                />
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Link>

      <CardActions
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 1.5,
          py: { xs: 1, sm: 0.5 },
          gap: { xs: 1, sm: 0 },
          flexWrap: 'wrap',
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          {codigoAcesso && (
            <Tooltip title="Copiar código de acesso">
              <IconButton
                size="small"
                onClick={handleCopyCodigo}
                color="primary"
                aria-label="Copiar código"
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: { xs: 'flex-end', sm: 'flex-end' } }}>
          <CardOptionsButton 
            cursoId={cursoId} 
            onDelete={onDelete}
            cursoNome={classroomTitle}
            cursoDescricao={cursoDescricao}
          />
        </Box>
      </CardActions>
    </Card>
  );
}