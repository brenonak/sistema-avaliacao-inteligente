import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SchoolIcon from '@mui/icons-material/School';
import CollectionsIcon from '@mui/icons-material/Collections';
import DescriptionIcon from '@mui/icons-material/Description';
import HomeIcon from '@mui/icons-material/Home';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import GradingIcon from '@mui/icons-material/Grading';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Header from './Header';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

const drawerWidth = 220;
const collapsedWidth = 60;

export default function Overlay({ content }) {
  const [open, setOpen] = React.useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const sidebarItems = [
    { text: 'Início', icon: <HomeIcon />, link: '/dashboard' },
    { text: 'Cursos', icon: <SchoolIcon />, link: '/cursos' },
    { text: 'Correção', icon: <GradingIcon />, link: '/correcao' },
    { text: 'Galeria', icon: <CollectionsIcon />, link: '/galeria' },
    { text: 'Questões', icon: <DescriptionIcon />, link: '/questoes' },
    { text: 'Criar Questão', icon: <NoteAddIcon />, link: '/questoes/criar' },
  ];


  return (
    <Box sx={{ display: 'flex' }}>
      <Header />
      <Drawer
        variant="permanent"
        sx={{
          width: open ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            backgroundColor: 'sidebar.main',
            overflowX: 'hidden',
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.standard,
              }),
          },
        }}
      >
        <Toolbar />

        <Box sx={{ 
          display: 'flex', 
          justifyContent: open ? 'space-between' : 'center',
          alignItems: 'center', 
          mt: 2, 
          mr: open ? 1 : '1px',
          height: 48, 
        }}>
          {open && (
            <Box sx={{ mr: 1, pl: '16px' }}>
              <Typography variant="body1" noWrap>
                Usuário
              </Typography>
            </Box>
          )}
          <IconButton onClick={toggleDrawer}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>

        <Divider />

        <Box sx={{ overflowX: 'hidden', overflowY: 'auto' }}>
          <List sx={{ padding: 0 }}>
            {sidebarItems.map(({ text, icon, link }) => (
              <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={Link}
                  href={link}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  {open && <ListItemText primary={text} />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, marginTop: 1}}>
        <Toolbar />
        {content}
      </Box>
    </Box>
  );
}