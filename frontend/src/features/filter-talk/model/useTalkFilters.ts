  import { useMemo, useState } from "react";
import type { Talk } from "~entities/talk/model/types";

export function useTalkFilters(talks: Talk[]) {
  const [search, setSearch] = useState("");
  const [sectionId, setSectionId] = useState<number | string | null>(null);
  const [hall, setHall] = useState<string>("all");

  const halls = useMemo(
    () => [...new Set(talks.map((t) => t.room?.name).filter(Boolean))].sort(),
    [talks]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    
    return talks
      .filter((t) => {
        if (sectionId === null || sectionId === "all" || sectionId === "") return true;
        const talkSecId = t.sectionId ?? t.section?.id;
        return talkSecId !== undefined && String(talkSecId) === String(sectionId);
      })
      .filter((t) => hall === "all" || t.room?.name === hall)
      .filter(
        (t) =>
          q === "" ||
          t.title.toLowerCase().includes(q) ||
          t.speakerName.toLowerCase().includes(q) ||
          (t.abstract || "").toLowerCase().includes(q) ||
          (t.supervisor || "").toLowerCase().includes(q) ||
          (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        if (!a.startTime && !b.startTime) return 0;
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;

        return Date.parse(a.startTime) - Date.parse(b.startTime);
      });
  }, [talks, search, sectionId, hall]);

  return { 
    search, 
    setSearch, 
    sectionId, 
    setSectionId, 
    hall, 
    setHall, 
    halls, 
    filtered 
  };
}