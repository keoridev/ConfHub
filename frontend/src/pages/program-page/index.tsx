import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Sparkles,
  AlertTriangle,
  CalendarDays,
  BookOpen,
  Clock,
} from "lucide-react";
import { Card, Input, InputGroup, ListBox, Select } from "@heroui/react";

import { CurrentTalkCard } from "~widgets/schedule/ui/CurrentTalk";
import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { ViewToggle } from "~widgets/schedule/ui/ViewToggle";

import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";
import { useTalksQuery, useSectionsQuery } from "~entities/talk/api/queries";
import { mockSections } from "~shared/mocks/schedule";

export function ProgramPage() {
  const { data: talks = [], isLoading, isError } = useTalksQuery();
  const { data: serverSections = [] } = useSectionsQuery();
  const sections = serverSections.length > 0 ? serverSections : mockSections;
  const f = useTalkFilters(talks);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

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

  const halls = useMemo(
    () =>
      [
        ...new Set(talks.map((t) => t.room?.name).filter(Boolean)),
      ].sort() as string[],
    [talks],
  );

  const currentTalk = useMemo(() => {
    const nowMs = currentTime.getTime();
    return talks.find((talk) => {
      if (!talk.startTime || !talk.endTime) return false;
      const start = new Date(talk.startTime).getTime();
      const end = new Date(talk.endTime).getTime();
      return nowMs >= start && nowMs <= end;
    });
  }, [talks, currentTime]);

  const nextTalk = useMemo(() => {
    const nowMs = currentTime.getTime();
    const upcoming = talks
      .filter((t) => t.startTime && new Date(t.startTime).getTime() > nowMs)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

    if (upcoming.length > 0) return upcoming[0];
    if (!currentTalk && talks.length > 0) {
      return talks.find((t) => t.startTime) || talks[0];
    }
    return undefined;
  }, [talks, currentTime, currentTalk]);

  const talkCountBySection = useMemo(() => {
    const map = new Map<number | string, number>();
    talks.forEach((t) => {
      const secId = t.sectionId ?? t.section?.id;
      if (secId !== undefined) {
        map.set(secId, (map.get(secId) || 0) + 1);
      }
    });
    return map;
  }, [talks]);

  if (isError) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center bg-white border-[#1a4d3e]/15 shadow-sm rounded-2xl">
          <div className="size-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="size-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#1a4d3e]">
            Не удалось загрузить программу
          </h2>
          <p className="text-muted-foreground text-sm">
            Попробуйте обновить страницу
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-br from-[#1a4d3e] to-[#123528] rounded-3xl p-5 sm:p-8 text-white shadow-lg space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4a84b]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#e6c16c] uppercase tracking-wider border border-white/15">
            <CalendarDays className="size-3.5 text-[#d4a84b]" />
            <span>МУИТ • 10–18 НОЯБРЯ 2026</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
            <Clock className="size-3.5 text-[#d4a84b]" />
            <span>
              Бишкек:{" "}
              <strong className="font-mono text-white">{timeString}</strong>
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            Программа конференции и каталог докладов
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
            XVIII Международная научно-практическая конференция-конкурс научных
            докладов «Инновационные технологии и передовые решения». Расписание
            секционных защит и поиск материалов.
          </p>
        </div>

        <div className="relative z-10 pt-2 flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2 font-medium">
            <BookOpen className="size-3.5 text-[#d4a84b]" />
            <span>
              Всего докладов в базе:{" "}
              <strong className="text-white">{talks.length}</strong>
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 flex items-center gap-2 font-medium">
            <span>
              Аудиторий/залов:{" "}
              <strong className="text-white">{halls.length || 3}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Live & Upcoming Talk Highlights */}
      {(currentTalk || nextTalk) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d4a84b]">
            <Sparkles className="size-3.5" />
            <span>Прямой эфир и ближайшие выступления</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentTalk && (
              <CurrentTalkCard
                talk={currentTalk}
                variant="current"
                hallName={currentTalk.room?.name || "Главный зал МУИТ"}
                now={currentTime}
              />
            )}
            {nextTalk && (
              <CurrentTalkCard
                talk={nextTalk}
                variant="next"
                hallName={nextTalk.room?.name || "Ауд. 305"}
                now={currentTime}
              />
            )}
          </div>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#1a4d3e]/10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a4d3e] tracking-tight">
              Список выступлений и статей
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Используйте поиск по теме, автору или выберите направление
            </p>
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <div className="bg-white rounded-3xl border border-[#1a4d3e]/15 p-3.5 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <InputGroup className="flex-1">
              <InputGroup.Prefix>
                <Search className="size-4 text-[#1a4d3e]/50" />
              </InputGroup.Prefix>
              <Input
                placeholder="Поиск по теме статьи, автору, ВУЗу или ключевым словам..."
                value={f.search}
                onChange={(e) => f.setSearch(e.target.value)}
                className="w-full bg-[#f5f3ed]/60 border border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 focus-within:border-[#1a4d3e] focus-within:ring-2 focus-within:ring-[#1a4d3e]/10 transition-all rounded-xl h-11 text-xs sm:text-sm text-[#1a4d3e] placeholder:text-muted-foreground/60 font-medium"
              />
            </InputGroup>

            <Select
              selectedKey={f.hall || "all"}
              onSelectionChange={(key) => {
                const val = String(key);
                f.setHall(val === "all" ? "" : val);
              }}
              className="w-full sm:w-56 bg-[#f5f3ed]/60 border border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 rounded-xl h-11 text-xs sm:text-sm text-[#1a4d3e] font-medium shrink-0"
              aria-label="Фильтр по залу"
            >
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="all" textValue="Все залы">
                    Все залы
                  </ListBox.Item>
                  {halls.map((h) => (
                    <ListBox.Item key={h} id={String(h)} textValue={`Зал ${h}`}>
                      Зал {h}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex gap-1.5 sm:gap-2 flex-wrap pt-2 border-t border-[#1a4d3e]/10">
            <button
              type="button"
              onClick={() => f.setSectionId(null)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                f.sectionId === null
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] border border-[#1a4d3e]/15 hover:bg-[#1a4d3e]/5"
              }`}
            >
              <span>Все направления</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  f.sectionId === null
                    ? "bg-white/20 text-white"
                    : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                }`}
              >
                {talks.length}
              </span>
            </button>

            {sections.map((s) => {
              const count = talkCountBySection.get(s.id) || 0;
              const isSelected = String(f.sectionId) === String(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => f.setSectionId(s.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-[#1a4d3e] text-white shadow-sm"
                      : "bg-white text-[#1a4d3e] border border-[#1a4d3e]/15 hover:bg-[#1a4d3e]/5"
                  }`}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: s.color || "#d4a84b" }}
                  />
                  <span>{s.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <ScheduleList
          talks={f.filtered}
          sections={sections}
          isLoading={isLoading}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}

export const programPageRoute = { element: <ProgramPage /> };
