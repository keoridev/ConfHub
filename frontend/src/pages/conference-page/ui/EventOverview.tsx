import {
  CalendarDays,
  Award,
  BookOpen,
  Building2,
  UserCheck,
} from "lucide-react";
import { Card } from "@heroui/react";
import { SECTIONS_CONFIG } from "~shared/lib";

export function EventOverview() {
  const timelineSteps = [
    {
      date: "До 5 ноября 2026",
      title: "Приём тезисов и материалов",
      desc: "Электронная регистрация участников, загрузка файлов Word (.docx) и предварительный анализ соответствия секции.",
      badge: "Текущий этап",
      active: true,
    },
    {
      date: "6 – 8 ноября 2026",
      title: "Экспертиза комиссии жюри",
      desc: "Научное рецензирование докладов ведущими учёными, утверждение статуса и распределение по секциям и аудиториям МУИТ.",
      badge: "Оценка жюри",
      active: false,
    },
    {
      date: "10 ноября 2026, 09:00",
      title: "Торжественное открытие",
      desc: "Открытие XVIII Международной конференции в МУИТ ко Дню науки, пленарное заседание с участием Министерства.",
      badge: "Старт форума",
      active: false,
    },
    {
      date: "11 – 17 ноября 2026",
      title: "Секционные заседания",
      desc: "Очные и онлайн-защиты научных докладов по секциям IT, Инженерии и Экологии, научные дискуссии и презентации.",
      badge: "Защита работ",
      active: false,
    },
    {
      date: "18 ноября 2026",
      title: "Финал и награждение",
      desc: "Подведение итогов конкурса научных докладов студентов и молодых учёных, вручение дипломов ко Дню науки.",
      badge: "День науки",
      active: false,
    },
  ];

  const sectionsList = SECTIONS_CONFIG;

  return (
    <div id="about-event" className="space-y-10 sm:space-y-12">
      {/* Organizers Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 sm:p-6 bg-white border border-[#1a4d3e]/15 rounded-3xl shadow-xs flex items-start gap-4">
          <div className="size-11 sm:size-12 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center shrink-0">
            <Building2 className="size-5 sm:size-6 text-[#1a4d3e]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#d4a84b]">
              Главный соорганизатор
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1a4d3e]">
              Министерство науки, высшего образования и инноваций Кыргызской Республики
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Государственная поддержка научных инициатив студенчества и создание условий для трансфера инновационных технологий в экономику.
            </p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 bg-white border border-[#1a4d3e]/15 rounded-3xl shadow-xs flex items-start gap-4">
          <div className="size-11 sm:size-12 rounded-2xl bg-[#d4a84b]/15 text-[#1a4d3e] flex items-center justify-center shrink-0">
            <Award className="size-5 sm:size-6 text-[#d4a84b]" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#d4a84b]">
              Базовая площадка конференции
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#1a4d3e]">
              Международный университет инновационных технологий (МУИТ)
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ведущий вуз Кыргызстана в области цифровизации, IT-технологий и прикладной инженерии. Место проведения очных секций и защит.
            </p>
          </div>
        </Card>
      </div>

      {/* Conference RoadMap / Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-[#1a4d3e]/10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4a84b]">
              <CalendarDays className="size-3.5" />
              <span>График проведения мероприятия</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1a4d3e] tracking-tight mt-0.5">
              Ключевые даты и этапы конференции
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            10 – 18 ноября 2026 года • МУИТ (Бишкек)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {timelineSteps.map((step, idx) => (
            <Card
              key={idx}
              className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                step.active
                  ? "bg-white border-[#1a4d3e] shadow-md ring-2 ring-[#1a4d3e]/10"
                  : "bg-white/80 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 shadow-xs"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="size-6 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e] font-mono text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      step.active
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-[#f5f3ed] text-[#1a4d3e]/70 border border-[#1a4d3e]/10"
                    }`}
                  >
                    {step.badge}
                  </span>
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#d4a84b]">
                  {step.date}
                </h4>
                <p className="text-sm font-bold text-[#1a4d3e] leading-snug">
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Sections & Themes */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2 border-b border-[#1a4d3e]/10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4a84b]">
              <BookOpen className="size-3.5" />
              <span>Конкурсные направления</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1a4d3e] tracking-tight mt-0.5">
              Секции XVIII Международной конференции
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            13 конкурсных научных направлений
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionsList.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Card
                key={idx}
                className="p-5 sm:p-6 bg-white border border-[#1a4d3e]/15 rounded-3xl shadow-xs space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div
                    className="size-11 sm:size-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: sec.bgColor || "#1a4d3e" }}
                  >
                    <Icon className="size-5 sm:size-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#1a4d3e] leading-snug">
                    {sec.title}
                  </h3>
                </div>
                <div className="pt-2 border-t border-[#1a4d3e]/10 space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {sec.subtitle}
                  </p>
                  {sec.supervisor && (
                    <div className="flex items-center gap-1.5 text-xs text-[#1a4d3e] font-semibold pt-1">
                      <UserCheck className="size-3.5 text-[#d4a84b] shrink-0" />
                      <span className="truncate">Ответственный: {sec.supervisor}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
