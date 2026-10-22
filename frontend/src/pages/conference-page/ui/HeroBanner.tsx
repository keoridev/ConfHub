import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Clock,
  Send,
  Sparkles,
  BookOpen,
  Award,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Card } from "@heroui/react";
import { pathKeys } from "~shared/lib";
import { CountdownTimer } from "./CountdownTimer";

interface HeroBannerProps {
  timeString: string;
  talksCount: number;
  hallsCount: number;
}

export function HeroBanner({
  timeString,
  talksCount,
  hallsCount,
}: HeroBannerProps) {
  return (
    <Card className="bg-gradient-to-br from-[#123528] via-[#1a4d3e] to-[#0f2e23] text-white border border-[#1a4d3e]/30 rounded-3xl overflow-hidden shadow-2xl relative p-4 sm:p-7 md:p-9 space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4a84b]/15 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Institutional Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 border-b border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white shadow-xs">
            <Building2 className="size-3.5 text-[#d4a84b] shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">Министерство науки, ВО и инноваций КР</span>
          </div>
          <span className="text-white/40 hidden sm:inline">•</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#e6c16c] shadow-xs">
            <Award className="size-3.5 text-[#d4a84b] shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">Международный университет инновационных технологий (МУИТ)</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4a84b]/20 border border-[#d4a84b]/40 text-[#f5f3ed] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
          <Sparkles className="size-3 text-[#d4a84b] shrink-0" />
          <span>Посвящается Дню науки</span>
        </div>
      </div>

      {/* Main Title and Description */}
      <div className="relative z-10 space-y-3 max-w-4xl">
        <div className="inline-flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-widest text-[#e6c16c] font-black">
          <span>XVIII Международная научно-практическая конференция-конкурс</span>
        </div>

        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-none text-white break-words">
          «ИННОВАЦИОННЫЕ ТЕХНОЛОГИИ И ПЕРЕДОВЫЕ РЕШЕНИЯ»
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-white/85 max-w-3xl leading-relaxed font-normal pt-1">
          Конкурс научных докладов студентов и молодых учёных. Цифровой каталог докладов, актуальное расписание заседаний секций и подача тезисов выступлений.
        </p>
      </div>

      {/* Dedicated Countdown Ribbon - Never overflows on any screen width */}
      <div className="relative z-10 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="size-9 rounded-xl bg-[#d4a84b]/20 text-[#e6c16c] flex items-center justify-center shrink-0">
            <Clock className="size-4" />
          </div>
          <div>
            <span className="text-[10px] text-white/60 uppercase font-bold tracking-wider block">
              Обратный отсчёт до старта
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-white">
              Открытие: 10 ноября 2026 г. в 09:00 (Бишкек)
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <CountdownTimer targetDate="2026-11-10T09:00:00+06:00" />
        </div>
      </div>

      {/* Key Meta Information: 3 balanced cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-semibold">
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#d4a84b] text-[#1a4d3e] flex items-center justify-center shrink-0">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">
              Даты проведения
            </span>
            <span className="text-white font-extrabold text-xs sm:text-sm">
              10–18 ноября 2026
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center gap-3">
          <div className="size-9 rounded-xl bg-white/15 text-[#e6c16c] flex items-center justify-center shrink-0">
            <MapPin className="size-5" />
          </div>
          <div>
            <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">
              Площадка
            </span>
            <span className="text-white font-extrabold text-xs sm:text-sm">
              МУИТ, Бишкек • Очно и онлайн
            </span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 flex items-center gap-3 sm:col-span-2 md:col-span-1">
          <div className="size-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <span className="text-white/60 block text-[10px] uppercase font-bold tracking-wider">
              Приём тезисов
            </span>
            <span className="text-emerald-300 font-extrabold text-xs sm:text-sm">
              Открыт до 5 ноября 2026
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons & Current Time Bar */}
      <div className="relative z-10 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={pathKeys.submission}
            className="px-5 sm:px-6 py-3 rounded-2xl bg-[#d4a84b] hover:bg-[#c4983b] text-[#1a4d3e] font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <Send className="size-4 text-[#1a4d3e] group-hover:translate-x-0.5 transition-transform" />
            <span>Подать заявку на доклад</span>
          </Link>

          <Link
            to={pathKeys.program}
            className="px-4 sm:px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Смотреть программу и доклады</span>
            <ChevronDown className="size-4 text-[#e6c16c]" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-white/70 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Бишкек:</span>
            <span className="font-mono font-bold text-white">{timeString}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
            <Clock className="size-3.5 text-[#d4a84b]" />
            <span>Докладов: <strong className="text-white">{talksCount}</strong> • Секций: <strong className="text-white">{hallsCount}</strong></span>
          </div>
        </div>
      </div>
    </Card>
  );
}
