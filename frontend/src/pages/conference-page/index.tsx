import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, CalendarDays, ArrowRight } from "lucide-react";
import { Card } from "@heroui/react";

import { useTalksQuery } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";

import { HeroBanner } from "./ui/HeroBanner";
import { EventOverview } from "./ui/EventOverview";

export function ConferencePage() {
  const { data: talks = [] } = useTalksQuery();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-10 sm:space-y-14">
      {/* 1. Main Hero Banner with Conference Institutional Info & Countdown */}
      <HeroBanner
        timeString={timeString}
        talksCount={talks.length}
        hallsCount={3}
      />

      {/* 2. Institutional Overview: Organizers, RoadMap / Stages & Sections */}
      <EventOverview />

      {/* 3. Call To Action Footer Banner */}
      <Card className="p-6 sm:p-10 bg-gradient-to-r from-[#1a4d3e] to-[#123528] text-white rounded-3xl border border-[#1a4d3e]/20 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#e6c16c] uppercase tracking-wider">
            <span>МУИТ • Ко Дню науки</span>
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Примите участие в международном конкурсе научных работ
          </h3>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Подайте тезисы и материалы доклада до 5 ноября 2026 года для прохождения экспертной оценки жюри и включения в сборник трудов конференции.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 z-10">
          <Link
            to={pathKeys.submission}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#d4a84b] hover:bg-[#c4983b] text-[#1a4d3e] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="size-4 text-[#1a4d3e]" />
            <span>Подать заявку</span>
          </Link>
          <Link
            to={pathKeys.program}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CalendarDays className="size-4 text-[#e6c16c]" />
            <span>Смотреть программу</span>
            <ArrowRight className="size-4 text-white/70" />
          </Link>
        </div>
      </Card>
    </div>
  );
}

export const conferencePageRoute = { element: <ConferencePage /> };