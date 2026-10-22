import { z } from "zod";

export interface CoAuthorItem {
  id: string;
  fullName: string;
  university: string;
  groupName: string;
}

export const DRAFT_STORAGE_KEY = "conf_hub_submission_draft_v2";

export const parseKeywords = (val: string): string[] => {
  if (!val || !val.trim()) return [];
  if (val.includes(",")) {
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return val.trim().split(/\s+/).filter(Boolean);
};

export const submissionSchema = z.object({
  title: z
    .string()
    .min(5, "Минимум 5 символов")
    .max(200, "Максимум 200 символов"),
  sectionId: z.string().min(1, "Выберите секцию"),
  speakerName: z.string().optional().or(z.literal("")),
  university: z.string().optional().or(z.literal("")),
  gradeOrGroup: z.string().optional().or(z.literal("")),
  authorEmail: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный адрес электронной почты",
    }),
  keywords: z
    .string()
    .min(1, "Укажите ключевые слова через запятую")
    .superRefine((val, ctx) => {
      const words = parseKeywords(val);
      if (words.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Укажите не менее 5 ключевых слов (сейчас: ${words.length})`,
        });
      } else if (words.length > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Максимум 10 ключевых слов (сейчас: ${words.length})`,
        });
      }
    }),
  supervisor: z.string().optional().or(z.literal("")),
  abstract: z
    .string()
    .min(250, "Минимум 250 символов (требование оргкомитета)")
    .max(500, "Максимум 500 символов (требование оргкомитета)"),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;
