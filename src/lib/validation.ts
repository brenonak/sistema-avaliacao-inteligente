import { z } from "zod";

export const TipoQuestao = z.enum(["dissertativa", "alternativa", "vf"]);

export const AlternativaSchema = z.object({
  letra: z.string().min(1),
  texto: z.string().min(1),
  correta: z.boolean().default(false),
});

export const QuestaoCreateSchema = z.object({
  tipo: TipoQuestao,
  enunciado: z.string().min(1, "enunciado obrigatório"),
  alternativas: z.array(AlternativaSchema).default([]),
  gabarito: z.string().optional(), // para dissertativa
});

export const QuestaoUpdateSchema = QuestaoCreateSchema.partial();

export type QuestaoCreate = z.infer<typeof QuestaoCreateSchema>;
export type QuestaoUpdate = z.infer<typeof QuestaoUpdateSchema>;
