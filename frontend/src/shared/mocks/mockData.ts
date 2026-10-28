import type { AIValidationResult, Section, Talk } from "~entities/talk/model/types";

export const mockSections: Section[] = [
  { id: 1, title: "Искусственный интеллект и машинное обучение в устойчивом развитии", color: "#0589c7", conferenceId: 1, sortOrder: 1 },
  { id: 2, title: "Традиции и инновации в архитектурном и дизайнерском решениях", color: "#8B5CF6", conferenceId: 1, sortOrder: 2 },
  { id: 3, title: "Динамика и исследование сейсмостойкости сооружений", color: "#E11D48", conferenceId: 1, sortOrder: 3 },
  { id: 4, title: "Энергоэффективные композиционные материалы для зеленого строительства", color: "#10B981", conferenceId: 1, sortOrder: 4 },
  { id: 5, title: "Управление инновациями в секторах экономики (промышленность, строительство, транспорт, электроэнергетика, агропромышленный комплекс)", color: "#F59E0B", conferenceId: 1, sortOrder: 5 },
  { id: 6, title: "Энергосберегающие и экологически чистые производства и транспорт", color: "#06B6D4", conferenceId: 1, sortOrder: 6 },
  { id: 7, title: "Правовые и социально-экономические аспекты устойчивого развития", color: "#6366F1", conferenceId: 1, sortOrder: 7 },
  { id: 8, title: "История развития, современное состояние и перспективы совершенствования системы учета и экономического развития", color: "#0284C7", conferenceId: 1, sortOrder: 8 },
  { id: 9, title: "Цифровизация, качество и устойчивость в системе образования", color: "#2563EB", conferenceId: 1, sortOrder: 9 },
  { id: 10, title: "Современные стратегии маркетинговых исследований и электронной коммерции", color: "#EC4899", conferenceId: 1, sortOrder: 10 },
  { id: 11, title: "Вызовы и возможности для специалистов будущего: инновации, практики и перспективы", color: "#84CC16", conferenceId: 1, sortOrder: 11 },
  { id: 12, title: "Язык и мышление: психологические и лингвистические аспекты", color: "#9333EA", conferenceId: 1, sortOrder: 12 },
];

export const mockTalks = [
  {
    id: 101,
    title: "Применение LLM для анализа научных текстов",
    speakerName: "Данилов А.С.",
    sectionId: 1,
    room: { id: 1, conferenceId: 1, name: "302" },
    startTime: "2026-10-05T10:00:00+06:00",
    endTime: "2026-10-05T10:30:00+06:00",
    abstract: "Обзор подходов к автоматической классификации и рецензированию статей с помощью больших языковых моделей.",
    tags: ["AI", "NLP", "LLM"],
    status: "approved",
  },
  {
    id: 102,
    title: "Нейросетевые методы прогнозирования отказов оборудования",
    speakerName: "Козлов М.А.",
    sectionId: 2,
    startTime: "",
    endTime: "",
    abstract: "Применение LSTM-сетей для предиктивной аналитики в промышленности.",
    tags: ["AI", "Промышленность"],
    status: "pending_review",
  },
  {
    id: 103,
    title: "Оптимизация микросервисной архитектуры с помощью eBPF",
    speakerName: "Сидоров В.Е.",
    sectionId: 1,
    room: { id: 2, conferenceId: 1, name: "304" },
    startTime: "2026-10-05T11:00:00+06:00",
    endTime: "2026-10-05T11:30:00+06:00",
    abstract: "Практический опыт внедрения eBPF для низкоуровневого мониторинга трафика.",
    tags: ["DevOps", "eBPF", "Kubernetes"],
    status: "approved",
  },
  {
    id: 104,
    title: "Использование квантовых вычислений для взлома RSA",
    speakerName: "Алексеев К.В.",
    sectionId: 1,
    startTime: "",
    endTime: "",
    abstract: "Теоретический обзор алгоритма Шора.",
    tags: ["Кванты", "Безопасность"],
    status: "rejected",
  },
] as unknown as Talk[];

export const initialAIResults = new Map<number, AIValidationResult>();