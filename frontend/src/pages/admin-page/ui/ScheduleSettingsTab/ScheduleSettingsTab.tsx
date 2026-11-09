import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarPlus, Clock, Coffee, Mic, RotateCcw, Save, Star, Trash2 } from "lucide-react";
import {
  DEFAULT_SCHEDULE,
  buildSlots,
  formatDayLabel,
  useSaveScheduleMutation,
  useScheduleSettingsQuery,
  type ScheduleSettings,
} from "~entities/conference";

const cardClass = "bg-white rounded-2xl border border-[#1a4d3e]/15 p-4 sm:p-5 space-y-4";
const cardTitleClass = "flex items-center gap-2 text-sm font-extrabold text-[#1a4d3e]";

function validate(s: ScheduleSettings): string | null {
  if (s.days.length === 0) return "Добавьте хотя бы один день конференции";
  if (s.days.some((d) => !d)) return "Заполните дату у каждого дня";
  if (!s.dayStart || !s.dayEnd || s.dayStart >= s.dayEnd) return "Начало дня должно быть раньше конца";
  if (s.talkMinutes < 5 || s.talkMinutes > 60) return "Длительность доклада: от 5 до 60 минут";
  if (s.keynoteMinutes < 5 || s.keynoteMinutes > 90) return "Длительность ключевого доклада: от 5 до 90 минут";
  if (s.lunchStart || s.lunchEnd) {
    if (!s.lunchStart || !s.lunchEnd || s.lunchStart >= s.lunchEnd) return "Обед должен начинаться раньше, чем заканчивается";
    if (s.lunchStart < s.dayStart || s.lunchEnd > s.dayEnd) return "Обед должен быть внутри рабочего дня";
  }
  return null;
}

