# Documentação de Teste de Integração - Login

## Visão Geral
Este documento descreve o teste de integração implementado para a funcionalidade de Login (`src/app/login/page.jsx`), verificando sua interação com o `AuthProvider` e o serviço de autenticação `next-auth`.

## Cenários de Teste

### 1. Fluxo Completo de Login (Caminho Feliz)
**Cenário:** O usuário acessa a aplicação, visualiza a tela de login e inicia o processo de autenticação.
**Motivação:** Garantir que a página de login funcione corretamente quando integrada à estrutura de provedores da aplicação (`AuthProvider`) e que a interação do usuário dispare corretamente o serviço de autenticação externo.
**Resultado Esperado:** 
- A página deve ser renderizada corretamente dentro do `AuthProvider`.
- Ao clicar no botão, a interface deve fornecer feedback visual (estado de "Conectando...").
- A função `signIn` do NextAuth deve ser invocada com os parâmetros corretos (provedor "google" e URL de callback padrão).

### 2. Fluxo de Tratamento de Erros Externos
**Cenário:** O usuário retorna à página de login após uma falha no provedor de identidade (ex: Google), trazendo um código de erro na URL.
**Motivação:** Verificar se a aplicação interpreta corretamente os sinais de erro externos passados via URL (integração com o fluxo de redirecionamento do OAuth) e apresenta a mensagem apropriada ao usuário.
**Resultado Esperado:** 
- A aplicação deve detectar o parâmetro `error` na URL.
- A mensagem de erro amigável correspondente ao código (ex: "Erro ao criar conta") deve ser exibida.
- O botão de login deve permanecer acessível para permitir uma nova tentativa.

## Execução dos Testes
Para executar este teste de integração, utilize o comando:
\`\`\`bash
npm test __tests__/LoginIntegration.test.jsx
\`\`\`
