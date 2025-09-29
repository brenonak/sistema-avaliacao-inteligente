import Link from 'next/link'
import { Box, AppBar, Toolbar, Button } from '@mui/material'

const Header = () => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'primary.main',
        borderBottom: '1px solid',
        borderBottomColor: 'divider'
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
            }
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
            }
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
            }
          }}
        >
          Criar
        </Button>
      </Toolbar>
    </AppBar>
  )
}

export default Header