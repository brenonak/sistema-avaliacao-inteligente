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
├── src/                   # Código-fonte
│   └── app/
│       └── ...
├── public/                # Arquivos estáticos do Next.js
├── .gitignore             # Arquivos ignorados pelo Git
├── package.json           # Dependências do JavaScript
└── README.md              
```

---

## Acesso Deploy
https://f1-mu-nine.vercel.app/
