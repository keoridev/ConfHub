import {
  BrainCircuit,
  Compass,
  Activity,
  Leaf,
  TrendingUp,
  Zap,
  Scale,
  Calculator,
  GraduationCap,
  Briefcase,
  Languages,
  Palette,
  Rocket,
  BookOpen,
  LucideIcon,
} from "lucide-react";

export interface SectionMeta {
  id?: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  supervisor?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const SECTIONS_CONFIG: SectionMeta[] = [
  {
    id: 1,
    title: "Искусственный интеллект и машинное обучение в устойчивом развитии",
    shortTitle: "ИИ и машинное обучение",
    subtitle: "Нейросети, ML-модели, мониторинг и умные алгоритмы",
    supervisor: "Жамалова Венера Жумашбековна",
    icon: BrainCircuit,
    color: "#0589c7",
    bgColor: "#1a4d3e",
  },
  {
    id: 2,
    title: "Традиции и инновации в архитектурном и дизайнерском решениях",
    shortTitle: "Архитектура и дизайн",
    subtitle: "Архитектура, пространственный дизайн, урбанистика",
    supervisor: "Кожобаева Салтанат Толонбаевна",
    icon: Compass,
    color: "#8B5CF6",
    bgColor: "#1a4d3e",
  },
  {
    id: 3,
    title: "Динамика и исследование сейсмостойкости сооружений",
    shortTitle: "Сейсмостойкость сооружений",
    subtitle: "Сейсмостойкость, прочность конструкций, геотехника",
    supervisor: "Асаналиева Жылдыз Жолдошбековна",
    icon: Activity,
    color: "#E11D48",
    bgColor: "#1a4d3e",
  },
  {
    id: 4,
    title: "Энергоэффективные композиционные материалы для зеленого строительства",
    shortTitle: "Экоматериалы и зеленое строительство",
    subtitle: "Зеленые экоматериалы, энергосбережение, изоляция",
    supervisor: "Матыева Акбермет Карыбековна",
    icon: Leaf,
    color: "#10B981",
    bgColor: "#1a4d3e",
  },
  {
    id: 5,
    title: "Управление инновациями в секторах экономики (промышленность, строительство, транспорт, электроэнергетика, агропромышленный комплекс)",
    shortTitle: "Управление инновациями в экономике",
    subtitle: "Менеджмент инноваций, цифровой трансфер, агро & промсектор",
    supervisor: "Биримкулова Кыял Дуйшенбековна",
    icon: TrendingUp,
    color: "#F59E0B",
    bgColor: "#1a4d3e",
  },
  {
    id: 6,
    title: "Энергосберегающие и экологически чистые производства и транспорт",
    shortTitle: "Чистые производства и транспорт",
    subtitle: "Чистая энергетика, электрокары, снижение выбросов",
    supervisor: "Садыков Максат Амангелдиевич",
    icon: Zap,
    color: "#06B6D4",
    bgColor: "#1a4d3e",
  },
  {
    id: 7,
    title: "История развития, современное состояние и перспективы совершенствования системы учета и экономического развития",
    shortTitle: "Система учета и экономическое развитие",
    subtitle: "Бухучет, финансовый аудит, финтех и учетные системы",
    supervisor: "Биймырсаева Эркегул Мундусбековна",
    icon: Calculator,
    color: "#0284C7",
    bgColor: "#1a4d3e",
  },
  {
    id: 8,
    title: "Цифровизация, качество и устойчивость в системе образования",
    shortTitle: "Цифровизация и качество образования",
    subtitle: "EdTech, инновационные образовательные методики",
    supervisor: "Бостонова Парида Зиябековна",
    icon: GraduationCap,
    color: "#2563EB",
    bgColor: "#1a4d3e",
  },
  {
    id: 9,
    title: "Современные механизмы стратегического управления предприятиями в условиях цифровой трансформации",
    shortTitle: "Стратегическое управление предприятиями",
    subtitle: "Цифровая трансформация бизнеса, оптимизация процессов и менеджмент",
    supervisor: "Бусурманкулова Уран Нурдиновна",
    icon: Briefcase,
    color: "#EC4899",
    bgColor: "#1a4d3e",
  },
  {
    id: 10,
    title: "Правовые и социально-экономические аспекты устойчивого развития",
    shortTitle: "Правовые и социально-экономические аспекты",
    subtitle: "Юриспруденция, правовое регулирование, соцэкономика",
    supervisor: "Биримкулова Кыял Дуйшенбековна",
    icon: Scale,
    color: "#6366F1",
    bgColor: "#1a4d3e",
  },
  {
    id: 11,
    title: "Язык и мышление: психологические и лингвистические аспекты",
    shortTitle: "Язык, мышление и психолингвистика",
    subtitle: "Когнитивная лингвистика, психология, коммуникации",
    supervisor: "Рыспаева Чолпон Курманбековна",
    icon: Languages,
    color: "#9333EA",
    bgColor: "#1a4d3e",
  },
  {
    id: 12,
    title: "Управление проектами креативной индустрии",
    shortTitle: "Проекты креативной индустрии",
    subtitle: "Медиа, арт-бизнес, дизайн-менеджмент и креативное предпринимательство",
    supervisor: "Жумаматова Гульмира Каимовна",
    icon: Palette,
    color: "#F43F5E",
    bgColor: "#1a4d3e",
  },
  {
    id: 13,
    title: "Вызовы и возможности для специалистов будущего: инновации, практики и перспективы",
    shortTitle: "Специалисты будущего и компетенции",
    subtitle: "Профессии будущего, карьерные треки, компетенции",
    supervisor: "Оморов Нурзатбек Абдишарипович",
    icon: Rocket,
    color: "#84CC16",
    bgColor: "#1a4d3e",
  },
];

/**
 * Returns metadata (icon, matching subtitle, theme colors, responsible supervisor) for any section.
 */
export function getSectionMeta(title: string, index?: number): SectionMeta {
  const norm = (title || "").toLowerCase();

  if (
    norm.includes("интеллект") ||
    norm.includes("машин") ||
    norm.includes("it") ||
    norm.includes("ии")
  ) {
    return SECTIONS_CONFIG[0];
  }
  if (norm.includes("архитектур") || norm.includes("дизайн")) {
    return SECTIONS_CONFIG[1];
  }
  if (norm.includes("сейсмо") || norm.includes("сооружен")) {
    return SECTIONS_CONFIG[2];
  }
  if (norm.includes("композицион") || norm.includes("зеленого строительств")) {
    return SECTIONS_CONFIG[3];
  }
  if (
    norm.includes("секторах экономики") ||
    norm.includes("управление инноваци") ||
    norm.includes("агропромышлен")
  ) {
    return SECTIONS_CONFIG[4];
  }
  if (
    norm.includes("производства и транспорт") ||
    norm.includes("чистые производств") ||
    norm.includes("энергосберегающ")
  ) {
    return SECTIONS_CONFIG[5];
  }
  if (
    norm.includes("системы учета") ||
    norm.includes("бухгалтер") ||
    norm.includes("учета и экономическ")
  ) {
    return SECTIONS_CONFIG[6];
  }
  if (norm.includes("образовани") || norm.includes("edtech")) {
    return SECTIONS_CONFIG[7];
  }
  if (
    norm.includes("стратегического управления") ||
    norm.includes("цифровой трансформации") ||
    norm.includes("предприятиями")
  ) {
    return SECTIONS_CONFIG[8];
  }
  if (norm.includes("правов") || norm.includes("юриспруд")) {
    return SECTIONS_CONFIG[9];
  }
  if (norm.includes("язык и мышлен") || norm.includes("лингвистич")) {
    return SECTIONS_CONFIG[10];
  }
  if (
    norm.includes("креативн") ||
    norm.includes("креативной индустри") ||
    norm.includes("управление проектами креатив")
  ) {
    return SECTIONS_CONFIG[11];
  }
  if (
    norm.includes("специалистов будущего") ||
    norm.includes("вызовы и возможност")
  ) {
    return SECTIONS_CONFIG[12];
  }

  if (typeof index === "number" && index >= 0 && index < SECTIONS_CONFIG.length) {
    return SECTIONS_CONFIG[index];
  }

  return {
    title,
    shortTitle: title,
    subtitle: "Тематическая секция конференции",
    icon: BookOpen,
    color: "#1a4d3e",
    bgColor: "#1a4d3e",
  };
}
