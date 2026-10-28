import React from "react";
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
  ShoppingCart,
  Rocket,
  Languages,
  BookOpen,
  LucideIcon,
} from "lucide-react";

export interface SectionMeta {
  id?: number;
  title: string;
  shortTitle: string;
  subtitle: string;
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
    icon: BrainCircuit,
    color: "#0589c7",
    bgColor: "#1a4d3e",
  },
  {
    id: 2,
    title: "Традиции и инновации в архитектурном и дизайнерском решениях",
    shortTitle: "Архитектура и дизайн",
    subtitle: "Архитектура, пространственный дизайн, урбанистика",
    icon: Compass,
    color: "#8B5CF6",
    bgColor: "#1a4d3e",
  },
  {
    id: 3,
    title: "Динамика и исследование сейсмостойкости сооружений",
    shortTitle: "Сейсмостойкость сооружений",
    subtitle: "Сейсмостойкость, прочность конструкций, геотехника",
    icon: Activity,
    color: "#E11D48",
    bgColor: "#1a4d3e",
  },
  {
    id: 4,
    title: "Энергоэффективные композиционные материалы для зеленого строительства",
    shortTitle: "Экоматериалы и зеленое строительство",
    subtitle: "Зеленые экоматериалы, энергосбережение, изоляция",
    icon: Leaf,
    color: "#10B981",
    bgColor: "#1a4d3e",
  },
  {
    id: 5,
    title: "Управление инновациями в секторах экономики (промышленность, строительство, транспорт, электроэнергетика, агропромышленный комплекс)",
    shortTitle: "Управление инновациями в экономике",
    subtitle: "Менеджмент инноваций, цифровой трансфер, агро & промсектор",
    icon: TrendingUp,
    color: "#F59E0B",
    bgColor: "#1a4d3e",
  },
  {
    id: 6,
    title: "Энергосберегающие и экологически чистые производства и транспорт",
    shortTitle: "Чистые производства и транспорт",
    subtitle: "Чистая энергетика, электрокары, снижение выбросов",
    icon: Zap,
    color: "#06B6D4",
    bgColor: "#1a4d3e",
  },
  {
    id: 7,
    title: "Правовые и социально-экономические аспекты устойчивого развития",
    shortTitle: "Правовые и социально-экономические аспекты",
    subtitle: "Юриспруденция, правовое регулирование, соцэкономика",
    icon: Scale,
    color: "#6366F1",
    bgColor: "#1a4d3e",
  },
  {
    id: 8,
    title: "История развития, современное состояние и перспективы совершенствования системы учета и экономического развития",
    shortTitle: "Система учета и экономическое развитие",
    subtitle: "Бухучет, финансовый аудит, финтех и учетные системы",
    icon: Calculator,
    color: "#0284C7",
    bgColor: "#1a4d3e",
  },
  {
    id: 9,
    title: "Цифровизация, качество и устойчивость в системе образования",
    shortTitle: "Цифровизация и качество образования",
    subtitle: "EdTech, инновационные образовательные методики",
    icon: GraduationCap,
    color: "#2563EB",
    bgColor: "#1a4d3e",
  },
  {
    id: 10,
    title: "Современные стратегие маркетинговых исследований и электронной коммерции",
    shortTitle: "Маркетинг и электронная коммерция",
    subtitle: "E-commerce, цифровой маркетинг, маркетплейсы",
    icon: ShoppingCart,
    color: "#EC4899",
    bgColor: "#1a4d3e",
  },
  {
    id: 11,
    title: "Вызовы и возможности для специалистов будущего: инновации, практики и перспективы",
    shortTitle: "Специалисты будущего и компетенции",
    subtitle: "Профессии будущего, карьерные треки, компетенции",
    icon: Rocket,
    color: "#84CC16",
    bgColor: "#1a4d3e",
  },
  {
    id: 12,
    title: "Язык и мышление: психологические и лингвистические аспекты",
    shortTitle: "Язык, мышление и психолингвистика",
    subtitle: "Когнитивная лингвистика, психология, коммуникации",
    icon: Languages,
    color: "#9333EA",
    bgColor: "#1a4d3e",
  },
];

/**
 * Returns metadata (icon, matching subtitle, theme colors) for any section.
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
  if (norm.includes("правов") || norm.includes("юриспруд")) {
    return SECTIONS_CONFIG[6];
  }
  if (
    norm.includes("системы учета") ||
    norm.includes("бухгалтер") ||
    norm.includes("учета и экономическ")
  ) {
    return SECTIONS_CONFIG[7];
  }
  if (norm.includes("образовани") || norm.includes("edtech")) {
    return SECTIONS_CONFIG[8];
  }
  if (norm.includes("маркетинг") || norm.includes("коммерц")) {
    return SECTIONS_CONFIG[9];
  }
  if (
    norm.includes("специалистов будущего") ||
    norm.includes("вызовы и возможност")
  ) {
    return SECTIONS_CONFIG[10];
  }
  if (norm.includes("язык и мышлен") || norm.includes("лингвистич")) {
    return SECTIONS_CONFIG[11];
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
