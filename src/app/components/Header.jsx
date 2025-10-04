import Link from 'next/link'
import { Box, AppBar, Toolbar, Button } from '@mui/material'

const Header = () => {
  return (
    <AppBar 
      position='sticky' 
      elevation={0}
      sx={{
        backgroundColor: 'palette.mode' === 'dark'
          ? 'rgba(0, 0, 0, 0.8)'   
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Suporte para Safari
        color: 'text.primary',
        borderBottom: '1px solid divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
        <Button
          component={Link}
          href="/"
          sx={{
            backgroundColor: 'background.paper',
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
          Home
        </Button>
        <Button
          component={Link}
          href="/questoes"
          sx={{
            backgroundColor: 'background.paper',
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
            backgroundColor: 'background.paper',
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
      </Toolbar>
    </AppBar>
  )
}

export default Header