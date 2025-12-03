import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../src/app/login/page';
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation for useSearchParams
    useSearchParams.mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });
  });

  test('deve renderizar o botão de login com Google', () => {
    render(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    expect(loginButton).toBeInTheDocument();
    expect(screen.getByText('Sistema Acadêmico')).toBeInTheDocument();
  });

  test('deve chamar a função signIn ao clicar no botão', async () => {
    render(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/dashboard" });
    });
  });

  test('deve usar callbackUrl dos parâmetros de busca se fornecido', async () => {
    useSearchParams.mockReturnValue({
      get: jest.fn((param) => {
        if (param === 'callbackUrl') return '/cursos';
        return null;
      }),
    });

    render(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/cursos" });
    });
  });

  test('deve exibir mensagem de erro quando houver erro nos parâmetros', () => {
    useSearchParams.mockReturnValue({
      get: jest.fn((param) => {
        if (param === 'error') return 'OAuthSignin';
        return null;
      }),
    });

    render(<LoginPage />);
    
    expect(screen.getByText('Erro ao iniciar login com Google')).toBeInTheDocument();
  });

  test('deve exibir estado de carregamento ao clicar no botão', async () => {
    // Mock signIn to never resolve immediately to simulate loading state
    signIn.mockImplementation(() => new Promise(() => {}));

    render(<LoginPage />);
    
    const loginButton = screen.getByRole('button', { name: /entrar com google/i });
    fireEvent.click(loginButton);
    
    expect(screen.getByText('Conectando...')).toBeInTheDocument();
    expect(loginButton).toBeDisabled();
  });
});
