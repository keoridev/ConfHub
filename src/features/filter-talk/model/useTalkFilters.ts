import { useMemo, useState } from "react";
import type { Talk } from "~entities/talk/model/types";

export function useTalkFilters(talks: Talk[]) {
  const [search, setSearch] = useState("");
  const [sectionId, setSectionId] = useState<string>("all");
  const [hall, setHall] = useState<string>("all");

  const halls = useMemo(() => [...new Set(talks.map((t) => t.hallNumber))].sort(), [talks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return talks
      .filter((t) => sectionId === "all" || t.sectionId === sectionId)
      .filter((t) => hall === "all" || t.hallNumber === hall)
      .filter((t) =>
        q === "" ||
        t.title.toLowerCase().includes(q) ||
        t.speakerName.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime));
  }, [talks, search, sectionId, hall]);

  return { search, setSearch, sectionId, setSectionId, hall, setHall, halls, filtered };
}