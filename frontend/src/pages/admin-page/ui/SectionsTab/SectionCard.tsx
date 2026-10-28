import { Pencil, Trash2 } from "lucide-react";
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
          <div className="admin-crud-card-title">{section.title}</div>
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
