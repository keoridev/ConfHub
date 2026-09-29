import type {
  AIValidationResult,
  Section,
  Talk,
} from "~entities/talk/model/types";

// ---------- Секции (позже уедут в GET /api/sections) ----------

export const sections: Section[] = [
  { id: "it", title: "IT и ИИ", color: "#0589c7" },
  { id: "eng", title: "Инженерия", color: "#72c200" },
  { id: "eco", title: "Экология", color: "#0D9488" },
];

// ---------- Время относительно "сейчас", чтобы на демо был Live-доклад ----------

const min = 60_000;
const now = Date.now();
const at = (offsetMin: number) => new Date(now + offsetMin * min).toISOString();

// ---------- "База данных" ----------

let talks: Talk[] = [
  {
    id: "t1",
    title: "Применение LLM для анализирования научных текстов",
    speakerName: "Иванова А.С.",
    sectionId: "it",
    hallNumber: "302",
    startTime: at(-10),
    endTime: at(20),
    abstract:
      "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей, включая проблемы галлюцинаций и оценку качества.",
    tags: ["AI", "NLP", "LLM"],
    status: "approved",
  },
  {
    id: "t2",
    title: "Композитные материалы в авиастроении",
    speakerName: "Петров Д.К.",
    sectionId: "eng",
    hallNumber: "204",
    startTime: at(30),
    endTime: at(50),
    abstract:
      "Сравнительный анализ прочностных характеристик углепластиков и алюминиевых сплавов при циклических нагрузках.",
    tags: ["Материаловедение"],
    status: "approved",
  },
  {
    id: "t3",
    title: "Мониторинг качества воздуха с помощью IoT-сетей",
    speakerName: "Сидорова Е.В.",
    sectionId: "eco",
    hallNumber: "302",
    startTime: at(60),
    endTime: at(90),
    abstract:
      "Низкобюджетные сенсорные сети для городского экомониторинга: точность, калибровка, размещение узлов.",
    tags: ["IoT", "Экология"],
    status: "approved",
  },
  // Заявка, ожидающая рецензии — чтобы очередь жюри не была пустой на старте демо
  {
    id: "p1",
    title: "Нейросетевые методы прогнозирования отказов оборудования",
    speakerName: "Козлов М.А.",
    sectionId: "eng",
    hallNumber: "",
    startTime: "",
    endTime: "",
    abstract:
      "Применение LSTM-сетей для предиктивной аналитики в промышленности на примере данных с вибродатчиков.",
    tags: ["AI", "Промышленность"],
    status: "pending_review",
  },
];

const aiResults = new Map<string, AIValidationResult>();

// ---------- "Эндпоинты" (заменятся на axios) ----------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listTalks(): Promise<Talk[]> {
  await delay(250);
  return talks;
}

export async function getTalk(id: string): Promise<Talk | undefined> {
  await delay(150);
  return talks.find((t) => t.id === id);
}

export async function createTalk(
  input: Omit<Talk, "id" | "status" | "hallNumber" | "startTime" | "endTime">,
): Promise<Talk> {
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

export async function reviewTalk(
  id: string,
  status: "approved" | "rejected",
): Promise<void> {
  await delay(300);
  talks = talks.map((t) => (t.id === id ? { ...t, status } : t));
}

export async function getAIResult(
  talkId: string,
): Promise<AIValidationResult | undefined> {
  await delay(100);
  return aiResults.get(talkId);
}

// ---------- "AI" (демо-заглушка; реальный анализ — на Go + Gemini/OpenAI) ----------

const STOP_WORDS = new Set([
  "котор",
  "какой",
  "когда",
  "этот",
  "этом",
  "эта",
  "для",
  "что",
  "при",
  "над",
  "под",
  "the",
  "and",
  "with",
  "from",
  "that",
  "this",
  "помощ",
  "метод",
  "методы",
  "анализ",
]);

function extractKeywords(text: string): string[] {
  const freq = new Map<string, number>();
  for (const raw of text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s]/gi, " ")
    .split(/\s+/)) {
    const w = raw.trim();
    if (w.length < 5 || STOP_WORDS.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export async function runAIValidation(input: {
  talkId?: string;
  title: string;
  sectionId: string;
  abstract: string;
}): Promise<AIValidationResult> {
  await delay(2000); // имитация работы модели

  const wordCount = input.abstract.trim().split(/\s+/).filter(Boolean).length;
  const keywords = extractKeywords(`${input.title} ${input.abstract}`);
  const section = sections.find((s) => s.id === input.sectionId);

  // Демо-эвристика: длина аннотации + наличие ключевых слов → скор
  const score = Math.min(
    97,
    Math.round(55 + Math.min(wordCount, 35) * 1.1 + keywords.length * 2),
  );
  const abstractOk = wordCount >= 30;

  const result: AIValidationResult = {
    matchScore: score,
    sectionMatch: {
      isMatching: keywords.length > 0,
      explanation: section
        ? `Тематика доклада близка к секции «${section.title}»: найдено релевантных терминов: ${keywords.slice(0, 3).join(", ") || "недостаточно"}.`
        : "Секция не выбрана.",
    },
    abstractMatch: {
      isMatching: abstractOk,
      explanation: abstractOk
        ? `Аннотация (${wordCount} слов) описывает цель и подход исследования.`
        : `Аннотация слишком короткая (${wordCount} слов). Рекомендуется 30–50 слов с целью, методом и результатом.`,
    },
    extractedKeywords: keywords,
    feedback: [
      score >= 80
        ? "Доклад готов к подаче."
        : "Рекомендуем уточнить формулировки перед подачей.",
      abstractOk
        ? "Аннотация соответствует требованиям."
        : "Дополните аннотацию: цель, метод, ожидаемый результат.",
    ],
  };

  if (input.talkId) aiResults.set(input.talkId, result);
  return result;
}
