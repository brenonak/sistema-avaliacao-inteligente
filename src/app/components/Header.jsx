import Link from 'next/link'
import { Box, AppBar, Toolbar, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

const Header = () => {
  const theme = useTheme();

  return (
    <AppBar 
      position='sticky' 
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(0, 0, 0, 0.8)'   
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)', // Suporte para Safari
        color: 'text.primary',
        borderBottom: '1px solid divider',
      }}
    >
      <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
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
        <Box>
          <Button
            component={Link}
            href="/questoes"
            sx={{
              backgroundColor: 'palette.mode' === 'dark'
                ? 'secondary.main'   
                : 'background.paper',
              color: 'text.primary',
              px: 2,
              py: 1,
              borderRadius: 1,
              mr: 3,
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
              backgroundColor: 'palette.mode' === 'dark'
                ? 'secondary.main'   
                : 'background.paper',
              color: 'text.primary',
              px: 2,
              py: 1,
              mr: 32,
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
        <Box></Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header