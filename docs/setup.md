# Setup do Projeto

Esta documentação tem como objetivo orientar qualquer membro da equipe a configurar o ambiente de desenvolvimento do projeto localmente. Aqui você encontrará os passos necessários para instalar as dependências, configurar variáveis de ambiente e rodar a aplicação Next.js com conexão ao MongoDB.

---

## 1. Instalar Node.js

- Baixar a versão **LTS** do Node.js: [https://nodejs.org/pt/download](https://nodejs.org/pt/download).
- De preferência, para alinhamento com o guia a seguir, verifique se **npm** é o gerenciador de pacotes selecionado.
- Durante a instalação no Windows:
  - Selecionar **Add to PATH** para que `node` e `npm` fiquem disponíveis no terminal.

---

## 2. Verificar instalação

No terminal, execute:
```bash
node -v
npm -v
```

- Confirme que ambos os comandos retornam a versão instalada.

## 3. Clonar o repositório

Se você ainda não tiver clonado o repositório do projeto, faça:

```bash
git clone https://github.com/ES-UNIFESP/es-unifesp-2025-2-grupo-golf.git
cd es-unifesp-2025-2-grupo-golf
```
## 4. Instalar dependências do projeto

No terminal, estando dentro do diretório do repositório local, execute:

```bash
npm install
```
- Isso instala todas as dependências listadas no `package.json`.
- A pasta `node_modules/` será criada, onde as dependências do projeto são instaladas localmente (esta pasta está incluída no `.gitignore`).

## 5. Configurar variáveis de ambiente
1. Verifique se existe `.env.example` na raiz do projeto.
2. Crie um arquivo `.env.local` na raiz do projeto copiando o `.env.example`:
```bash
cp .env.example .env.local
```
3. No Taiga, acesse **Wiki > Credenciais MongoDB** e copie as credenciais do banco.

4. Preencha o .env.local com as informações obtidas. O arquivo deve estar no seguinte formato:
```bash
MONGODB_URI=<URI_do_MongoDB>
MONGODB_DB=<Nome_do_banco>
```

- **ATENÇÃO**: O `.env.local` contém informações sensíveis e **não deve ser enviado para o Git**. Cada membro da equipe deve ter sua própria versão deste arquivo.
     - Obs: Arquivos `.env` estão no `.gitignore`.

## 6. Rodar o projeto
No terminal, dentro do diretório do repositório local, execute:
```bash
npm run dev
```
- A aplicação estará disponível em http://localhost:3000

## 7. Testar
Abra o navegador e confirme que a aplicação está funcionando corretamente.
