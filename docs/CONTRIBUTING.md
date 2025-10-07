# Guia de Contribuição

Este documento estabelece os padrões formais de contribuição ao projeto.

## Branches
Cada nova funcionalidade ou correção de bug deve ser desenvolvida em uma branch separada. Deve-se seguir o formato: `<tipo>/descricao-da-tarefa`

### Tipos de branches:
* **`feature`**: Para novas funcionalidades.
* **`fix`**: Para correções de bugs.
* **`docs`**: Para atualizações na documentação.
    
### Criando uma branch
1.  **Sincronize sua branch local:** Antes de começar, atualize sua branch `main` com o repositório remoto.

    ```bash
    git checkout main
    git pull origin main
    ```

2.  **Crie sua branch de tarefa:** Dê um nome claro e conciso à sua branch, usando o formato `<tipo>/descricao-da-tarefa`.

    ```bash
    git checkout -b feature/cadastro-usuario
    ```

## Commits
Os commits devem ser objetivos, seguindo o formato: `<tipo>:descrição`

### Tipos de commit:
* **`feat`**: Uma nova funcionalidade.
* **`refactor`**: Uma mudança de código que melhora a estrutura ou a legibilidade, sem alterar o comportamento do código.
* **`fix`**: Uma correção de bug.
* **`test`**: Adição de testes ou correções em testes existentes.
* **`style`**: Mudanças que não afetam a lógica (ex: formatação, ponto e vírgula).
* **`docs`**: Mudanças na documentação.

### Fazendo um commit
1.  **Faça suas alterações**: Trabalhe no código e nos arquivos necessários para sua tarefa.

2.  **Adicione e faça o commit das suas mudanças**: Adicione os arquivos alterados ao *staging area* e crie um commit com uma mensagem clara, seguindo o padrão de commits.

    ```bash
    git add .
    git commit -m "feat: funcionalidade de cadastro de usuário"
    ```

3.  **Envie sua branch para o repositório remoto**: Envie suas mudanças para a branch que você criou no repositório remoto.

    ```bash
    git push origin nome_branch
    ```

## Pull Requests (PRs)

Ao finalizar sua tarefa e enviar seus commits, abra um Pull Request para que o código seja revisado e, se aprovado, mesclado na branch `main`.

1.  **Abra o Pull Request**
    Vá até a página do repositório no GitHub e abra um novo PR da sua branch para a `main`.

2.  **Descreva seu trabalho**
    Dê um título claro ao seu PR e adicione uma descrição detalhada. Explique o que foi feito, por que foi feito e quais arquivos foram alterados.

3.  **Aguarde a revisão**
    Um colega de equipe irá revisar seu código, fazer comentários e solicitar ajustes se necessário. Após a aprovação, o código será mesclado na branch `main`.