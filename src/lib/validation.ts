import { z } from "zod";

export const TipoQuestao = z.enum(["dissertativa", "alternativa", "afirmacoes", "proposicoes", "numerica"]);

// Schema para completar perfil do usuário
export const CompleteProfileSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  papel: z.enum(["professor", "aluno"], {
    message: "Papel deve ser 'professor' ou 'aluno'"
  }),
  instituicao: z.string().optional(),
  curso: z.string().optional(),
  areasInteresse: z.array(z.string()).optional().default([]),
  isProfileComplete: z.boolean().default(true),
  profileCompleted: z.boolean().default(true), // mantém compatibilidade
});

export const AlternativaSchema = z.object({
  letra: z.string().min(1),
  texto: z.string().min(1),
  correta: z.boolean().default(false),
});

export const AfirmacaoSchema = z.object({
  texto: z.string().min(1),
  correta: z.boolean().default(true),
});

export const ProposicaoSchema = z.object({
  valor: z.number().int().positive(),
  texto: z.string().min(1),
  correta: z.boolean().default(false),
});

export const QuestaoCreateSchema = z
  .object({
    tipo: TipoQuestao,
    enunciado: z.string().min(1, "enunciado obrigatório"),
    alternativas: z.array(AlternativaSchema).optional().default([]),
    gabarito: z.string().optional(),
    respostaCorreta: z.number().optional(),
    margemErro: z.number().default(0),
    afirmacoes: z.array(AfirmacaoSchema).optional().default([]),
    proposicoes: z.array(ProposicaoSchema).optional().default([]),
    cursoIds: z.array(z.string()).optional().default([]), // Referência aos cursos
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
    }

    if (data.tipo === "afirmacoes") {
      if (!data.afirmacoes?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de afirmações precisam de ao menos uma afirmação",
          path: ["afirmacoes"],
        });
      }
      if (data.gabarito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de afirmações não devem ter gabarito textual",
          path: ["gabarito"],
        });
      }
      if (data.alternativas && data.alternativas.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de afirmações não usam alternativas",
          path: ["alternativas"],
        });
      }
    }

    if (data.tipo === "proposicoes") {
      if (!data.proposicoes?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de proposições precisam de ao menos uma proposição",
          path: ["proposicoes"],
        });
      }
      if (data.gabarito) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de proposições não devem ter gabarito textual",
          path: ["gabarito"],
        });
      }
      if (data.alternativas && data.alternativas.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões de proposições não usam alternativas",
          path: ["alternativas"],
        });
      }
    }

    if (data.tipo === "numerica") {
      if (data.respostaCorreta === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Questões numéricas precisam ter uma resposta correta",
          path: ["respostaCorreta"],
        });
      }
    }
  });

export const QuestaoUpdateSchema = QuestaoCreateSchema.partial();

export type QuestaoCreate = z.infer<typeof QuestaoCreateSchema>;
export type QuestaoUpdate = z.infer<typeof QuestaoUpdateSchema>;

export const CursoSchema = z.object({
  nome: z.string().min(3, "Nome obrigatório"),
  codigo: z.string().min(1, "Código obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  descricao: z.string().optional(),
});
export const CursoCreateSchema = CursoSchema;
export const CursoUpdateSchema = CursoSchema.omit({ codigo: true, slug: true }).partial();
export type CursoCreate = z.infer<typeof CursoCreateSchema>;
export type CursoUpdate = z.infer<typeof CursoUpdateSchema>;
