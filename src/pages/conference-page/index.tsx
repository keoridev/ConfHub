// ConferencePage.tsx
import { Search } from "lucide-react";
import { useMemo } from "react";

import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { mockSections } from "~shared/mocks/schedule";
import { useTalksQuery } from "~entities/talk/api/queries";
import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";
import { CurrentTalkCard } from "~widgets/schedule/ui/TalkCard";

import { Input, InputGroup, Select, ListBox, Card, Chip } from "@heroui/react";

export function ConferencePage() {
  const { data: talks = [], isLoading, isError } = useTalksQuery();
  const f = useTalkFilters(talks);

  const halls = useMemo(
    () =>
      [
        ...new Set(talks.map((t) => t.hallNumber).filter(Boolean)),
      ].sort() as string[],
    [talks],
  );

  // Find current and next talks
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md p-8 text-center animate-scale-in">
          <div className="size-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-3xl">️</span>
          </div>
          <h2 className="text-xl font-bold mb-2">
            Не удалось загрузить программу
          </h2>
          <p className="text-muted-foreground">Попробуйте обновить страницу</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      {/* Header */}
      <header className="border-b border-border/50 bg-[#f5f3ed]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1a4d3e] flex items-center justify-center">
              <span className="text-white font-bold text-lg">С</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1a4d3e]">СИГНАЛ</h1>
              <p className="text-xs text-muted-foreground">
                конференция · 14–15 июня
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-muted-foreground">Залы: 3</span>
            <span className="text-muted-foreground">Докладов: 24</span>
            <span className="text-[#d4a84b] font-medium">Сейчас 14:30</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <Card className="lg:col-span-2 bg-[#1a4d3e] text-white border-0 rounded-2xl overflow-hidden">
            <div className="p-8 relative">
              <div className="absolute top-6 right-6 text-sm text-white/60">
                14 ИЮНЯ
              </div>
              <p className="text-sm text-white/60 mb-2">ПРОГРАММА · ДЕНЬ 1</p>

              <h2 className="text-6xl font-bold mb-6 tracking-tight">
                СИГНАЛ
                <br />
                2026
              </h2>

              <p className="text-lg text-white/80 max-w-xl leading-relaxed">
                Два дня о дизайне, интерфейсах и системах.
                <br />
                24 доклада, 4 секции, 3 зала — всё важное в одном ритме.
              </p>

              <div className="flex gap-3 mt-8 flex-wrap">
                <Chip
                  variant="bordered"
                  className="border-white/30 text-white bg-transparent"
                >
                  Дизайн
                </Chip>
                <Chip
                  variant="bordered"
                  className="border-white/30 text-white bg-transparent"
                >
                  Интерфейсы
                </Chip>
                <Chip
                  variant="bordered"
                  className="border-white/30 text-white bg-transparent"
                >
                  Системы
                </Chip>
                <Chip
                  variant="bordered"
                  className="border-white/30 text-white bg-transparent"
                >
                  Код
                </Chip>
              </div>
            </div>
          </Card>

          {/* Current & Next Talks */}
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

        {/* Program Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#1a4d3e] pb-2">
            <div>
              <p className="text-sm text-muted-foreground">
                14 ИЮНЯ · КОМТЕХНО
              </p>
              <h3 className="text-3xl font-bold text-[#1a4d3e]">Программа</h3>
            </div>
            <button className="text-sm text-muted-foreground hover:text-[#1a4d3e] transition-colors">
              ВСЕ СЕКЦИИ
            </button>
          </div>

          {/* Filters */}
          <Card className="border border-border/50 bg-[#f5f3ed]/80 backdrop-blur-sm">
            <div className="p-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <InputGroup className="flex-1">
                  <InputGroup.Prefix>
                    <Search className="size-5 text-muted-foreground" />
                  </InputGroup.Prefix>
                  <Input
                    placeholder="Тема, спикер или тег"
                    value={f.search}
                    onChange={(e) => f.setSearch(e.target.value)}
                    className="bg-transparent border-0 text-lg"
                    classNames={{
                      input: "text-base placeholder:text-muted-foreground",
                    }}
                  />
                </InputGroup>

                {/* Hall Select */}
                <Select
                  selectedKeys={f.hall ? [f.hall] : ["all"]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as string;
                    f.setHall(val === "all" ? "" : val);
                  }}
                  className="w-full lg:w-48"
                  aria-label="Фильтр по залу"
                >
                  <Select.Trigger className="bg-white border-border/50">
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

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Chip
                  variant={f.sectionId === null ? "flat" : "bordered"}
                  color={f.sectionId === null ? "primary" : "default"}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => f.setSectionId(null)}
                >
                  Все
                </Chip>
                {mockSections.map((s) => (
                  <Chip
                    key={s.id}
                    variant={f.sectionId === s.id ? "flat" : "bordered"}
                    color={f.sectionId === s.id ? "primary" : "default"}
                    className="cursor-pointer px-4 py-2"
                    onClick={() => f.setSectionId(s.id)}
                  >
                    {s.title}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>

          {/* Schedule List */}
          <ScheduleList
            talks={f.filtered}
            sections={mockSections}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export const conferencePageRoute = { element: <ConferencePage /> };
