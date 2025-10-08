# Plataforma Inteligente para Atividades Acadêmicas

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Sprint](https://img.shields.io/badge/sprint-2-green)

Uma plataforma web que permite aos professores criar, gerar estatísticas e corrigir atividades acadêmicas de forma automatizada, com suporte de inteligência artificial para gerar alternativas, refinar enunciados e dar feedback aos alunos.

---

## Status do Projeto

- **Fase Atual:** Sprint 2 
- **Tasks:**
    - Banco de questões
    - Geração de Documento
    - Banco de Recursos Frequentes

---

## Funcionalidades

### Para Professores:
- **Criação de Atividades:** Formulários estruturados para gerar automaticamente código LaTeX e exportar para PDF.
- **Correção Automática:** Upload de fotos ou PDFs digitalizados de provas objetivas para correção.
- **Auxílio de IA:** Uso de LLMs para auxiliar na criação de enunciados, sugerir alternativas e distratores.
- **Estatísticas:** Geração de gráficos e métricas de desempenho para os alunos.

### Para Alunos:
- **Métricas de Aprendizado:** Acompanhamento individual de métricas baseadas nas atividades submetidas na plataforma.
- **Listas Personalizadas:** Criação de listas de exercícios de uma base de dados personalizadas com base no desempenho do aluno.

---

## Pilha de Tecnologia

- **Frontend:** Next.js  
- **Backend:** Next.js, LangGraph  
- **Banco de Dados:** MongoDB

---

## Estrutura do Repositório
```text
/es-unifesp-2025-2-grupo-golf
├── docs/                  # Documentação
├── src/                   # Código-fonte
│   └── app/
│       └── ...
├── public/                # Arquivos estáticos do Next.js
├── .gitignore             # Arquivos ignorados pelo Git
├── package.json           # Dependências do JavaScript
└── README.md              
```

---

## Como Configurar o Ambiente de Desenvolvimento

### **1. Clone o repositório**

```bash
git clone https://github.com/ES-UNIFESP/es-unifesp-2025-2-grupo-golf.git
cd es-unifesp-2025-2-grupo-golf
```


### **2. Instalar o Docker**
Certifique-se de ter o **Docker** e o **Docker Compose** instalados:
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows / macOS)  
- Linux: siga as instruções oficiais para sua distribuição
- Baixe o sub-sistema WSL

> Docker será usado para rodar backend e frontend em containers isolados.
### **3. Rodar o projeto via Docker**
- Acesse a pasta onde o arquivo ```docker-compose.yml``` se localiza via terminal
- Rode o comando ```docker-compose up --build```
- Espere até que todas as dependências e os conteiners sejam criados corretamente
- Acesse a aplicação através da porta [3000](localhost:3000)
- Pare de rodar a aplicação através do comando ```docker-compose stop```
- Rode novamente a aplicação através do comando  ```docker-compose start```
- Em caso de modificação de dependências, é necessário excluir os conteiners via ```docker-compose down``` e rodar o comando ```docker-compose up --build``` novamente

### **4. Acesso Deploy**
https://f1-mu-nine.vercel.app/
