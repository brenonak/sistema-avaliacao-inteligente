"use client";

import { Geist, Geist_Mono } from "next/font/google";
// Removido Geist para padronizar em Roboto
import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { createTheme, responsiveFontSizes, ThemeProvider, alpha } from '@mui/material/styles';
import { Analytics } from "@vercel/analytics/next"; // Adicionando a importação do Analytics


let customTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class'
  },
  palette: {
    // Cores principais
    primary: {
      main: '#000000', // preto
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ffffff', // branco
      contrastText: '#000000',
    },

    // Cores de fundo
    background: {
      default: '#ffffff',   // background geral
      paper: '#f7f7f7',     // background de cards, modais e superfícies secundárias
    },

    // Cores de texto
    text: {
      primary: '#000000',
      secondary: '#4f4f4f', // cinza escuro
      disabled: '#9e9e9e', // cinza claro
    },

    // Cores de ação e divisores
    divider: '#e0e0e0',
    action: {
      active: '#000000',
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
          contrastText: '#000000',
        },
        secondary: {
          main: '#000000',
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

customTheme = responsiveFontSizes(customTheme);

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" className={roboto.variable}>
      {/* Removido as classes do Geist do body */}
      <body className="antialiased">
        <AppRouterCacheProvider>
          <ThemeProvider theme={customTheme}>
            {children}
            <Analytics /> {/* Adicionando o componente Analytics antes de fechar o body */}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
