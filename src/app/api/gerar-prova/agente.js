import express from 'express';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { LLMChain } from "langchain/chains";
import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

// Função que contém a lógica de geração da prova
async function gerarProvaLatex() {
  const client = new MongoClient(process.env.MONGO_URI);
  let provaJson;
  try {
    await client.connect();
    const database = client.db("seu_banco_de_dados");
    const questoesCollection = database.collection("questoes");
    const pipeline = [{ $sample: { size: 5 } }];
    const questoesDaProva = await questoesCollection.aggregate(pipeline).toArray();

    if (questoesDaProva.length === 0) {
      throw new Error("Nenhuma questão foi encontrada no banco de dados.");
    }
    provaJson = {
      titulo: "Prova de Conhecimentos Gerais (Gerada com Gemini)",
      instrucoes: "Leia atentamente cada questão antes de responder.",
      questoes: questoesDaProva,
    };
  } finally {
    await client.close();
  }


  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY, // A chave que você pegou do AI Studio
    modelName: "gemini-2.5-flash",     // O modelo 
    temperature: 0.2,
    maxOutputTokens: 8192, // Define um limite máximo para o tamanho da resposta (LaTeX)
  });

  
  const latexTemplate = `
    Você é um assistente especialista em LaTeX. Sua tarefa é converter um objeto JSON contendo os detalhes de uma prova em um documento LaTeX completo e bem formatado.
    Use a classe de documento 'exam' do LaTeX, que é ideal para criar provas.
    INSTRUÇÕES DE FORMATAÇÃO:
    1.  Comece com \documentclass[12pt,a4paper]{exam}.
    2.  Inclua os pacotes: usepackage[utf8]{inputenc}, usepackage[T1]{fontenc}, usepackage{amsmath}.
    3.  Crie um título para a prova usando o título fornecido no JSON. Use \begin{center}...\end{center} para o título.
    4.  Adicione as instruções da prova após o título.
    5.  Inicie o ambiente de questões com \begin{questions}.
    6.  Para cada questão no JSON:
        - Use o comando \question.
        - Se o 'tipo' for 'multipla_escolha', use o ambiente \begin{oneparchoices} ... \end{oneparchoices} para as opções. Cada opção deve ser um item \choice.
        - Se o 'tipo' for 'discursiva', adicione um espaço para a resposta, como \fillwithdottedlines{2cm}.
    7.  Finalize com \end{questions} e \end{document}.
    8.  NÃO adicione comentários ou explicações no seu retorno. A saída deve ser APENAS o código LaTeX bruto.
    Abaixo está o JSON da prova:
    \`\`\`json
    {prova_json}
    \`\`\`
    CÓDIGO LATEX GERADO:
  `;

  const prompt = new PromptTemplate({
    template: latexTemplate,
    inputVariables: ["prova_json"],
  });

  const chain = new LLMChain({ llm: model, prompt });

  const result = await chain.call({
    prova_json: JSON.stringify(provaJson, null, 2),
  });
  
  const latexOutput = result.text;
  const nomeArquivo = `prova_gemini_${Date.now()}.tex`;
  fs.writeFileSync(nomeArquivo, latexOutput);
  
  return nomeArquivo;
}

app.post('/api/gerar-prova', async (req, res) => {
  try {
    console.log("Recebida requisição para gerar prova com Gemini...");
    const arquivoGerado = await gerarProvaLatex();
    console.log(`Prova gerada: ${arquivoGerado}`);
    
    res.json({ 
      success: true, 
      message: 'Prova gerada com sucesso via Gemini!',
      fileName: arquivoGerado 
    });
  } catch (error) {
    console.error("Erro ao gerar prova com Gemini:", error);
    res.status(500).json({ success: false, message: 'Falha ao gerar a prova.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});