import { X, Save } from "lucide-react";
import type { RoomFormState } from "../../model/types";

interface RoomFormModalProps {
  form: RoomFormState;
  onChange: React.Dispatch<React.SetStateAction<RoomFormState>>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}

export function RoomFormModal({
  form,
  onChange,
  onClose,
  onSave,
  saving,
  error,
}: RoomFormModalProps) {
  if (!form.open) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span>{form.mode === "create" ? "Новая аудитория" : "Редактировать аудиторию"}</span>
          <button className="admin-modal-close" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-field">
            <label className="admin-label">Название аудитории *</label>
            <input
              className="admin-input"
              placeholder="Например: Ауд. 101"
              value={form.name}
              onChange={(e) => onChange((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              autoFocus
            />
          </div>
          {error && <p className="admin-form-error">{error}</p>}
        </div>
        <div className="admin-modal-footer">
          <button className="admin-btn-ghost" onClick={onClose}>
            Отмена
          </button>
          <button className="admin-btn-primary" onClick={onSave} disabled={saving}>
            {saving ? <div className="admin-spinner admin-spinner-sm" /> : <Save className="size-3.5" />}
            {form.mode === "create" ? "Создать" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
