from fastapi import APIRouter, HTTPException
from app.models.questao import Questao

router = APIRouter(prefix="/questoes", tags=["questoes"])

@router.post("/")
async def criar_questao(questao: Questao):
    await questao.insert()
    return questao

@router.get("/")
async def listar_questoes():
    return await Questao.find_all().to_list()

@router.get("/{id}")
async def buscar_questao(id: str):
    questao = await Questao.get(id)
    if not questao:
        raise HTTPException(404, "Questão não encontrada")
    return questao

@router.delete("/{id}")
async def deletar_questao(id: str):
    questao = await Questao.get(id)
    if not questao:
        raise HTTPException(404, "Questão não encontrada")
    await questao.delete()
    return {"msg": "Questão removida"}
