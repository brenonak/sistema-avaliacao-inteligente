# Documentação de Testes Unitários - Login

## Visão Geral
Este documento descreve os testes unitários implementados para a página de Login (`src/app/login/page.jsx`). O objetivo é garantir que o fluxo de autenticação e a interface do usuário funcionem conforme o esperado.

## Cenários de Teste

### 1. Renderização da Interface
**Cenário:** O usuário acessa a página de login.
**Motivação:** Garantir que os elementos essenciais (título, botão de login) estejam visíveis e acessíveis para o usuário.
**Resultado Esperado:** 
- O título "Sistema Acadêmico" deve estar visível.
- O botão "Entrar com Google" deve estar presente na tela.

### 2. Interação de Login (Sucesso)
**Cenário:** O usuário clica no botão "Entrar com Google".
**Motivação:** Verificar se a função de autenticação (`signIn` do NextAuth) é acionada corretamente com os parâmetros padrão.
**Resultado Esperado:** 
- A função `signIn` deve ser chamada com o provedor "google".
- O parâmetro `callbackUrl` deve ser definido como "/dashboard" por padrão.

### 3. Redirecionamento Personalizado
**Cenário:** O usuário acessa a página de login com um parâmetro `callbackUrl` na URL (ex: `?callbackUrl=/cursos`).
**Motivação:** Garantir que o usuário seja redirecionado para a página correta após o login, preservando o fluxo de navegação original.
**Resultado Esperado:** 
- A função `signIn` deve ser chamada com o `callbackUrl` especificado na URL ("/cursos").

### 4. Tratamento de Erros
**Cenário:** O usuário é redirecionado de volta para a página de login com um parâmetro de erro (ex: `?error=OAuthSignin`).
**Motivação:** Informar o usuário sobre falhas no processo de autenticação para que ele possa tentar novamente ou buscar ajuda.
**Resultado Esperado:** 
- A mensagem de erro correspondente ("Erro ao iniciar login com Google") deve ser exibida na tela.

### 5. Feedback Visual (Loading)
**Cenário:** O usuário clica no botão de login e aguarda a resposta.
**Motivação:** Fornecer feedback visual imediato para evitar cliques múltiplos e indicar que o sistema está processando a solicitação.
**Resultado Esperado:** 
- O texto do botão deve mudar para "Conectando...".
- O botão deve ficar desabilitado durante o processo.

## Execução dos Testes
Para executar estes testes, utilize o comando:
\`\`\`bash
npm test __tests__/LoginPage.test.jsx
\`\`\`
