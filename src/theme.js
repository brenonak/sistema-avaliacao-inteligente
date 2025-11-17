'use client';
import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class'
  },
  palette: {
    // Cores principais
    primary: {
      main: '#1e1e1e', // preto
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff', // branco
      contrastText: '#1e1e1e',
    },

    // Cores de fundo
    background: {
      default: '#ffffff',   // background geral
      paper: '#f7f7f7',     // background de cards, modais e superfícies secundárias
    },

    // Cores de texto
    text: {
      primary: '#1e1e1e',
      secondary: '#4f4f4f', // cinza escuro
      disabled: '#9e9e9e', // cinza claro
    },

    // Cores de ação e divisores
    divider: '#e0e0e0',
    action: {
      active: '#1e1e1e',
      hover: '#f0f0f0',
      selected: '#e0e0e0',
      disabled: '#c7c7c7',
      disabledBackground: '#f5f5f5',
    },

    accent: {
      main: '#1e88e5', 
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    
    header: {
      main: alpha('#ffffff', 0.95),
    },

    sidebar: {
      main: '#ffffff',
    }
  },
  colorSchemes: {
    dark: {
      palette: {
        mode: 'dark',
        primary: {
          main: '#ffffff',
          contrastText: '#1e1e1e',
        },
        secondary: {
          main: '#1e1e1e',
          contrastText: '#ffffff',
        },
        background: {
          default: '#121212',       
          paper: '#1e1e1e',         
        },
        text: {
          primary: '#ffffff',
          secondary: '#bbbbbb',
          disabled: '#777777',
        },
        divider: '#333333',
        action: {
          active: '#ffffff',
          hover: '#2a2a2a',
          selected: '#333333',
          disabled: '#555555',
          disabledBackground: '#2b2b2b',
        },
        accent: {
          main: '#90caf9',
          contrastText: '#000000',
        },
        header: {
          main: alpha('#1e1e1e', 0.95),
        },
        sidebar: {
          main: '#1e1e1e',
        }
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
