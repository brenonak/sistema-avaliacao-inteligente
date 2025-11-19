"use client";
import * as React from 'react';
import { useSession } from 'next-auth/react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HeaderAluno from './HeaderAluno';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

const drawerWidth = 220;
const collapsedWidth = 60;

export default function OverlayAluno({ content }) {
  const { data: session } = useSession();
  const [open, setOpen] = React.useState(true);
  const [hovered, setHovered] = React.useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const expanded = open || hovered;

  const sidebarItems = [
    { text: 'Início', icon: <HomeIcon />, link: 'dashboard' },
    { text: 'Cursos', icon: <SchoolIcon />, link: 'cursos' },
    { text: 'Desempenho', icon: <TrendingUpIcon />, link: 'desempenho' },
  ];


  return (
    <Box sx={{ display: 'flex' }}>
      <HeaderAluno />
      <Drawer
        variant="permanent"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          width: expanded ? drawerWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.standard,
            }),

          [`& .MuiDrawer-paper`]: {
            width: expanded ? drawerWidth : collapsedWidth,
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
          justifyContent: expanded ? 'space-between' : 'center',
          alignItems: 'center', 
          mt: 2, 
          mr: expanded ? 1 : '1px',
          height: 48, 
        }}>
          {expanded && (
            <Box sx={{ mr: 1, pl: '16px' }}>
              <Typography variant="body1" noWrap>
                {session?.user?.name || 'Usuário'}
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
                    justifyContent: expanded ? 'initial' : 'center',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: expanded ? 2 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  {expanded && <ListItemText primary={text} />}
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