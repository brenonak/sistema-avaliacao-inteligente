58
 
```
59
 
​
60
 
---
61
 
​
62
 
## Como Configurar o Ambiente de Desenvolvimento
63
 
​
64
 
### **1. Clone o repositório**
65
 
​
66
 
```bash
67
 
git clone https://github.com/ES-UNIFESP/es-unifesp-2025-2-grupo-golf.git
68
 
cd es-unifesp-2025-2-grupo-golf
69
 
```
70
 
​
71
 
​
72
 
### **2. Instalar o Docker**
73
 
Certifique-se de ter o **Docker** e o **Docker Compose** instalados:
74
 
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows / macOS)   
75
 
- Linux: siga as instruções oficiais para sua distribuição
76
 
​
77
 
> Docker será usado para rodar backend, frontend e banco de dados em containers isolados.
78
 
### **3. Rodar o projeto via Docker**
79
 
> COMENTÁRIO: Adicionar instruções para rodar projeto no Docker
80
 
​
81
 
---
82
 
​
83
 
## Funcionalidades
84
 
​
85
 
### Para Professores:
86
 
- **Criação de Atividades:** Formulários estruturados para gerar automaticamente código LaTeX e exportar para PDF.
87
 
- **Correção Automática:** Upload de fotos ou PDFs digitalizados de provas objetivas para correção.
88
 
- **Auxílio de IA:** Uso de LLMs para auxiliar na criação de enunciados, sugerir alternativas e distratores.
89
 
- **Estatísticas:** Geração de gráficos e métricas de desempenho para os alunos.
90
 
​
91
 
### Para Alunos:
92
 
- **Métricas de Aprendizado:** Acompanhamento individual de métricas baseadas nas atividades submetidas na plataforma.
93
 
- **Listas Personalizadas:** Criação de listas de exercícios de uma base de dados personalizadas com base no desempenho do aluno.
94
 
​
95
 
---
96
 
​
97
 
## Pilha de Tecnologia
98
 
​
99
 
- **Frontend:** Next.js   
100
 
- **Backend:** FastAPI, LangGraph   
101
 
- **Banco de Dados:** A definir   
102
 
​
103
 
---
104
 
​
105
 
## Estrutura do Repositório
106
 
```text
107
 
/es-unifesp-2025-2-grupo-golf
108
 
├── docs/                  # Documentação
109
 
├── src/                   # Código-fonte do frontend (Next.js)
110
 
│   └── app/
111
 
│       └── ...
112
 
├── public/                # Arquivos estáticos do Next.js
113
 
├── backend/               # Código-fonte e dependências do backend (Python)
114
 
│   ├── src/
115
 
│   │   ├── api/           # Rotas da API
116
 
│   │   └── tests/         # Testes para o backend
117
 
│   └── ...
118
 
├── .gitignore             # Arquivos ignorados pelo Git
119
 
├── package.json           # Dependências do JavaScript
120
 
└── README.md              
121
 
```
122
 
​
123
 
---
124
 
​
125
 
## Como Configurar o Ambiente de Desenvolvimento
126
 
​
127
 
### **1. Clone o repositório**
128
 
​
129
 
```bash
130
 
git clone https://github.com/ES-UNIFESP/es-unifesp-2025-2-grupo-golf.git
131
 
cd es-unifesp-2025-2-grupo-golf
132
 
```
133
 
​
134
 
​
135
 
### **2. Instalar o Docker**
136
 
Certifique-se de ter o **Docker** e o **Docker Compose** instalados:
137
 
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows / macOS)   
138
 
- Linux: siga as instruções oficiais para sua distribuição
139
 
​
140
 
> Docker será usado para rodar backend, frontend e banco de dados em containers isolados.
141
 
### **3. Rodar o projeto via Docker**
142
 
> COMENTÁRIO: Adicionar instruções para rodar projeto no Docker
143
 
​