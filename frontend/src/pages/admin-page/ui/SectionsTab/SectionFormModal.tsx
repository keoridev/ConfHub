import { X, Save } from "lucide-react";
import type { SectionFormState } from "../../model/types";

interface SectionFormModalProps {
  form: SectionFormState;
  onChange: React.Dispatch<React.SetStateAction<SectionFormState>>;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string;
}

export function SectionFormModal({
  form,
  onChange,
  onClose,
  onSave,
  saving,
  error,
}: SectionFormModalProps) {
  if (!form.open) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <span>{form.mode === "create" ? "Новая секция" : "Редактировать секцию"}</span>
          <button className="admin-modal-close" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <div className="admin-modal-body">
          <div className="admin-field">
            <label className="admin-label">Название секции *</label>
            <input
              className="admin-input"
              placeholder="Например: Информационные технологии"
              value={form.title}
              onChange={(e) => onChange((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && onSave()}
              autoFocus
            />
          </div>
          <div className="admin-field">
            <label className="admin-label">Ответственный / Руководитель секции</label>
            <input
              className="admin-input"
              placeholder="Например: Жамалова Венера Жумашбековна"
              value={form.supervisor || ""}
              onChange={(e) => onChange((f) => ({ ...f, supervisor: e.target.value }))}
            />
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              ФИО преподавателя или учёного, ответственного за научное руководство секцией
            </span>
          </div>
          <div className="admin-field">
            <label className="admin-label">Порядок сортировки</label>
            <input
              className="admin-input admin-input-sm"
              type="number"
              min={1}
              value={form.sortOrder}
              onChange={(e) => onChange((f) => ({ ...f, sortOrder: e.target.value }))}
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
