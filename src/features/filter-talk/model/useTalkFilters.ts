// ~features/filter-talk/model/useTalkFilters.ts
import { useMemo, useState } from "react";
import type { Talk } from "~entities/talk/model/types";

export function useTalkFilters(talks: Talk[]) {
  const [search, setSearch] = useState("");
  const [sectionId, setSectionId] = useState<string>("all");
  const [hall, setHall] = useState<string>("all");

  // ИСПРАВЛЕНО: добавлен .filter(Boolean), чтобы убрать пустые строки из списка аудиторий
  const halls = useMemo(
    () => [...new Set(talks.map((t) => t.hallNumber).filter(Boolean))].sort(),
    [talks]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return talks
      .filter((t) => sectionId === "all" || t.sectionId === sectionId)
      .filter((t) => hall === "all" || t.hallNumber === hall)
      .filter(
        (t) =>
          q === "" ||
          t.title.toLowerCase().includes(q) ||
          t.speakerName.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  }, [talks, search, sectionId, hall]);

  return { search, setSearch, sectionId, setSectionId, hall, setHall, halls, filtered };
}