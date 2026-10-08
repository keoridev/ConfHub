import type { Section, Talk } from "~entities/talk/model/types";

export const mockSections: Section[] = [
  { id: 1, title: "IT и ИИ", color: "#0589c7", conferenceId: 1, sortOrder: 1 },
  { id: 2, title: "Инженерия", color: "#72c200", conferenceId: 1, sortOrder: 2 },
  { id: 3, title: "Экология", color: "#0D9488", conferenceId: 1, sortOrder: 3 },
];

export const mockTalks = [
  {
    id: 101,
    title: "Применение LLM для анализа научных текстов",
    speakerName: "Атаё А.С.",
    sectionId: 1,
    room: { id: 1, conferenceId: 1, name: "302" },
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:30:00+06:00",
    abstract:
      "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей.",
    tags: ["AI", "NLP", "LLM"],
    status: "approved",
  },
  {
    id: 102,
    title: "Композитные материалы в авиастроении",
    speakerName: "Петров Д.К.",
    sectionId: 2,
    room: { id: 3, conferenceId: 1, name: "204" },
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:20:00+06:00",
    abstract: "Сравнительный анализ прочностных характеристик углепластиков.",
    tags: ["Материаловедение"],
    status: "approved",
  },
  {
    id: 103,
    title: "Мониторинг качества воздуха с помощью IoT-сетей",
    speakerName: "Сидорова Е.В.",
    sectionId: 3,
    room: { id: 1, conferenceId: 1, name: "302" },
    startTime: "2026-10-05T11:00:00+06:00",
    endTime: "2026-10-05T11:30:00+06:00",
    abstract: "Низкобюджетные сенсорные сети для городского экомониторинга.",
    tags: ["IoT", "Экология"],
    status: "approved",
  },
] as unknown as Talk[];
