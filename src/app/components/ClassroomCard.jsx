import * as React from 'react';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardOptionsButton from './CardOptionsButton';
import { CardActionArea } from '@mui/material';
import Typography from '@mui/material/Typography';

export default function ClassroomCard(props) {
  return (
    <Card sx={{ maxWidth: 320, borderRadius: 3 }}>
      <CardActionArea>
        <CardMedia
          sx={{ height: 100 }}
          image={props.imgSrc}
          title={props.imgTitle}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {props.classroomTitle}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {props.teacherName}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ justifyContent: 'flex-end' }}>
        <CardOptionsButton />
      </CardActions>
    </Card>
  );
}