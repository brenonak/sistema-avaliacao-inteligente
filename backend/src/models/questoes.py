from beanie import Document
from pydantic import BaseModel
from typing import List, Optional

class Alternativa(BaseModel):
    texto: str
    correta: bool = False

class Questao(Document):
    enunciado: str
    dificuldade: Optional[str] = "medio"
    categoria: Optional[str] = None
    alternativas: List[Alternativa]

    class Settings:
        name = "questoes"  # nome da coleção no Mongo
