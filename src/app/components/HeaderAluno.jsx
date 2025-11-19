
"use client";

import Link from 'next/link'
import { Box, AppBar, Toolbar, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { useState } from 'react';
import HeaderThemeSelector from './HeaderThemeSelector';
import Divider from '@mui/material/Divider'; 
import { useSession, signOut } from 'next-auth/react';

const Header = () => {
  const { data: session } = useSession();
  const settings = ['Perfil', 'Mudar de conta', 'Configurações', 'Sair'];

  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();
    await signOut({ callbackUrl: '/' });
  };

  const theme = useTheme();

  return (
    <AppBar 
      position='fixed' 
      elevation={0}
      sx={{
        backgroundColor: theme.palette.header.main,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Suporte para Safari
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            component={Link}
            href="/dashboard"
            disableRipple
            sx={{
              color: 'text.primary',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              '&:hover': { backgroundColor: 'inherit' },
              transition: 'background-color 0ms ease, color 0ms ease',
            }}
          >
            <Box
              component="img"
              src="/aluno.svg"
              alt="Professor Icon"
              sx={{
                height: 64,
                width: 64,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              Sistema Acadêmico
            </Typography>
          </Button>
        </Box>
        <Box sx={{ flexGrow: 0, mr: 2, display: 'flex', alignItems: 'center' }}>
          <HeaderThemeSelector />
          <Tooltip title="Configurações">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar 
                alt={session?.user?.name || "Usuário"} 
                src={session?.user?.image || undefined} 
              />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
            disableScrollLock={true}
          >
            {settings.map((setting) => {
              if (setting === 'Perfil') {
                return (
                  <MenuItem 
                    key={setting} 
                    onClick={handleCloseUserMenu}
                    component={Link} // Usa o Link do Next.js
                    href="/perfil/cadastro" // Define o destino
                    sx={{ width: '100%' }}
                  >
                    <Typography sx={{ textAlign: 'center', width: '100%' }}>{setting}</Typography>
                  </MenuItem>
                );
              }
                
              // Verifica se o item atual é "Sair"
              if (setting === 'Sair') {
                return (
                  // Se for "Sair", executa o logout
                  <MenuItem 
                    key={setting} 
                    onClick={handleLogout}
                    sx={{ width: '100%' }}
                  >
                    <Typography sx={{ textAlign: 'center', width: '100%' }}>{setting}</Typography>
                  </MenuItem>
                );
              } else {
                // Para os outros itens, mantém o comportamento ainda não implementado
                return (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography sx={{ textAlign: 'center', width: '100%' }}>{setting}</Typography>
                  </MenuItem>
                );
              }
            })}
          </Menu>
        </Box>
      </Toolbar>
      <Divider />
    </AppBar>
  )
}

export default Header