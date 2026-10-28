import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@heroui/react";

interface ConfirmDeleteTalkModalProps {
  isOpen: boolean;
  talkTitle?: string;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDeleteTalkModal({
  isOpen,
  talkTitle,
  isPending = false,
  onClose,
  onConfirm,
}: ConfirmDeleteTalkModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-xl border border-rose-200 space-y-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="size-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="size-6 text-rose-600" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Удалить статью?</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Вы уверены, что хотите удалить заявку{" "}
            {talkTitle ? (
              <strong className="text-slate-900 font-semibold break-words">«{talkTitle}»</strong>
            ) : (
              "на статью"
            )}
            ? Все прикреплённые документы, результаты ИИ-проверки и рецензии жюри будут безвозвратно удалены.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Button
            type="button"
            variant="tertiary"
            onClick={onClose}
            disabled={isPending}
            className="w-full sm:w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm cursor-pointer hover:bg-slate-50 transition-colors"
          >
            Отмена
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isPending={isPending}
            className="w-full sm:w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="size-4" />
            <span>Удалить</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
