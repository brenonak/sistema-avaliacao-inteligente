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
    <Card sx={{ width: '100%', maxWidth: 320, borderRadius: 3, mx: 'auto' }}>
      <Link href={computedHref} passHref style={{ textDecoration: 'none' }}>
        <CardActionArea>
          <CardMedia
            sx={{ height: 100 }}
            image={imgSrc}
            title={imgTitle}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {classroomTitle}
            </Typography>
            {teacherName && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {teacherName}
              </Typography>
            )}
            {questoesCount !== undefined && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                {questoesCount} {questoesCount === 1 ? 'questão' : 'questões'}
              </Typography>
            )}
            {codigoAcesso && (
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Código:
                </Typography>
                <Chip
                  label={codigoAcesso}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Link>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {codigoAcesso && (
          <Tooltip title="Copiar código de acesso">
            <IconButton
              size="small"
              onClick={handleCopyCodigo}
              color="primary"
            >
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {!aluno && (
          <Box sx={{ ml: 'auto' }}>
            <CardOptionsButton 
              cursoId={cursoId} 
              onDelete={onDelete}
              cursoNome={classroomTitle}
              cursoDescricao={cursoDescricao}
            />
          </Box>
        )}
      </CardActions>
    </Card>
  );
}