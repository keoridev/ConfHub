import { useEffect } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface ConfirmDeleteTalkModalProps {
  isOpen: boolean;
  talkTitle?: string;
  speakerName?: string;
  sectionTitle?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDeleteTalkModal({
  isOpen,
  talkTitle,
  speakerName,
  sectionTitle,
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmDeleteTalkModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="size-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="size-6 text-rose-600" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-black hover:bg-black/5 transition-colors cursor-pointer disabled:opacity-40"
            aria-label="Закрыть"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 id="delete-modal-title" className="text-xl font-black text-slate-900 tracking-tight">
            Удалить доклад из базы?
          </h3>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-1.5">
            <div className="font-bold text-slate-900 line-clamp-2">
              {talkTitle || "Доклад"}
            </div>
            {speakerName && (
              <div className="text-slate-600">
                Докладчик: <strong className="text-slate-800">{speakerName}</strong>
              </div>
            )}
            {sectionTitle && (
              <div className="text-slate-500 text-xs truncate">
                Секция: {sectionTitle}
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Внимание: это действие <strong className="text-rose-700">необратимо</strong>. Доклад будет полностью удалён из базы данных конференции, расписания, очередей рецензирования, а также будут удалены прикреплённые файлы презентации и статьи.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={isPending}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                <span>Удалить навсегда</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
