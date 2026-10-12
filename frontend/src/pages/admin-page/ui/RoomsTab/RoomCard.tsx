import { DoorOpen, Pencil, Trash2 } from "lucide-react";
import type { Room } from "~entities/talk/model/types";
import { ROOM_COLORS } from "../../model/constants";
import { formatTalkWord } from "../../lib/formatters";

interface RoomCardProps {
  room: Room;
  index: number;
  talkCount: number;
  onEdit: (room: Room) => void;
  onDelete: (id: number) => void;
}

export function RoomCard({ room, index, talkCount, onEdit, onDelete }: RoomCardProps) {
  const isBusy = talkCount > 0;
  const badgeColor = ROOM_COLORS[index % ROOM_COLORS.length];

  return (
    <div className="admin-crud-card">
      <div className="admin-crud-card-left">
        <div className="admin-crud-card-badge" style={{ backgroundColor: badgeColor }}>
          <DoorOpen className="size-3" />
        </div>
        <div>
          <div className="admin-crud-card-title">{room.name}</div>
          <div className="admin-crud-card-meta">
            {isBusy ? (
              <>
                <span className="admin-room-busy-dot" />
                Занята · {talkCount} {formatTalkWord(talkCount)}
              </>
            ) : (
              <>
                <span className="admin-room-free-dot" />
                Свободна
              </>
            )}
          </div>
        </div>
      </div>
      <div className="admin-crud-card-actions">
        <button className="admin-icon-btn" title="Редактировать" onClick={() => onEdit(room)}>
          <Pencil className="size-4" />
        </button>
        <button
          className="admin-icon-btn admin-icon-btn-danger"
          title="Удалить"
          onClick={() => onDelete(room.id)}
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
