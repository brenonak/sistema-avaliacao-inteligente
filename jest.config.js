// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // O caminho para o diretório do Next.js
  dir: './',
});

// Qualquer configuração personalizada do Jest vai aqui
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Lida com módulos CSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Mapeia alias de importação 
    '^@/(.*)$': '<rootDir>/src/$1',
  }
};

module.exports = createJestConfig(customJestConfig);