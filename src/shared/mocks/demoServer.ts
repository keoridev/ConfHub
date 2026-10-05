import type { AIValidationResult, Conference, Section, Talk } from "~entities/talk/model/types";
import { mockTalks, mockSections, initialAIResults } from "./mockData";

// Локальное состояние мока (для имитации изменений на сервере)
let talks = [...mockTalks];
const aiResults = new Map(initialAIResults);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// === Conference ===
export async function getConference(id: string): Promise<Conference | undefined> {
  await delay(100);
  // Возвращаем моковые данные конференции. 
  // В реальном приложении здесь был бы запрос к API по id.
  return {
    id,
    title: "Международная научно-практическая конференция 2026",
    dateLabel: "5–7 октября 2026",
    location: "Москва, Конгресс-центр",
  };
}

// === Sections ===
export async function listSections(): Promise<Section[]> {
  await delay(100);
  return mockSections;
}

// === Talks ===
export async function listTalks(): Promise<Talk[]> {
  await delay(250);
  return [...talks]; // Возвращаем копию, чтобы предотвратить случайные мутации извне
}

export async function getTalk(id: string): Promise<Talk | undefined> {
  await delay(150);
  return talks.find((t) => t.id === id);
}

export async function createTalk(
  input: Omit<Talk, "id" | "status" | "hallNumber" | "startTime" | "endTime">
): Promise<Talk> {
  await delay(400);
  const newTalk: Talk = {
    ...input,
    id: crypto.randomUUID(),
    status: "pending_review",
    hallNumber: "",
    startTime: "",
    endTime: "",
  };
  talks = [...talks, newTalk];
  return newTalk;
}

export async function reviewTalk(
  id: string,
  status: "approved" | "rejected",
  updates?: Partial<Talk>
): Promise<void> {
  await delay(300);
  talks = talks.map((t) => (t.id === id ? { ...t, status, ...updates } : t));
}

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
  const section = mockSections.find((s) => s.id === input.sectionId);
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