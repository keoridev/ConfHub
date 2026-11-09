export interface AIResultData {
  sectionFit?: { score: number; verdict: string; comment: string };
  annotationMatch?: { score: number; verdict: string; comment: string };
  issues?: Array<{ type: string; severity: string; description: string }>;
  suggestions?: string[];
  overallVerdict?: string;
}

export interface AIResultResponse {
  id: number;
  talkId: number;
  attemptNo: number;
  result: AIResultData;
  model: string;
}

export const COMMENT_PRESETS = [
  "Дополнить аннотацию описанием методов исследования и конкретными результатами.",
  "Уточнить соответствие темы профилю и задачам выбранной секции.",
  "Проверить форматирование и библиографический список в файле работы.",
  "Тема доклада не соответствует научным направлениям данной конференции.",
];
