// jest.setup.js
import '@testing-library/jest-dom';

// Mock da API fetch globalmente para todos os testes
global.fetch = jest.fn();

// Mock de window.confirm para testes de exclusão
global.confirm = jest.fn();

// CORREÇÃO: Adicione esta linha para mockar a função alert
global.alert = jest.fn();

// Mock para a API de criação de URL de objeto, usada no download de arquivos
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Polyfills para APIs Web necessárias pelo @vercel/blob e outras dependências
const { TextDecoder, TextEncoder } = require('util');
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;