# API de Recursos para Questões

Esta documentação descreve os endpoints CRUD para gerenciamento de recursos (imagens) associados a questões.

## Endpoints

### 1. Adicionar nova imagem a uma questão

**Endpoint:** `POST /api/questoes/:id/recurso`

**Descrição:** Faz upload de uma nova imagem para o blob storage e a associa a uma questão existente.

**Parâmetros:**
- `id` (path): ID da questão

**Body:** FormData contendo:
- `file`: Arquivo de imagem

**Exemplo de uso:**
```javascript
// Cliente
const formData = new FormData();
formData.append('file', arquivo);

const response = await fetch(`/api/questoes/64a1b2c3d4e5f6a7b8c9d0e1/recurso`, {
  method: 'POST',
  body: formData
});

const data = await response.json();
// data contém informações sobre o recurso criado e associado
```

**Resposta:**
```json
{
  "success": true,
  "recurso": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e2",
    "url": "https://example.com/imagem.jpg"
  },
  "questao": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "recursos": ["64a1b2c3d4e5f6a7b8c9d0e2"]
  }
}
```

### 2. Adicionar recurso existente a uma questão

**Endpoint:** `POST /api/questoes/:id/recurso/:idRecurso`

**Descrição:** Associa um recurso já existente a uma questão, incrementando seu contador de uso.

**Parâmetros:**
- `id` (path): ID da questão
- `idRecurso` (path): ID do recurso existente

**Exemplo de uso:**
```javascript
// Cliente
const response = await fetch(`/api/questoes/64a1b2c3d4e5f6a7b8c9d0e1/recurso/64a1b2c3d4e5f6a7b8c9d0e2`, {
  method: 'POST'
});

const data = await response.json();
// data contém informações sobre a associação criada
```

**Resposta:**
```json
{
  "success": true,
  "questao": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "recursos": ["64a1b2c3d4e5f6a7b8c9d0e2", "64a1b2c3d4e5f6a7b8c9d0e3"]
  }
}
```

### 3. Remover imagem de uma questão

**Endpoint:** `DELETE /api/questoes/:id/recurso/:idRecurso`

**Descrição:** Remove a associação entre um recurso e uma questão, decrementando o contador de uso do recurso.

**Parâmetros:**
- `id` (path): ID da questão
- `idRecurso` (path): ID do recurso a ser removido

**Exemplo de uso:**
```javascript
// Cliente
const response = await fetch(`/api/questoes/64a1b2c3d4e5f6a7b8c9d0e1/recurso/64a1b2c3d4e5f6a7b8c9d0e2`, {
  method: 'DELETE'
});

const data = await response.json();
// data contém informações sobre a remoção
```

**Resposta:**
```json
{
  "success": true,
  "questao": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "recursos": ["64a1b2c3d4e5f6a7b8c9d0e3"]
  }
}
```

### 4. Remover imagem do banco e blob storage

**Endpoint:** `DELETE /api/recursos/:id`

**Descrição:** Remove completamente um recurso do banco de dados, todas as suas associações com questões e o arquivo correspondente do blob storage.

**Parâmetros:**
- `id` (path): ID do recurso a ser removido

**Exemplo de uso:**
```javascript
// Cliente
const response = await fetch(`/api/recursos/64a1b2c3d4e5f6a7b8c9d0e2`, {
  method: 'DELETE'
});

const data = await response.json();
// data contém informações sobre a remoção
```

**Resposta:**
```json
{
  "success": true,
  "message": "Recurso removido com sucesso"
}
```

### 5. Listar imagens por frequência

**Endpoint:** `GET /api/recursos`

**Descrição:** Retorna todos os recursos ordenados por frequência de uso (contador).

**Parâmetros de query (opcionais):**
- `limit` (number): Número máximo de recursos a retornar (padrão: 50, máximo: 100)
- `page` (number): Página atual para paginação (padrão: 1)
- `skip` (number): Alternativa ao page, número de recursos a pular

**Exemplo de uso:**
```javascript
// Cliente
const response = await fetch(`/api/recursos?limit=10&page=1`);
const data = await response.json();
// data contém a lista de recursos ordenados por frequência
```

**Resposta:**
```json
{
  "items": [
    {
      "id": "64a1b2c3d4e5f6a7b8c9d0e2",
      "url": "https://example.com/imagem1.jpg",
      "usage": {
        "refCount": 5
      }
    },
    {
      "id": "64a1b2c3d4e5f6a7b8c9d0e3",
      "url": "https://example.com/imagem2.jpg",
      "usage": {
        "refCount": 3
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 2,
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalItems": 2,
    "hasMore": false
  }
}
```

## Observações Importantes

1. **Atomicidade e Consistência:**
   - Todas as operações garantem consistência entre as coleções `questao` e `recurso`.
   - O contador `refCount` é sempre atualizado corretamente.

2. **Segurança:**
   - A remoção de recursos (`DELETE /api/recursos/:id`) verifica se o recurso não está sendo usado antes de remover o arquivo do blob storage.

3. **Paginação:**
   - O endpoint de listagem (`GET /api/recursos`) está preparado para paginação.
   - Parâmetros `limit`, `page` e `skip` permitem controle sobre os resultados retornados.

4. **Tipos de Arquivos:**
   - Apenas imagens são permitidas (JPEG, PNG, WebP, GIF, SVG).
   - Tamanho máximo: 10MB.