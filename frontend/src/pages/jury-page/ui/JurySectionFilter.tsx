import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import type { Section } from "~entities/talk/model/types";

interface JurySectionFilterProps {
  sections: Section[];
  selectedSectionId: string;
  setSelectedSectionId: (id: string) => void;
  /** Talk counts per section id for the active tab. */
  sectionCounts: Record<string, number>;
  totalCount: number;
}

export function JurySectionFilter({
  sections,
  selectedSectionId,
  setSelectedSectionId,
  sectionCounts,
  totalCount,
}: JurySectionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const selectedIndex = sections.findIndex((s) => String(s.id) === selectedSectionId);
  const selected = selectedIndex >= 0 ? sections[selectedIndex] : null;

  const choose = (id: string) => {
    setSelectedSectionId(id);
    setIsOpen(false);
  };

  const optionClass = (active: boolean) =>
    `w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
      active ? "bg-[#1a4d3e]/10" : "hover:bg-[#1a4d3e]/5"
    }`;

  return (
    <div ref={rootRef} className="relative w-full lg:w-[28rem]">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-xl border bg-white text-left transition-all cursor-pointer ${
          isOpen || selected
            ? "border-[#1a4d3e] ring-2 ring-[#1a4d3e]/10"
            : "border-[#1a4d3e]/20 hover:border-[#1a4d3e]/40"
        }`}
      >
        <Layers className="size-4 text-[#d4a84b] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1a4d3e]/50">
            Секция
          </span>
          <span className="block text-sm font-bold text-[#1a4d3e] truncate">
            {selected ? `${selectedIndex + 1}. ${selected.title}` : "Все секции"}
          </span>
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1a4d3e]/10 text-[#1a4d3e] shrink-0">
          {selected ? sectionCounts[String(selected.id)] ?? 0 : totalCount}
        </span>
        <ChevronDown
          className={`size-4 text-[#1a4d3e]/60 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-2 p-1.5 bg-white rounded-2xl border border-[#1a4d3e]/15 shadow-xl shadow-[#1a4d3e]/10 max-h-[min(70vh,28rem)] overflow-y-auto"
        >
          <button
            type="button"
            role="option"
            aria-selected={!selected}
            onClick={() => choose("all")}
            className={optionClass(!selected)}
          >
            <span className="size-6 rounded-lg bg-[#1a4d3e] text-white flex items-center justify-center shrink-0">
              <Layers className="size-3.5" />
            </span>
            <span className="flex-1 text-sm font-bold text-[#1a4d3e] pt-0.5">Все секции</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#1a4d3e]/10 text-[#1a4d3e] shrink-0">
              {totalCount}
            </span>
            {!selected && <Check className="size-4 text-[#1a4d3e] shrink-0 mt-0.5" />}
          </button>

          <div className="my-1 border-t border-[#1a4d3e]/10" />

          {sections.map((sec, i) => {
            const id = String(sec.id);
            const active = id === selectedSectionId;
            const count = sectionCounts[id] ?? 0;
            return (
              <button
                key={sec.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(id)}
                className={optionClass(active)}
              >
                <span className="size-6 rounded-lg bg-[#1a4d3e]/10 text-[#1a4d3e] text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span
                  className={`flex-1 text-sm leading-snug pt-0.5 ${
                    count > 0 ? "font-semibold text-[#1a4d3e]" : "text-[#1a4d3e]/50"
                  }`}
                >
                  {sec.title}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    count > 0 ? "bg-[#d4a84b]/20 text-[#8a6a1f]" : "bg-[#1a4d3e]/5 text-[#1a4d3e]/40"
                  }`}
                >
                  {count}
                </span>
                {active && <Check className="size-4 text-[#1a4d3e] shrink-0 mt-0.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
