import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import HomeIcon from '@mui/icons-material/Home';
import MessageIcon from '@mui/icons-material/Message';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BarChartIcon from '@mui/icons-material/BarChart';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Header from './Header';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

const drawerWidth = 240;
const collapsedWidth = 60;

export default function Overlay({ content }) {
  const [open, setOpen] = React.useState(true);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const sidebarItems = [
    { text: 'Início', icon: <HomeIcon /> },
    { text: 'Mensagens', icon: <MessageIcon /> },
    { text: 'Atividades', icon: <EventNoteIcon /> },
    { text: 'Métricas', icon: <BarChartIcon /> },
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
          <List sx={{padding: 0}}>
            {sidebarItems.map(({ text, icon }) => (
              <ListItem key={text} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
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