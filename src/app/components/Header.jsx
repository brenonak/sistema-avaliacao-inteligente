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

const Header = () => {
  const settings = ['Perfil', 'Mudar de conta', 'Configurações', 'Sair'];

  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
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
            href="/"
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
              src="/professor.svg"
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
          <Button
            component={Link}
            href="/cursos"
            sx={{
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              transition: 'background-color 0ms ease, color 0ms ease',
            }}
          >
            Cursos
          </Button>
          <Button
            component={Link}
            href="/galeria"
            sx={{
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              transition: 'background-color 0ms ease, color 0ms ease',
            }}
          >
            Galeria
          </Button>
          <Button
            component={Link}
            href="/questoes"
            sx={{
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              transition: 'background-color 0ms ease, color 0ms ease',
            }}
          >
            Questões
          </Button>
          <Button
            component={Link}
            href="/questoes/criar"
            sx={{
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              transition: 'background-color 0ms ease, color 0ms ease',
            }}
          >
            Criar
          </Button>
        </Box>
        <Box sx={{ flexGrow: 0, mr: 2, display: 'flex', alignItems: 'center' }}>
          <HeaderThemeSelector />
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="Remy Sharp" src="/static/images/avatar/2.jpg" />
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
            {settings.map((setting) => (
              <MenuItem key={setting} onClick={handleCloseUserMenu}>
                <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
      <Divider />
    </AppBar>
  )
}

export default Header