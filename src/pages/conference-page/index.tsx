import { Search } from "lucide-react";
import { useMemo } from "react";

import { ScheduleList } from "~widgets/schedule/ui/ScheduleList";
import { mockSections } from "~shared/mocks/schedule";
import { useTalksQuery } from "~entities/talk/api/queries";
import { useTalkFilters } from "~features/filter-talk/model/useTalkFilters";

// Импорты из HeroUI v3
import {
  Input,
  InputGroup,
  Tabs,
  Select,
  ListBox,
  Label,
} from "@heroui/react";

export function ConferencePage() {
  const { data: talks = [], isLoading, isError } = useTalksQuery();
  const f = useTalkFilters(talks);
  
  const halls = useMemo(
    () => [...new Set(talks.map((t) => t.hallNumber).filter(Boolean))].sort(),
    [talks],
  );

  if (isError) {
    return (
      <p className="text-center py-10 text-danger">
        Не удалось загрузить программу
      </p>
    );
  }

  return (
    <div className="py-6 flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Программа конференции</h1>
        
        {/* Поиск с иконкой через InputGroup */}
        <InputGroup className="max-w-md">
          <InputGroup.Prefix>
            <Search className="size-4 text-default-500" />
          </InputGroup.Prefix>
          <Input
            placeholder="Поиск по теме, докладчику, тегу..."
            value={f.search}
            onChange={(e) => f.setSearch(e.target.value)}
          />
        </InputGroup>

        <div className="flex gap-3 flex-wrap items-center">
          {/* Табы для фильтрации секций */}
          <Tabs 
            selectedKey={f.sectionId} 
            onSelectionChange={(key) => f.setSectionId(key as string)}
            variant="light"
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Секции">
                <Tabs.Tab id="all">
                  Все секции
                  <Tabs.Indicator />
                </Tabs.Tab>
                {mockSections.map((s) => (
                  <Tabs.Tab key={s.id} id={s.id}>
                    {s.title}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
            
            {/* В v3 Tabs.Panel требует children. Передаем null, так как контент рендерится отдельно через ScheduleList */}
            <Tabs.Panel id="all">{null}</Tabs.Panel>
            {mockSections.map((s) => (
              <Tabs.Panel key={s.id} id={s.id}>{null}</Tabs.Panel>
            ))}
          </Tabs>

          {/* Select для фильтрации аудиторий */}
          <Select
            selectedKeys={f.hall ? [f.hall] : []}
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              f.setHall(val);
            }}
            className="w-40"
          >
            <Label>Аудитория</Label>
            <Select.Trigger>
              <Select.Value placeholder="Аудитория" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="Все аудитории">
                  Все аудитории
                </ListBox.Item>
                {halls.map((h) => (
                  <ListBox.Item key={h} id={String(h)} textValue={`Ауд. ${h}`}>
                    Ауд. {h}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
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