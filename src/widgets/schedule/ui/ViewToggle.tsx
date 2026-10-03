import { LayoutGrid, List } from "lucide-react";
import { cn } from "~app/lib/utils";

type ViewMode = "card" | "list";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex bg-[#f5f3ed] p-1 rounded-xl border border-[#1a4d3e]/20 shadow-sm">
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          mode === "card"
            ? "bg-white text-[#1a4d3e] shadow-sm"
            : "text-muted-foreground hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5",
        )}
      >
        <LayoutGrid className="size-4" />
        <span className="hidden sm:inline">Карточки</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200",
          mode === "list"
            ? "bg-white text-[#1a4d3e] shadow-sm"
            : "text-muted-foreground hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5",
        )}
      >
        <List className="size-4" />
        <span className="hidden sm:inline">Список</span>
      </button>
    </div>
  );
}
