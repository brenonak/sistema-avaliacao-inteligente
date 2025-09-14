# Plataforma Inteligente para Atividades Acadêmicas

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![Sprint](https://img.shields.io/badge/sprint-1-green)

Uma plataforma web que permite aos professores criar, gerar estatísticas e corrigir atividades acadêmicas de forma automatizada, com suporte de inteligência artificial para gerar alternativas, refinar enunciados e dar feedback aos alunos.

---

## Status do Projeto

- **Fase Atual:** Sprint 1 
- **Tasks:**
    - Criação de atividades via template
    - Funcionalidade de diferentes formatos de questões no template

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
- **Backend:** FastAPI, LangGraph  
- **Banco de Dados:** A definir  

---

## Estrutura do Repositório
```text
/es-unifesp-2025-2-grupo-golf
├── docs/                  # Documentação
├── src/                   # Código-fonte do frontend (Next.js)
│   └── app/
│       └── ...
├── public/                # Arquivos estáticos do Next.js
├── backend/               # Código-fonte e dependências do backend (Python)
│   ├── src/
│   │   ├── api/           # Rotas da API
│   │   └── tests/         # Testes para o backend
│   └── ...
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

> Docker será usado para rodar backend, frontend e banco de dados em containers isolados.
### **3. Rodar o projeto via Docker**
>COMENTÁRIO: Adicionar instruções para rodar projeto no Docker
