import { Search, Sparkles, Clock, CalendarDays, MapPin } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { CurrentTalkCard } from "~widgets/schedule/ui/CurrentTalk";
import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { ViewToggle } from "~widgets/schedule/ui/ViewToggle";

import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";
import { useTalksQuery, useSectionsQuery } from "~entities/talk/api/queries";
import { mockSections } from "~shared/mocks/schedule";

import { Card, Chip, Input, InputGroup, ListBox, Select } from "@heroui/react";

export function ConferencePage() {
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
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#1a4d3e]">
            Не удалось загрузить программу
          </h2>
          <p className="text-muted-foreground text-sm">Попробуйте обновить страницу</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#1a4335] via-[#215241] to-[#163a2e] text-white border border-[#1a4d3e]/20 rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg shadow-[#1a4d3e]/10 relative p-4 sm:p-6 md:p-8 lg:p-9 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4a84b]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-3.5 sm:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-semibold tracking-wide uppercase">
                <img
                  src="/logo.jpg"
                  alt="Conf-Hub"
                  className="size-3.5 sm:size-4 rounded object-cover"
                />
                <span className="text-[#e6c16c]">Conf-Hub 2026</span>
              </div>

              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-medium text-white shadow-xs">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/70">Сейчас:</span>
                <span className="font-mono font-bold text-[#e6c16c]">{timeString}</span>
              </div>
            </div>

            <div className="pt-1 sm:pt-2">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-2 sm:mb-3 break-words">
                Conf-Hub
                <span className="block text-lg sm:text-2xl font-medium text-white/80 mt-1">
                  Ежегодная научно-практическая конференция
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-white/80 max-w-2xl leading-relaxed">
                Два дня о передовых исследованиях, инновациях и прикладных решениях.
                Доклады ведущих спикеров, экспертное жюри и открытые дискуссии.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs font-medium text-white/80">
            <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 sm:size-4 text-[#e6c16c]" />
                14–15 июня 2026
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 sm:size-4 text-[#e6c16c]" />
                Залов: {halls.length || 3}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5 sm:size-4 text-[#e6c16c]" />
                Докладов: {talks.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white/60">Статус:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 font-semibold text-[11px] sm:text-xs">
                В эфире
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col justify-between gap-4">
          {currentTalk ? (
            <CurrentTalkCard
              talk={currentTalk}
              variant="current"
              hallName="Главный зал"
              now={currentTime}
            />
          ) : null}

          {nextTalk ? (
            <CurrentTalkCard
              talk={nextTalk}
              variant={currentTalk ? "next" : "next"}
              hallName="Ауд. 404"
              now={currentTime}
            />
          ) : (
            <Card className="p-6 bg-white/80 border border-[#1a4d3e]/15 rounded-2xl flex flex-col items-center justify-center text-center h-full">
              <Sparkles className="size-8 text-[#d4a84b] mb-2" />
              <h4 className="font-bold text-[#1a4d3e]">Все доклады завершены</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Ознакомьтесь с материалами прошедших выступлений в списке программы
              </p>
            </Card>
          )}
        </div>
      </div>

      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/70 mb-1">
              <span>Программа мероприятий</span>
              <span>•</span>
              <span>14–15 ИЮНЯ</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a4d3e] tracking-tight">
              Расписание докладов
            </h2>
          </div>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#1a4d3e]/15 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <InputGroup className="flex-1">
              <InputGroup.Prefix>
                <Search className="size-4 text-[#1a4d3e]/50" />
              </InputGroup.Prefix>
              <Input
                placeholder="Поиск по теме, спикеру или тегам..."
                value={f.search}
                onChange={(e) => f.setSearch(e.target.value)}
                className="w-full bg-[#f5f3ed]/60 border border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 focus-within:border-[#1a4d3e] focus-within:ring-2 focus-within:ring-[#1a4d3e]/10 transition-all rounded-xl h-11 text-sm text-[#1a4d3e] placeholder:text-muted-foreground/60 font-medium"
              />
            </InputGroup>

            <Select
              selectedKey={f.hall || "all"}
              onSelectionChange={(key) => {
                const val = String(key);
                f.setHall(val === "all" ? "" : val);
              }}
              className="w-full lg:w-56 bg-[#f5f3ed]/60 border border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 rounded-xl h-11 text-sm text-[#1a4d3e] font-medium"
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
                    <ListBox.Item
                      key={h}
                      id={String(h)}
                      textValue={`Зал ${h}`}
                    >
                      Зал {h}
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="flex gap-2 flex-wrap pt-1 border-t border-[#1a4d3e]/10">
            <button
              type="button"
              onClick={() => f.setSectionId(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                f.sectionId === null
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] border border-[#1a4d3e]/15 hover:bg-[#1a4d3e]/5"
              }`}
            >
              <span>Все секции</span>
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
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

export const conferencePageRoute = { element: <ConferencePage /> };