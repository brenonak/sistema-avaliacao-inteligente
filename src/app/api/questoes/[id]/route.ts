
import { ObjectId } from "mongodb";
import { getDb } from "../../../../lib/mongodb";
import { json, notFound, badRequest, serverError } from "../../../../lib/http";
import { QuestaoUpdateSchema } from "../../../../lib/validation";
import { decrementResourceUsage, incrementResourceUsage } from "../../../../lib/resources";

function oid(id: string) {
  try { return new ObjectId(id); } catch { return null; }
}

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const _id = oid(params.id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    const item = await db.collection("questoes").findOne({ _id });
    if (!item) return notFound("questão não encontrada");
    const { _id: mongoId, ...rest } = item;
    return json({ id: mongoId?.toString?.() ?? mongoId, ...rest });
  } catch (e) { return serverError(e); }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _id = oid(id); if (!_id) return badRequest("id inválido");
    const body = await request.json();
    const parsed = QuestaoUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest("payload inválido");

    const db = await getDb();
    
    // Se recursos estão sendo atualizados, ajustar refCount
    if (body.recursos !== undefined) {
      const questaoAtual = await db.collection("questoes").findOne({ _id });
      if (questaoAtual) {
        const recursosAntigos = Array.isArray(questaoAtual.recursos) ? questaoAtual.recursos : [];
        const recursosNovos = Array.isArray(body.recursos) ? body.recursos : [];
        
        // Recursos que foram removidos
        const removidos = recursosAntigos.filter((r: string) => !recursosNovos.includes(r));
        // Recursos que foram adicionados
        const adicionados = recursosNovos.filter((r: string) => !recursosAntigos.includes(r));
        
        if (removidos.length > 0) {
          console.log(`[PUT /api/questoes/${id}] Decrementando ${removidos.length} recursos removidos`);
          void decrementResourceUsage(removidos).catch((err) => {
            console.error("Erro ao decrementar recursos:", err);
          });
        }
        
        if (adicionados.length > 0) {
          console.log(`[PUT /api/questoes/${id}] Incrementando ${adicionados.length} recursos adicionados`);
          void incrementResourceUsage(adicionados).catch((err) => {
            console.error("Erro ao incrementar recursos:", err);
          });
        }
      }
    }
    
    const res = await db.collection("questoes").findOneAndUpdate(
      { _id },
      { $set: { ...parsed.data, updatedAt: new Date(), ...(body.cursoIds ? { cursoIds: body.cursoIds } : {}), ...(body.recursos ? { recursos: body.recursos } : {}) } },
      { returnDocument: "after" }
    );
    
    if (!res) return notFound("questão não encontrada");
    const { _id: mongoId, ...rest } = res;
    return json({ id: mongoId?.toString?.() ?? mongoId, ...rest });
  } catch (e) { return serverError(e); }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const _id = oid(id); if (!_id) return badRequest("id inválido");
    const db = await getDb();
    
    // Buscar a questão antes de deletar para pegar os recursos
    const questao = await db.collection("questoes").findOne({ _id });
    if (!questao) return notFound("questão não encontrada");
    
    // Extrair IDs dos recursos
    const recursoIds = Array.isArray(questao.recursos) ? questao.recursos : [];
    
    // Deletar a questão
    const res = await db.collection("questoes").deleteOne({ _id });
    if (!res.deletedCount) return notFound("questão não encontrada");
    
    // Decrementar o refCount dos recursos associados
    if (recursoIds.length > 0) {
      console.log(`[DELETE /api/questoes/${id}] Decrementando refCount de ${recursoIds.length} recursos`);
      void decrementResourceUsage(recursoIds).catch((err) => {
        console.error("Erro ao decrementar recursos:", err);
      });
    }
    
    return json({ ok: true });
  } catch (e) { return serverError(e); }
}