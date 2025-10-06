import { z } from "zod";

export const TipoQuestao = z.enum(["dissertativa", "alternativa", "vf"]);

export const AlternativaSchema = z.object({
  letra: z.string().min(1),
  texto: z.string().min(1),
  correta: z.boolean().default(false),
});

export const QuestaoCreateSchema = z
  .object({
    tipo: TipoQuestao,
    enunciado: z.string().min(1, "enunciado obrigatório"),
    alternativas: z.array(AlternativaSchema).default([]),
    gabarito: z.string().optional(),
    //palavrasChave: z.string().optional(), ARRUMAR DEPOIS
  })
  .superRefine((data, ctx) => {
    // Validação específica por tipo
    if (data.tipo === "alternativa") {
      if (!data.alternativas?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de múltipla escolha precisam ter alternativas",
          path: ["alternativas"],
        });
      }
      if (data.gabarito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de múltipla escolha não devem ter gabarito (use alternativas)",
          path: ["gabarito"],
        });
      }
    }

    if (data.tipo === "dissertativa") {
      if (!data.gabarito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões dissertativas precisam ter gabarito",
          path: ["gabarito"],
        });
      }
      if (data.alternativas?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões dissertativas não devem ter alternativas",
          path: ["alternativas"],
        });
      }
    }

    if (data.tipo === "vf") {
      if (!data.alternativas?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões V/F precisam ter alternativas",
          path: ["alternativas"],
        });
      }
      if (data.gabarito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões V/F não devem ter gabarito (use alternativas)",
          path: ["gabarito"],
        });
      }
    }
  });

export const QuestaoUpdateSchema = QuestaoCreateSchema.partial();

export type QuestaoCreate = z.infer<typeof QuestaoCreateSchema>;
export type QuestaoUpdate = z.infer<typeof QuestaoUpdateSchema>;
