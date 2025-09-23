import ClassroomCard from './components/ClassroomCard';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import ColorModeButtons from './components/ColorModeButtons';
import { DateCalendar } from '@mui/x-date-pickers';
// TODO: Implementar funcionalidade de agenda

export default function Home() {
  return (
    <Grid container sx={{ backgroundColor: 'background.default' }}>
      <ColorModeButtons />
      <Grid size={8}>
        <Box sx={{
              padding: 5,
            }}>
          <Typography gutterBottom variant="h4" component="div">
            Meus Cursos
          </Typography>
          <Grid container rowSpacing={8} columnSpacing={4} sx={{ 
                                                            backgroundColor: 'background.paper',
                                                            padding: 3,
                                                            borderRadius: 2
                                                          }}>
            <Grid size={4}>
              <ClassroomCard 
                imgSrc="/blue_bg.jpg" 
                imgTitle="Blue Background"
                classroomTitle="Engenharia de Software"
                teacherName="Fabio Fagundes Silveira"
              />
            </Grid>
            <Grid size={4}>
              <ClassroomCard 
                imgSrc="/blue_bg.jpg" 
                imgTitle="Blue Background"
                classroomTitle="Engenharia de Software"
                teacherName="Fabio Fagundes Silveira"
              />
            </Grid>
            <Grid size={4}>
              <ClassroomCard 
                imgSrc="/blue_bg.jpg" 
                imgTitle="Blue Background"
                classroomTitle="Engenharia de Software"
                teacherName="Fabio Fagundes Silveira"
              />
            </Grid>
            <Grid size={4}>
              <ClassroomCard 
                imgSrc="/blue_bg.jpg" 
                imgTitle="Blue Background"
                classroomTitle="Engenharia de Software"
                teacherName="Fabio Fagundes Silveira"
              />
            </Grid>
          </Grid>
        </Box>
      </Grid>
      <Grid size={4}>
        <Box sx={{
          padding: 5,
        }}>
          <Typography gutterBottom variant="h4" component="div">
            Agenda
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
}
