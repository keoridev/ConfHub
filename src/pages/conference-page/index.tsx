import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { ViewToggle } from "~widgets/schedule/ui/ViewToggle";
import { CurrentTalkCard } from "~widgets/schedule/ui/TalkCard"; // Убедитесь, что путь верный

import { mockSections } from "~shared/mocks/schedule";
import { useTalksQuery } from "~entities/talk/api/queries";
import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";

import { Input, InputGroup, Select, ListBox, Card, Chip } from "@heroui/react";

export function ConferencePage() {
  const { data: talks = [], isLoading, isError } = useTalksQuery();
  const f = useTalkFilters(talks);
  const [viewMode, setViewMode] = useState<"card" | "list">("list");

  const halls = useMemo(
    () =>
      [
        ...new Set(talks.map((t) => t.hallNumber).filter(Boolean)),
      ].sort() as string[],
    [talks],
  );

  const currentTime = new Date();
  const currentTalk = talks.find((talk) => {
    const start = new Date(talk.startTime);
    const end = new Date(talk.endTime);
    return currentTime >= start && currentTime <= end;
  });

  const nextTalk = talks.find((talk) => {
    const start = new Date(talk.startTime);
    return start > currentTime;
  });

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f3ed]">
        <Card className="max-w-md p-8 text-center animate-scale-in bg-white border-[#1a4d3e]/10">
          <div className="size-16 mx-auto mb-4 rounded-full bg-danger/10 flex items-center justify-center">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold mb-2 text-[#1a4d3e]">
            Не удалось загрузить программу
          </h2>
          <p className="text-muted-foreground">Попробуйте обновить страницу</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      {/* 1. Верхний хедер */}
      <header className="border-b border-[#1a4d3e]/10 bg-[#f5f3ed]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a4d3e] flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg">С</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a4d3e] tracking-tight">
                СИГНАЛ
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                конференция · 14–15 июня
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <span className="text-muted-foreground font-medium">Залы: 3</span>
            <span className="text-muted-foreground font-medium">
              Докладов: 24
            </span>
            <span className="text-[#d4a84b] font-bold bg-[#d4a84b]/10 px-3 py-1 rounded-full">
              Сейчас 14:30
            </span>
          </div>
        </div>
      </header>

      {/* 2. Единый главный контейнер (исправлено вложение max-w) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* 3. Hero секция */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Основная карточка */}
          <Card className="lg:col-span-2 bg-[#1a4d3e] text-white border-0 rounded-2xl overflow-hidden shadow-lg shadow-[#1a4d3e]/10">
            <div className="p-6 sm:p-8 relative">
              <div className="absolute top-6 right-6 text-sm text-white/50 font-medium">
                14 ИЮНЯ
              </div>
              <p className="text-sm text-[#d4a84b] font-semibold mb-2 uppercase tracking-wider">
                Программа · День 1
              </p>

              <h2 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight leading-none">
                СИГНАЛ
                <br />
                2026
              </h2>

              <p className="text-lg text-white/80 max-w-xl leading-relaxed">
                Два дня о дизайне, интерфейсах и системах.
                <br className="hidden sm:block" />
                24 доклада, 4 секции, 3 зала — всё важное в одном ритме.
              </p>

              <div className="flex gap-3 mt-8 flex-wrap">
                {["Дизайн", "Интерфейсы", "Системы", "Код"].map((tag) => (
                  <Chip
                    key={tag}
                    variant="bordered"
                    className="border-white/30 text-white bg-transparent hover:bg-white/10 transition-colors"
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* Карточки текущего и следующего доклада */}
          <div className="space-y-4">
            {currentTalk && (
              <CurrentTalkCard
                talk={currentTalk}
                variant="current"
                hallName="Зал А"
              />
            )}
            {nextTalk && (
              <CurrentTalkCard
                talk={nextTalk}
                variant="next"
                hallName="Зал B"
              />
            )}
          </div>
        </div>

        {/* 4. Секция программы (без лишних вложенных max-w контейнеров!) */}
        <div className="space-y-6">
          {/* Заголовок и переключатель */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1a4d3e]/10 pb-4">
            <div>
              <p className="text-sm text-muted-foreground font-semibold mb-1 uppercase tracking-wide">
                14 ИЮНЯ · МОСКВА
              </p>
              <h2 className="text-3xl font-bold text-[#1a4d3e]">
                Программа конференции
              </h2>
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* 5. Панель фильтров (исправлены стили под общую тему) */}
          <Card className="bg-white border-[#1a4d3e]/10 shadow-sm">
            <div className="p-5 sm:p-6 space-y-5">
              {/* Поиск и Селект */}
              <div className="flex flex-col lg:flex-row gap-4">
                <InputGroup className="flex-1">
                  <InputGroup.Prefix>
                    <Search className="size-5 text-[#1a4d3e]/50" />
                  </InputGroup.Prefix>
                  <Input
                    placeholder="Тема, спикер или тег..."
                    value={f.search}
                    onChange={(e) => f.setSearch(e.target.value)}
                    classNames={{
                      base: "w-full",
                      inputWrapper:
                        "bg-[#f5f3ed] border-2 border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 focus-within:border-[#d4a84b] focus-within:ring-4 focus-within:ring-[#d4a84b]/10 transition-all duration-200 rounded-xl h-12",
                      input:
                        "text-[#1a4d3e] placeholder:text-muted-foreground/60 text-base font-medium",
                    }}
                  />
                </InputGroup>

                <Select
                  selectedKeys={f.hall ? [f.hall] : ["all"]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    f.setHall(val === "all" ? "" : val);
                  }}
                  className="w-full lg:w-56"
                  aria-label="Фильтр по залу"
                  classNames={{
                    trigger:
                      "bg-[#f5f3ed] border-2 border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 data-[open=true]:border-[#d4a84b] data-[open=true]:ring-4 data-[open=true]:ring-[#d4a84b]/10 transition-all duration-200 rounded-xl h-12",
                    value: "text-[#1a4d3e] font-medium",
                  }}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Все залы" />
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

              {/* Табы-фильтры (кастомные стили вместо дефолтных primary/default) */}
              <div className="flex gap-2 flex-wrap">
                <Chip
                  variant="flat"
                  className={`cursor-pointer px-4 py-5 h-auto font-semibold transition-all ${
                    f.sectionId === null
                      ? "bg-[#1a4d3e] text-white shadow-md"
                      : "bg-[#f5f3ed] text-[#1a4d3e] border border-[#1a4d3e]/20 hover:border-[#d4a84b]/50"
                  }`}
                  onClick={() => f.setSectionId(null)}
                >
                  Все секции
                </Chip>
                {mockSections.map((s) => (
                  <Chip
                    key={s.id}
                    variant="flat"
                    className={`cursor-pointer px-4 py-5 h-auto font-semibold transition-all ${
                      f.sectionId === s.id
                        ? "bg-[#1a4d3e] text-white shadow-md"
                        : "bg-[#f5f3ed] text-[#1a4d3e] border border-[#1a4d3e]/20 hover:border-[#d4a84b]/50"
                    }`}
                    onClick={() => f.setSectionId(s.id)}
                  >
                    {s.title}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* 6. Список расписания */}
          <ScheduleList
            talks={f.filtered}
            sections={mockSections}
            isLoading={isLoading}
            viewMode={viewMode}
          />
        </div>
      </main>
    </div>
  );
}

export const conferencePageRoute = { element: <ConferencePage /> };
