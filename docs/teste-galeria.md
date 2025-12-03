
# Relatório dos Testes da Galeria

## Teste Unitário: mapRecursoToImage

**Cenário:**
Testa a função responsável por mapear um objeto de recurso (imagem) do banco de dados para o formato utilizado na galeria do sistema.

**Motivação:**
Garantir que os dados retornados para a interface da galeria estejam no formato correto, evitando inconsistências de exibição e facilitando a manutenção do código.

**Resultado Esperado:**
Ao passar um objeto de recurso válido, a função deve retornar um objeto com os campos esperados (`id`, `url`, `pathname`, `uploadedAt`, `size`, `tipo`, `filename`, `refCount`) preenchidos corretamente.

---

## Teste de Integração: GET /api/galeria

**Cenário:**
Simula uma chamada à rota de listagem de imagens da galeria (`/api/galeria`) e verifica se a resposta contém um array de imagens com os campos mínimos necessários.

**Motivação:**
Assegurar que a API está retornando os dados no formato esperado pela interface, permitindo que a galeria seja renderizada corretamente para o usuário.

**Resultado Esperado:**
A resposta da API deve conter um array chamado `images`, onde cada item possui pelo menos os campos `id` e `url`.
