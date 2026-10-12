import { Plus, BookOpen } from "lucide-react";
import type { Section, Talk } from "~entities/talk/model/types";
import type { SectionFormState } from "../../model/types";
import { SectionCard } from "./SectionCard";
import { SectionFormModal } from "./SectionFormModal";

interface SectionsTabProps {
  sections: Section[];
  talks: Talk[];
  form: SectionFormState;
  setForm: React.Dispatch<React.SetStateAction<SectionFormState>>;
  saving: boolean;
  error: string;
  onOpenCreate: () => void;
  onOpenEdit: (section: Section) => void;
  onCloseForm: () => void;
  onSave: () => void;
  onDelete: (id: number) => void;
}

export function SectionsTab({
  sections,
  talks,
  form,
  setForm,
  saving,
  error,
  onOpenCreate,
  onOpenEdit,
  onCloseForm,
  onSave,
  onDelete,
}: SectionsTabProps) {
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="admin-crud-header">
        <div>
          <p className="admin-crud-desc">
            Секции группируют доклады по тематикам. Порядок влияет на сортировку в расписании.
          </p>
        </div>
        <button className="admin-create-btn" onClick={onOpenCreate}>
          <Plus className="size-4" /> Добавить секцию
        </button>
      </div>

      <SectionFormModal
        form={form}
        onChange={setForm}
        onClose={onCloseForm}
        onSave={onSave}
        saving={saving}
        error={error}
      />

      {sortedSections.length === 0 ? (
        <div className="admin-empty-state">
          <BookOpen className="size-12 opacity-25" />
          <p>Секции ещё не созданы</p>
          <button className="admin-btn-primary" onClick={onOpenCreate}>
            <Plus className="size-4" /> Добавить первую секцию
          </button>
        </div>
      ) : (
        <div className="admin-cards-list">
          {sortedSections.map((s, i) => {
            const talkCount = talks.filter((t) => t.sectionId === s.id).length;
            return (
              <SectionCard
                key={s.id}
                section={s}
                index={i}
                talkCount={talkCount}
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
