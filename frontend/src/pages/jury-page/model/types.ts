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

export const TIME_SLOTS = [
  "10:00 - 10:30",
  "10:30 - 11:00",
  "11:00 - 11:30",
  "11:30 - 12:00",
  "14:00 - 14:30",
  "14:30 - 15:00",
  "15:00 - 15:30",
  "15:30 - 16:00",
];
