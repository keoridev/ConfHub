import React from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Trash2,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import { Card, Chip } from "@heroui/react";
import type { Talk } from "~entities/talk/model/types";
import { getSectionMeta } from "~shared/lib";

interface MyActiveSubmissionsListProps {
  talks: Talk[];
  activeTalkId: number | null;
  onSelectTalk: (talkId: number) => void;
  onDeleteClick: (talk: Talk) => void;
  onNewSubmission: () => void;
}

export function MyActiveSubmissionsList({
  talks,
  activeTalkId,
  onSelectTalk,
  onDeleteClick,
  onNewSubmission,
}: MyActiveSubmissionsListProps) {
  if (talks.length === 0) return null;

  return (
    <Card className="border border-[#1a4d3e]/20 bg-white p-5 sm:p-7 rounded-3xl shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1a4d3e]/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#1a4d3e]" />
            <h3 className="text-base font-bold text-[#1a4d3e]">
              Ваши действующие заявки ({talks.length})
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Здесь отображаются все ваши поданные материалы. Вы можете открыть любую заявку или удалить её.
          </p>
        </div>
        <button
          type="button"
          onClick={onNewSubmission}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a4d3e]/10 hover:bg-[#1a4d3e] text-[#1a4d3e] hover:text-white text-xs font-bold transition-all cursor-pointer"
        >
          <PlusCircle className="size-4" />
          <span>Подать новую статью</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {talks.map((t) => {
          const sectionTitle = t.section?.title || "Секция";
          const meta = getSectionMeta(sectionTitle);
          const SectionIcon = meta.icon;
          const isCurrentActive = activeTalkId === t.id;

          let statusBadge = (
            <Chip color="default" variant="secondary" className="text-xs">
              Черновик
            </Chip>
          );
          if (t.status === "approved") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Одобрено жюри
              </span>
            );
          } else if (t.status === "pending_review") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="size-3.5 text-amber-600" />
                На рассмотрении жюри
              </span>
            );
          } else if (t.status === "needs_revision") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                <AlertCircle className="size-3.5 text-orange-600" />
                Требует доработки
              </span>
            );
          } else if (t.status === "rejected") {
            statusBadge = (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                <XCircle className="size-3.5 text-rose-600" />
                Отклонено
              </span>
            );
          }

          return (
            <div
              key={t.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isCurrentActive
                  ? "border-[#1a4d3e] bg-[#1a4d3e]/5 ring-2 ring-[#1a4d3e]/20"
                  : "border-[#1a4d3e]/15 bg-[#f5f3ed]/30 hover:border-[#1a4d3e]/30 hover:bg-white"
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg text-white"
                    style={{ backgroundColor: meta.bgColor || "#1a4d3e" }}
                  >
                    <SectionIcon className="size-3" />
                    <span className="truncate max-w-[260px]">{meta.shortTitle || sectionTitle}</span>
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">ID #{t.id}</span>
                  {statusBadge}
                </div>

                <h4 className="text-sm font-bold text-[#1a4d3e] leading-snug line-clamp-2">
                  {t.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {t.document && (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                      <FileText className="size-3.5 text-[#1a4d3e]" />
                      <span className="truncate max-w-[180px]">{t.document.originalName}</span>
                    </span>
                  )}
                  {t.createdAt && (
                    <span>
                      Подано: {new Date(t.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => onSelectTalk(t.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrentActive
                      ? "bg-[#1a4d3e] text-white shadow-xs"
                      : "bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                  }`}
                >
                  <ExternalLink className="size-3.5" />
                  <span>{isCurrentActive ? "Выбрана" : "Открыть"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteClick(t)}
                  title="Удалить заявку"
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="size-3.5" />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
