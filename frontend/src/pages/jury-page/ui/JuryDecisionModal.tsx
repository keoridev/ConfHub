import React from "react";
import { Check, X, AlertCircle, Zap, Star } from "lucide-react";
import { Button } from "@heroui/react";
import type { Room, Talk } from "~entities/talk/model/types";
import { COMMENT_PRESETS, TIME_SLOTS, KEYNOTE_SLOTS } from "../model/types";

interface JuryApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTalk: Talk | null;
  rooms: Room[];
  approveRoomId: string;
  setApproveRoomId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSlot: string;
  setSelectedSlot: (slot: string) => void;
  customStartTime: string;
  setCustomStartTime: (time: string) => void;
  setCustomEndTime: (time: string) => void;
  onConfirm: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function JuryApproveModal({
  isOpen,
  onClose,
  targetTalk,
  rooms,
  approveRoomId,
  setApproveRoomId,
  selectedDate,
  setSelectedDate,
  selectedSlot,
  setSelectedSlot,
  customStartTime,
  setCustomStartTime,
  setCustomEndTime,
  onConfirm,
  isPending,
}: JuryApproveModalProps) {
  if (!isOpen || !targetTalk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a4d3e]/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-[#1a4d3e]/20 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-7 md:p-8 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a4d3e]/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Утверждение в программу
              </span>
              {targetTalk.isKeynote && (
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 shadow-2xs">
                  <Star className="size-3 fill-amber-500 text-amber-500" />
                  <span>Ключевой доклад · 15 мин</span>
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#1a4d3e] mt-1.5 leading-snug break-words">
              {targetTalk.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Докладчик: <strong className="text-[#1a4d3e]">{targetTalk.speakerName}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] cursor-pointer shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onConfirm} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
              Аудитория проведения <span className="text-danger">*</span>
            </label>
            <select
              value={approveRoomId}
              onChange={(e) => setApproveRoomId(e.target.value)}
              className="w-full p-2.5 sm:p-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-xs sm:text-sm font-bold text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e]"
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
              Дата выступления
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { date: "2026-10-05", label: "День 1 (5 окт)" },
                { date: "2026-10-06", label: "День 2 (6 окт)" },
              ].map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(d.date)}
                  className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    selectedDate === d.date
                      ? "border-[#1a4d3e] bg-[#1a4d3e] text-white"
                      : "border-[#1a4d3e]/20 bg-[#f5f3ed]/60 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                {targetTalk.isKeynote ? "Временной слот ключевого доклада (15 минут)" : "Временной слот (регламент: 10 минут на статью)"}
              </label>
              <span className="text-[11px] text-[#d4a84b] font-bold font-mono">
                {targetTalk.isKeynote ? "⭐ 1-я очередь (15 мин)" : "10 мин / доклад"}
              </span>
            </div>

            {targetTalk.isKeynote && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <Star className="size-4 fill-amber-500 text-amber-500 shrink-0" />
                <span>
                  Это <strong>главный доклад</strong> — он открывает секцию и идёт в 1-ю очередь. Регламент выступления: <strong>15 минут</strong>.
                </span>
              </div>
            )}

            {targetTalk.isKeynote && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-[#1a4d3e] block mb-1">
                  Слоты ключевого выступления (по 15 мин):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 max-h-36 overflow-y-auto p-1.5 border border-amber-200 rounded-2xl bg-amber-50/40">
                  {KEYNOTE_SLOTS.map((slot) => {
                    const isSelected = selectedSlot === slot && !customStartTime;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setCustomStartTime("");
                          setCustomEndTime("");
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl border text-[11px] font-mono font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500 text-white shadow-xs"
                            : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                        }`}
                      >
                        ⭐ {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-[#1a4d3e] block mb-1">
                {targetTalk.isKeynote ? "Или выберите стандартный 10-минутный слот:" : "Слоты по 10 минут:"}
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-[#1a4d3e]/10 rounded-2xl bg-[#f5f3ed]/30">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot && !customStartTime;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setCustomStartTime("");
                        setCustomEndTime("");
                      }}
                      className={`p-1.5 rounded-lg border text-[11px] font-mono font-bold transition-all text-center cursor-pointer ${
                        isSelected
                          ? "border-[#1a4d3e] bg-[#1a4d3e] text-white shadow-xs"
                          : "border-[#1a4d3e]/15 bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 border-t border-[#1a4d3e]/10">
            <Button
              variant="tertiary"
              className="rounded-xl font-bold cursor-pointer text-xs sm:text-sm py-2.5"
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs sm:text-sm py-2.5 px-4"
              isPending={isPending}
            >
              <Check className="size-4 text-[#d4a84b] mr-1.5" />
              Подтвердить ({selectedSlot.split(" - ")[0]}–{selectedSlot.split(" - ")[1]})
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface JuryFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTalk: Talk | null;
  feedbackType: "needs_revision" | "rejected";
  setFeedbackType: (type: "needs_revision" | "rejected") => void;
  feedbackComment: string;
  setFeedbackComment: (comment: string) => void;
  onConfirm: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function JuryFeedbackModal({
  isOpen,
  onClose,
  targetTalk,
  feedbackType,
  setFeedbackType,
  feedbackComment,
  setFeedbackComment,
  onConfirm,
  isPending,
}: JuryFeedbackModalProps) {
  if (!isOpen || !targetTalk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a4d3e]/40 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white rounded-3xl border border-[#1a4d3e]/20 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-7 md:p-8 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a4d3e]/10">
          <div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                feedbackType === "needs_revision"
                  ? "text-amber-800 bg-amber-100 border-amber-300"
                  : "text-rose-800 bg-rose-100 border-rose-300"
              }`}
            >
              {feedbackType === "needs_revision"
                ? "Отправка на доработку"
                : "Отклонение доклада"}
            </span>
            <h3 className="text-xl font-extrabold text-[#1a4d3e] mt-1.5 leading-snug">
              {targetTalk.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={onConfirm} className="space-y-5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#f5f3ed] rounded-xl border border-[#1a4d3e]/10">
            <button
              type="button"
              onClick={() => setFeedbackType("needs_revision")}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                feedbackType === "needs_revision"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
              }`}
            >
              На доработку
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType("rejected")}
              className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                feedbackType === "rejected"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
              }`}
            >
              Отклонить заявку
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-2">
              Замечания экспертного жюри <span className="text-danger">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Опишите, что необходимо исправить автору или причину отклонения..."
              className="w-full p-3.5 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium leading-relaxed resize-y"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#1a4d3e]/70 uppercase tracking-wider block">
              Быстрые шаблоны замечаний:
            </span>
            <div className="space-y-1">
              {COMMENT_PRESETS.map((preset, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFeedbackComment(preset)}
                  className="w-full text-left p-2 rounded-lg text-xs text-[#1a4d3e] bg-[#f5f3ed]/80 hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/10 transition-colors cursor-pointer truncate flex items-center gap-1.5"
                  title={preset}
                >
                  <Zap className="size-3 text-[#d4a84b] shrink-0" />
                  <span className="truncate">{preset}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1a4d3e]/10">
            <Button
              variant="tertiary"
              className="rounded-xl font-bold cursor-pointer"
              onClick={onClose}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className={`font-bold rounded-xl text-white shadow-xs cursor-pointer ${
                feedbackType === "needs_revision"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
              isPending={isPending}
            >
              {feedbackType === "needs_revision" ? (
                <>
                  <AlertCircle className="size-4 mr-1.5" />
                  Отправить на доработку
                </>
              ) : (
                <>
                  <X className="size-4 mr-1.5" />
                  Отклонить заявку
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
