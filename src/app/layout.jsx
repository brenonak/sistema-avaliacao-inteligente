"use client";

import "./globals.css";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto } from 'next/font/google';
import { ThemeProvider } from '@mui/material/styles';
import { Analytics } from "@vercel/analytics/next"; // Adicionando a importação do Analytics
import AuthProvider from './components/AuthProvider';
import theme from "../theme";

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" className={roboto.variable} suppressHydrationWarning>
      <body className="antialiased">
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <AuthProvider> 
              {children}
              <Analytics />
            </AuthProvider> 
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}

