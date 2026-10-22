import {
  Users,
  Plus,
  Trash2,
  User as UserIcon,
  School,
  GraduationCap,
} from "lucide-react";
import type { CoAuthorItem } from "../model/types";

interface CoAuthorsEditorProps {
  coAuthorsList: CoAuthorItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof CoAuthorItem, value: string) => void;
}

export function CoAuthorsEditor({
  coAuthorsList,
  onAdd,
  onRemove,
  onUpdate,
}: CoAuthorsEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
              Соавторы доклада
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e]">
              необязательно
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Если исследование проводилось в команде, добавьте соавторов. Если соавторов нет — оставьте поле пустым.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-3.5 text-[#d4a84b]" />
          <span>Добавить соавтора</span>
        </button>
      </div>

      {coAuthorsList.length === 0 ? (
        <div className="p-4 rounded-2xl border border-dashed border-[#1a4d3e]/20 bg-[#f5f3ed]/30 text-center">
          <p className="text-xs text-muted-foreground">
            Соавторы не указаны. Нажмите кнопку <strong>«Добавить соавтора»</strong>, если над проектом работали несколько человек.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coAuthorsList.map((ca, idx) => (
            <div
              key={ca.id}
              className="p-4 rounded-2xl border border-[#1a4d3e]/20 bg-[#f5f3ed]/40 space-y-3 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1a4d3e] flex items-center gap-1.5">
                  <Users className="size-3.5 text-[#d4a84b]" />
                  Соавтор #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(ca.id)}
                  className="text-xs text-danger/80 hover:text-danger font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Удалить соавтора"
                >
                  <Trash2 className="size-3.5" />
                  <span>Удалить</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#1a4d3e] mb-1">
                    ФИО соавтора
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <UserIcon className="size-3.5" />
                    </div>
                    <input
                      type="text"
                      value={ca.fullName}
                      onChange={(e) => onUpdate(ca.id, "fullName", e.target.value)}
                      placeholder="Смирнов А.П."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#1a4d3e]/20 text-xs text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1a4d3e] mb-1">
                    ВУЗ / Университет
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <School className="size-3.5" />
                    </div>
                    <input
                      type="text"
                      value={ca.university}
                      onChange={(e) => onUpdate(ca.id, "university", e.target.value)}
                      placeholder="МУИТ"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#1a4d3e]/20 text-xs text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#1a4d3e] mb-1">
                    Группа / Класс
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <GraduationCap className="size-3.5" />
                    </div>
                    <input
                      type="text"
                      value={ca.groupName}
                      onChange={(e) => onUpdate(ca.id, "groupName", e.target.value)}
                      placeholder="ИС-22"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#1a4d3e]/20 text-xs text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
