# Registro de Decisões

Este documento reúne os Registros de Decisões do projeto.

O documento possui a finalidade de registrar as principais decisões técnicas tomadas pela equipe, incluindo contexto, decisão, justificativa, consequências (positivas e negativas) e referências para consulta.  

Cada registro deve seguir esta estrutura:

1. **Contexto**: Situação ou problema que levou à decisão.  
2. **Decisão**: O que foi escolhido.  
3. **Justificativa**: Por que essa escolha foi feita.  
4. **Consequências**: Impactos positivos e negativos da decisão.  
5. **Referências**: Links ou materiais de apoio para consulta.  
 
O objetivo é manter um histórico claro e transparente das escolhas arquiteturais do projeto, para que qualquer membro da equipe entenda **o que foi decidido, quando e por quê**.

---

## 001: Definição da Stack

### Contexto
O projeto está na fase inicial, e a equipe precisa definir uma stack de tecnologia que suporte o desenvolvimento da plataforma web para atividades acadêmicas.

### Decisão
Foi definido que a stack inicial será composta por:  
- **Frontend:** Next.js  
- **Backend:** FastAPI  
- **Banco de Dados:** MongoDB  

### Justificativa
- O uso do Next.js permite interfaces interativas, responsivas e deploy fácil
- O FastAPI oferece alto desempenho e fácil integração com bibliotecas de IA.  
- O MongoDB foi escolhido por sua flexibilidade com dados semiestruturados, útil em requisitos ainda em evolução. 

### Consequências
- **Positivas:**  
  - Flexibilidade para iterar rapidamente no banco.  
  - Frameworks modernos e de alta performance.  
  - Boa base para integrar IA no backend.  

- **Negativas:**  
  - A equipe precisará aprender a lidar com banco não relacional.  
  - Curva de aprendizado do FastAPI e Next.js.  
  - A combinação de Next.js e FastAPI exige separação clara entre frontend e backend, o que pode aumentar a complexidade de gestão em comparação com um framework unificado.

### Referências:
* FARM Stack Course: https://youtu.be/PWG7NlUDVaA?si=PahLJArLw3xv2rHU
* FastAPI Documentação: https://fastapi.tiangolo.com/
* Next.js Documentação: https://nextjs.org/docs
* MongoDB Documentação: https://www.mongodb.com/pt-br/docs/

---
## 002: Docker

### Contexto
O projeto precisa de uma forma padronizada de configurar e executar os ambientes de desenvolvimento e produção.  
Sem uma ferramenta de containerização, cada desenvolvedor teria que instalar e configurar manualmente dependências como Python, FastAPI, Next.js e MongoDB, o que poderia gerar inconsistências.  

### Decisão
Foi decidido que o projeto utilizará Docker como ferramenta de containerização para padronizar os ambientes de desenvolvimento e preparar a futura implantação em produção.  

### Justificativa
- O Docker garante que todos os membros da equipe utilizem o mesmo ambiente, independentemente do sistema operacional.  
- Facilita a configuração inicial do projeto, reduzindo problemas de incompatibilidade de versões.  
- Permite rodar backend, frontend e banco de dados de forma integrada usando `docker-compose`.  

### Consequências
- **Positivas:**  
  - Ambientes consistentes entre desenvolvedores e produção.  
  - Redução de erros relacionados a dependências locais.  

- **Negativas:**  
  - Curva de aprendizado inicial para a equipe que não tem experiência com Docker.  
  - Necessidade de manutenção dos arquivos `Dockerfile` e `docker-compose.yml`.  

### Referências
- Docker Manuals: https://docs.docker.com/manuals/  
- Docker Tutorial - freeCodeCamp: https://www.youtube.com/watch?v=fqMOX6JJhGo
---