import { Pencil, Trash2, UserCheck } from "lucide-react";
import type { Section } from "~entities/talk/model/types";
import { ROOM_COLORS } from "../../model/constants";
import { formatTalkWord } from "../../lib/formatters";

interface SectionCardProps {
  section: Section;
  index: number;
  talkCount: number;
  onEdit: (section: Section) => void;
  onDelete: (id: number) => void;
}

export function SectionCard({
  section,
  index,
  talkCount,
  onEdit,
  onDelete,
}: SectionCardProps) {
  const isBusy = talkCount > 0;
  const badgeColor = ROOM_COLORS[index % ROOM_COLORS.length];

  return (
    <div className="admin-crud-card">
      <div className="admin-crud-card-left">
        <div className="admin-crud-card-badge" style={{ backgroundColor: badgeColor }}>
          {index + 1}
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="admin-crud-card-title">{section.title}</span>
          </div>
          {section.supervisor && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#1a4d3e]/90 font-medium">
              <UserCheck className="size-3.5 text-[#d4a84b] shrink-0" />
              <span>Ответственный: <strong className="font-semibold text-[#1a4d3e]">{section.supervisor}</strong></span>
            </div>
          )}
          <div className="admin-crud-card-meta flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs">
            <span className="font-semibold text-[#1a4d3e]">
              {talkCount} {formatTalkWord(talkCount)}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {section.rooms && section.rooms.length > 0
                ? `В аудиториях: ${section.rooms.map((r) => `${r.name} (${r.talksCount} ст.)`).join(", ")}`
                : "Аудитории не назначены"}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-[#d4a84b] font-bold font-mono">
              Регламент: 10 мин (ключевой: 15 мин)
            </span>
          </div>
        </div>
      </div>
      <div className="admin-crud-card-actions">
        <div className="admin-crud-card-meta">
          {isBusy ? (
            <>
              <span className="admin-room-busy-dot" />
              <span>Занята · {talkCount} {formatTalkWord(talkCount)}</span>
            </>
          ) : (
            <>
              <span className="admin-room-free-dot" />
              <span>Свободна</span>
            </>
          )}
        </div>
        <button className="admin-icon-btn" title="Редактировать" onClick={() => onEdit(section)}>
          <Pencil className="size-4" />
        </button>
        <button
          className="admin-icon-btn admin-icon-btn-danger"
          title="Удалить"
          onClick={() => onDelete(section.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
