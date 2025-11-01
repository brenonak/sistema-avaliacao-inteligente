import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardOptionsButton from './CardOptionsButton';
import { CardActionArea } from '@mui/material';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

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
    href = cursoId ? `/cursos/${cursoId}` : '#'
  } = props;

  return (
    <Card sx={{ width: '100%', maxWidth: 320, borderRadius: 3, mx: 'auto' }}>
      <Link href={href} passHref style={{ textDecoration: 'none' }}>
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
          </CardContent>
        </CardActionArea>
      </Link>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <CardOptionsButton 
          cursoId={cursoId} 
          onDelete={onDelete}
          cursoNome={classroomTitle}
          cursoDescricao={cursoDescricao}
        />
      </CardActions>
    </Card>
  );
}