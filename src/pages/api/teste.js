import clientPromise from "../../lib/mongodb";

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db();
  const colecao = db.collection("exemplo");
  const dados = await colecao.find({}).toArray();
  res.json(dados);
}