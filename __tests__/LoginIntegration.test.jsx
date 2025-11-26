import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../src/app/login/page';
import AuthProvider from '../src/app/components/AuthProvider';
import { signIn } from "next-auth/react";
import * as navigation from "next/navigation";

// Mock do next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  SessionProvider: ({ children }) => <div data-testid="session-provider">{children}</div>,
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

// Mock do next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

describe('Login Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock for search params
    navigation.useSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
  });

  test('Fluxo Completo: Renderização dentro do AuthProvider e Login', async () => {
    // 1. Renderizar a página envolvida pelo AuthProvider (simulando _app.js ou layout.js)
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Verificação de Integridade: O Provider está renderizando?
    expect(screen.getByTestId('session-provider')).toBeInTheDocument();

    // 2. Verificar estado inicial da UI
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeEnabled();

    // 3. Simular interação do usuário (Clique no botão)
    fireEvent.click(loginButton);

    // 4. Verificar feedback visual imediato (Loading state)
    expect(screen.getByText('Conectando...')).toBeInTheDocument();
    expect(loginButton).toBeDisabled();

    // 5. Verificar chamada ao serviço de autenticação (Integração com NextAuth)
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/dashboard" });
    });
  });

  test('Fluxo de Erro: Tratamento de erro vindo de redirecionamento externo', () => {
    // Simular retorno do Google com erro na URL
    navigation.useSearchParams.mockReturnValue({
      get: jest.fn((key) => {
        if (key === 'error') return 'OAuthCreateAccount';
        return null;
      }),
    });

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    // Verificar se a mensagem de erro específica é exibida
    expect(screen.getByText('Erro ao criar conta')).toBeInTheDocument();
    
    // O botão deve continuar disponível para nova tentativa
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeEnabled();
  });
});
