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
        const isFilteringSpecificSection = sectionId !== null && sectionId !== "" && sectionId !== "all";

        // If viewing a specific section: that section's keynote is ALWAYS strictly first!
        if (isFilteringSpecificSection) {
          if (a.isKeynote && !b.isKeynote) return -1;
          if (!a.isKeynote && b.isKeynote) return 1;
        }

        // 1. Chronological order by start time
        if (a.startTime && b.startTime) {
          const timeDiff = Date.parse(a.startTime) - Date.parse(b.startTime);
          if (timeDiff !== 0) return timeDiff;
          // If starting at same time: section keynotes go first
          if (a.isKeynote && !b.isKeynote) return -1;
          if (!a.isKeynote && b.isKeynote) return 1;
        }
        if (a.startTime && !b.startTime) return -1;
        if (!a.startTime && b.startTime) return 1;

        // If neither has start time, keynotes go first within same section
        if (a.sectionId === b.sectionId) {
          if (a.isKeynote && !b.isKeynote) return -1;
          if (!a.isKeynote && b.isKeynote) return 1;
        }

        // 2. Otherwise order of registration (created_at ASC)
        return (a.createdAt ? Date.parse(a.createdAt) : 0) - (b.createdAt ? Date.parse(b.createdAt) : 0);
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