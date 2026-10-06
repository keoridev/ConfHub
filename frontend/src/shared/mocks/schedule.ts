import type { Section, Talk } from "~entities/talk/model/types";

export const mockSections: Section[] = [
  { id: "it", title: "IT и ИИ", color: "#0589c7" },
  { id: "eng", title: "Инженерия", color: "#72c200" },
  { id: "eco", title: "Экология", color: "#0D9488" },
];

export const mockTalks: Talk[] = [
  {
    id: "t1",
    title: "Применение LLM для анализа научных текстов",
    speakerName: "Атаё А.С.",
    sectionId: "it",
    hallNumber: "302",
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:30:00+06:00",
    abstract:
      "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей.",
    tags: ["AI", "NLP", "LLM"],
    status: "approved",
  },
  {
    id: "t2",
    title: "Композитные материалы в авиастроении",
    speakerName: "Петров Д.К.",
    sectionId: "eng",
    hallNumber: "204",
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:20:00+06:00",
    abstract: "Сравнительный анализ прочностных характеристик углепластиков.",
    tags: ["Материаловедение"],
    status: "approved",
  },
  {
    id: "t3",
    title: "Мониторинг качества воздуха с помощью IoT-сетей",
    speakerName: "Сидорова Е.В.",
    sectionId: "eco",
    hallNumber: "302",
    startTime: "2026-10-05T11:00:00+06:00",
    endTime: "2026-10-05T11:30:00+06:00",
    abstract: "Низкобюджетные сенсорные сети для городского экомониторинга.",
    tags: ["IoT", "Экология"],
    status: "approved",
  },
];
