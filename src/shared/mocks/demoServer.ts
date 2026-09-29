import type { AIValidationResult, Talk, Section } from "~entities/talk/model/types";

export const sections: Section[] = [
  { id: "it", title: "IT и ИИ", color: "#0589c7" },
  { id: "eng", title: "Инженерия", color: "#72c200" },
  { id: "eco", title: "Экология", color: "#0D9488" },
];

const min = 60_000;
const now = Date.now();
const at = (offsetMin: number) => new Date(now + offsetMin * min).toISOString();

let talks: Talk[] = [
  {
    id: "t1",
    title: "Применение LLM для анализа научных текстов",
    speakerName: "Данилов А.С.",
    sectionId: "it",
    hallNumber: "302",
    startTime: at(-10),
    endTime: at(20),
    abstract: "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей, включая проблемы галлюцинаций и оценку качества.",
    tags: ["AI", "NLP", "LLM"],
    status: "approved",
  },
  {
    id: "p1",
    title: "Нейросетевые методы прогнозирования отказов оборудования",
    speakerName: "Козлов М.А.",
    sectionId: "eng",
    hallNumber: "",
    startTime: "",
    endTime: "",
    abstract: "Применение LSTM-сетей для предиктивной аналитики в промышленности на примере данных с вибродатчиков.",
    tags: ["AI", "Промышленность"],
    status: "pending_review",
  },
];

const aiResults = new Map<string, AIValidationResult>();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listTalks(): Promise<Talk[]> {
  await delay(250);
  return talks;
}

// ВОЗВРАЩАЕМ: Функция для страницы конкретного доклада
export async function getTalk(id: string): Promise<Talk | undefined> {
  await delay(150);
  return talks.find((t) => t.id === id);
}

export async function createTalk(input: Omit<Talk, "id" | "status" | "hallNumber" | "startTime" | "endTime">): Promise<Talk> {
  await delay(400);
  const talk: Talk = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending_review",
    hallNumber: "",
    startTime: "",
    endTime: "",
  };
  talks = [...talks, talk];
  return talk;
}

export async function reviewTalk(id: string, status: "approved" | "rejected", updates?: Partial<Talk>): Promise<void> {
  await delay(300);
  talks = talks.map((t) => (t.id === id ? { ...t, status, ...updates } : t));
}

// ВОЗВРАЩАЕМ: Функция для получения результата AI для JuryCard
export async function getAIResult(talkId: string): Promise<AIValidationResult | undefined> {
  await delay(100);
  return aiResults.get(talkId);
}

export async function runAIValidation(input: {
  talkId?: string;
  title: string;
  sectionId: string;
  abstract: string;
  file?: File | null;
}): Promise<AIValidationResult> {
  await delay(2000);

  const wordCount = input.abstract.trim().split(/\s+/).filter(Boolean).length;
  const section = sections.find((s) => s.id === input.sectionId);
  
  const baseScore = input.file ? 85 : 70;
  const score = Math.min(98, Math.round(baseScore + Math.min(wordCount, 35) * 0.5));
  const abstractOk = wordCount >= 30;

  const result: AIValidationResult = {
    matchScore: score,
    sectionMatch: {
      isMatching: score > 75,
      explanation: `Тематика доклада соответствует секции «${section?.title}». Ключевые термины обнаружены в тексте.`,
    },
    abstractMatch: {
      isMatching: abstractOk,
      explanation: abstractOk
        ? `Аннотация (${wordCount} слов) содержит цель, методы и ожидаемые результаты.`
        : `Аннотация слишком короткая (${wordCount} слов). Расширьте описание метода и результатов.`,
    },
    extractedKeywords: ["LLM", "Научный анализ", "Автоматизация", "Рецензирование"],
    feedback: [
      input.file 
        ? "✅ Документ успешно прочитан. Структура PDF соответствует требованиям конференции." 
        : "⚠️ Файл не загружен. Жюри может снизить оценку без полного текста доклада.",
      abstractOk ? "✅ Аннотация соответствует требованиям." : "❌ Дополните аннотацию.",
    ],
  };

  if (input.talkId) aiResults.set(input.talkId, result);
  return result;
}