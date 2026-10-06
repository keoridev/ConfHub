import type { AIValidationResult, Section, Talk } from "~entities/talk/model/types";

export const mockSections: Section[] = [
  { id: "it", title: "IT и ИИ", color: "#0589c7" },
  { id: "eng", title: "Инженерия", color: "#72c200" },
  { id: "eco", title: "Экология", color: "#0D9488" },
];

// Объединяем все тестовые доклады в один массив
export const mockTalks: Talk[] = [
  {
    id: "t1",
    title: "Применение LLM для анализа научных текстов",
    speakerName: "Данилов А.С.",
    sectionId: "it",
    hallNumber: "302",
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:30:00+06:00",
    abstract: "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей.",
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
    abstract: "Применение LSTM-сетей для предиктивной аналитики в промышленности.",
    tags: ["AI", "Промышленность"],
    status: "pending_review",
  },
  {
    id: "t2",
    title: "Оптимизация микросервисной архитектуры с помощью eBPF",
    speakerName: "Сидоров В.Е.",
    sectionId: "it",
    hallNumber: "304",
    startTime: "2026-10-05T11:00:00+06:00",
    endTime: "2026-10-05T11:30:00+06:00",
    abstract: "Практический опыт внедрения eBPF для низкоуровневого мониторинга трафика.",
    tags: ["DevOps", "eBPF", "Kubernetes"],
    status: "approved",
  },
  {
    id: "r1",
    title: "Использование квантовых вычислений для взлома RSA",
    speakerName: "Алексеев К.В.",
    sectionId: "it",
    hallNumber: "",
    startTime: "",
    endTime: "",
    abstract: "Теоретический обзор алгоритма Шора.",
    tags: ["Кванты", "Безопасность"],
    status: "rejected",
  },
];

export const initialAIResults = new Map<string, AIValidationResult>();