export function ScheduleSettingsTab() {
  const { settings, isCustom, conferenceId, isLoading } = useScheduleSettingsQuery();
  const saveMutation = useSaveScheduleMutation();
  const [form, setForm] = useState<ScheduleSettings>(settings);

  // Load saved settings into the form once they arrive
  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const set = <K extends keyof ScheduleSettings>(key: K, value: ScheduleSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const hasLunch = Boolean(form.lunchStart || form.lunchEnd);
  const error = validate(form);
  const talkSlots = useMemo(() => (error ? [] : buildSlots(form, form.talkMinutes)), [form, error]);
  const keynoteSlots = useMemo(() => (error ? [] : buildSlots(form, form.keynoteMinutes)), [form, error]);
  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  const handleSave = async () => {
    if (error) {
      toast.error(error);
      return;
    }
    if (!conferenceId) {
      toast.error("Текущая конференция не найдена");
      return;
    }
    try {
      await saveMutation.mutateAsync({ conferenceId, settings: form });
      toast.success("Регламент сохранён. Жюри увидит новые слоты при следующем одобрении.");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Не удалось сохранить регламент");
    }
  };

  if (isLoading) {
    return <div className="admin-empty-state">Загрузка регламента...</div>;
  }

  return (
    <>
      <div className="admin-crud-header">
        <p className="admin-crud-desc">
          Регламент конференции: дни, время работы, длительность докладов и обед. Из этих настроек
          строятся временные слоты, которые жюри выбирает при одобрении заявки. Уже назначенное время
          докладов не меняется.
        </p>
        {!isCustom && (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            Сейчас используются настройки по умолчанию
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Days */}
        <div className={cardClass}>
          <h3 className={cardTitleClass}>
            <CalendarPlus className="size-4 text-[#d4a84b]" />
            Дни конференции
          </h3>
          <div className="space-y-2">
            {form.days.map((day, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-bold text-[#1a4d3e]/70">День {i + 1}</span>
                <input
                  type="date"
                  value={day}
                  onChange={(e) => set("days", form.days.map((d, j) => (j === i ? e.target.value : d)))}
                  className="admin-input flex-1 min-w-0"
                />
                <span className="hidden sm:block w-28 shrink-0 text-xs text-[#1a4d3e]/60">
                  {day ? formatDayLabel(day) : ""}
                </span>
                <button
                  type="button"
                  onClick={() => set("days", form.days.filter((_, j) => j !== i))}
                  disabled={form.days.length === 1}
                  title="Удалить день"
                  className="shrink-0 size-9 flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="admin-btn-ghost"
            onClick={() => {
              const last = form.days[form.days.length - 1];
              const next = last ? new Date(`${last}T12:00:00Z`) : new Date();
              if (last) next.setUTCDate(next.getUTCDate() + 1);
              set("days", [...form.days, next.toISOString().slice(0, 10)]);
            }}
            disabled={form.days.length >= 14}
          >
            <CalendarPlus className="size-4" /> Добавить день
          </button>
        </div>

        {/* Working hours */}
        <div className={cardClass}>
          <h3 className={cardTitleClass}>
            <Clock className="size-4 text-[#d4a84b]" />
            Время работы секций
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="admin-field">
              <span className="admin-label">Начало</span>
              <input type="time" value={form.dayStart} onChange={(e) => set("dayStart", e.target.value)} className="admin-input" />
            </label>
            <label className="admin-field">
              <span className="admin-label">Конец</span>
              <input type="time" value={form.dayEnd} onChange={(e) => set("dayEnd", e.target.value)} className="admin-input" />
            </label>
          </div>

          <div className="pt-3 border-t border-[#1a4d3e]/10 space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-[#1a4d3e] cursor-pointer">
              <input
                type="checkbox"
                checked={hasLunch}
                onChange={(e) =>
                  setForm((f) =>
                    e.target.checked
                      ? { ...f, lunchStart: "12:00", lunchEnd: "13:00" }
                      : { ...f, lunchStart: "", lunchEnd: "" }
                  )
                }
                className="size-4 accent-[#1a4d3e] cursor-pointer"
              />
              <Coffee className="size-4 text-[#d4a84b]" />
              Обеденный перерыв
            </label>
            {hasLunch && (
              <div className="grid grid-cols-2 gap-3">
                <label className="admin-field">
                  <span className="admin-label">С</span>
                  <input type="time" value={form.lunchStart} onChange={(e) => set("lunchStart", e.target.value)} className="admin-input" />
                </label>
                <label className="admin-field">
                  <span className="admin-label">До</span>
                  <input type="time" value={form.lunchEnd} onChange={(e) => set("lunchEnd", e.target.value)} className="admin-input" />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Durations */}
        <div className={cardClass}>
          <h3 className={cardTitleClass}>
            <Mic className="size-4 text-[#d4a84b]" />
            Длительность выступлений
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <label className="admin-field">
              <span className="admin-label">Обычный доклад, мин</span>
              <input
                type="number"
                min={5}
                max={60}
                value={form.talkMinutes || ""}
                onChange={(e) => set("talkMinutes", Number(e.target.value))}
                className="admin-input"
              />
            </label>
            <label className="admin-field">
              <span className="admin-label flex items-center gap-1">
                <Star className="size-3 fill-amber-500 text-amber-500" /> Ключевой, мин
              </span>
              <input
                type="number"
                min={5}
                max={90}
                value={form.keynoteMinutes || ""}
                onChange={(e) => set("keynoteMinutes", Number(e.target.value))}
                className="admin-input"
              />
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className={cardClass}>
          <h3 className={cardTitleClass}>Как это увидит жюри</h3>
          {error ? (
            <div className="admin-form-error">{error}</div>
          ) : (
            <div className="space-y-3 text-xs text-[#1a4d3e]">
              <p>
                В каждый день: <strong>{talkSlots.length}</strong> слотов по {form.talkMinutes} мин
                и <strong>{keynoteSlots.length}</strong> слотов для ключевых по {form.keynoteMinutes} мин
                {hasLunch && <> · обед {form.lunchStart}–{form.lunchEnd}</>}.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {talkSlots.map((s) => (
                  <span key={s} className="px-2 py-1 rounded-lg border border-[#1a4d3e]/15 bg-[#f5f3ed]/60 font-mono font-bold text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
        <button type="button" className="admin-btn-ghost" onClick={() => setForm(DEFAULT_SCHEDULE)}>
          <RotateCcw className="size-4" /> По умолчанию
        </button>
        <button
          type="button"
          className="admin-btn-primary"
          onClick={handleSave}
          disabled={saveMutation.isPending || !isDirty || Boolean(error)}
        >
          <Save className="size-4" /> {saveMutation.isPending ? "Сохранение..." : "Сохранить регламент"}
        </button>
      </div>
    </>
  );
}
