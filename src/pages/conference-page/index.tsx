import { Search } from "lucide-react";

import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { mockSections } from "~shared/mocks/schedule";
import { useTalksQuery } from "~entities/talk/api/queries";
import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";
import { Input } from "~app/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "~app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~app/components/ui/select";

export function ConferencePage() {
  const { data: talks = [], isLoading, isError } = useTalksQuery();
  const f = useTalkFilters(talks);

  if (isError)
    return (
      <p className="text-center py-10 text-red-600">
        Не удалось загрузить программу
      </p>
    );

  return (
    <div className="py-6 flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Программа конференции</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по теме, докладчику, тегу..."
            className="pl-9"
            value={f.search}
            onChange={(e) => f.setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <Tabs value={f.sectionId} onValueChange={f.setSectionId}>
            <TabsList>
              <TabsTrigger value="all">Все секции</TabsTrigger>
              {mockSections.map((s) => (
                <TabsTrigger key={s.id} value={s.id}>
                  {s.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={f.hall} onValueChange={f.setHall}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Аудитория" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все аудитории</SelectItem>
              {f.halls.map((h) => (
                <SelectItem key={h} value={h}>
                  Ауд. {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScheduleList
        talks={f.filtered}
        sections={mockSections}
        isLoading={isLoading}
      />
    </div>
  );
}

export const conferencePageRoute = { element: <ConferencePage /> };
