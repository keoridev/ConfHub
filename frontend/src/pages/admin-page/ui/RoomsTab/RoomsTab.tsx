import { Plus, DoorOpen } from "lucide-react";
import type { Room, Talk } from "~entities/talk/model/types";
import type { RoomFormState } from "../../model/types";
import { RoomCard } from "./RoomCard";
import { RoomFormModal } from "./RoomFormModal";

interface RoomsTabProps {
  rooms: Room[];
  scheduledTalks: Talk[];
  form: RoomFormState;
  setForm: React.Dispatch<React.SetStateAction<RoomFormState>>;
  saving: boolean;
  error: string;
  onOpenCreate: () => void;
  onOpenEdit: (room: Room) => void;
  onCloseForm: () => void;
  onSave: () => void;
  onDelete: (id: number) => void;
}

export function RoomsTab({
  rooms,
  scheduledTalks,
  form,
  setForm,
  saving,
  error,
  onOpenCreate,
  onOpenEdit,
  onCloseForm,
  onSave,
  onDelete,
}: RoomsTabProps) {
  return (
    <>
      <div className="admin-crud-header">
        <div>
          <p className="admin-crud-desc">
            Аудитории назначаются одобренным докладам при формировании расписания.
          </p>
        </div>
        <button className="admin-create-btn" onClick={onOpenCreate}>
          <Plus className="size-4" /> Добавить аудиторию
        </button>
      </div>

      <RoomFormModal
        form={form}
        onChange={setForm}
        onClose={onCloseForm}
        onSave={onSave}
        saving={saving}
        error={error}
      />

      {rooms.length === 0 ? (
        <div className="admin-empty-state">
          <DoorOpen className="size-12 opacity-25" />
          <p>Аудитории ещё не добавлены</p>
          <button className="admin-btn-primary" onClick={onOpenCreate}>
            <Plus className="size-4" /> Добавить первую аудиторию
          </button>
        </div>
      ) : (
        <div className="admin-cards-list">
          {rooms.map((r, i) => {
            const count = scheduledTalks.filter((t) => t.room?.id === r.id).length;
            return (
              <RoomCard
                key={r.id}
                room={r}
                index={i}
                talkCount={count}
                onEdit={onOpenEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
