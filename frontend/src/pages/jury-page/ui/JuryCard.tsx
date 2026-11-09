import { useState } from "react";
import { toast } from "sonner";
import {
  Check,
  X,
  FileText,
  AlertCircle,
  Download,
  Sparkles,
  Clock,
  MapPin,
  Calendar,
  UserCheck,
  GraduationCap,
  Laptop,
  Cpu,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  School,
  Eye,
  Star,
  Trash2,
} from "lucide-react";
import { Card } from "@heroui/react";
import { useAIResultQuery, useAdminDeleteTalkMutation } from "~entities/talk/api/queries";
import { apiClient } from "~shared/lib/api/client";
import { ConfirmDeleteTalkModal } from "~shared/ui";
import type { Talk } from "~entities/talk/model/types";
import type { AIResultResponse } from "../model/types";

interface JuryCardProps {
  talk: Talk;
  onApproveClick: (talk: Talk) => void;
  onRejectClick: (talk: Talk) => void;
  onRevisionClick: (talk: Talk) => void;
  onInspectClick: (talk: Talk) => void;
}

export function JuryCard({
  talk,
  onApproveClick,
  onRejectClick,
  onRevisionClick,
  onInspectClick,
}: JuryCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const deleteMutation = useAdminDeleteTalkMutation();

  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk.id) as {
    data: AIResultResponse | undefined;
    isLoading: boolean;
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteMutation.mutateAsync(talk.id);
      toast.success("Доклад успешно удалён из базы");
      setIsConfirmDeleteOpen(false);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.error?.message ||
        (typeof err?.response?.data?.error === "string" ? err.response.data.error : null) ||
        err?.message ||
        "Не удалось удалить доклад";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const sectionTitle = talk.section?.title ?? "Без секции";
  const aiResult = ai?.result;
  const sectionFitScore = aiResult?.sectionFit?.score;
  const annotationMatchScore = aiResult?.annotationMatch?.score;
  const avgAiScore =
    sectionFitScore !== undefined
      ? Math.round((sectionFitScore + (annotationMatchScore ?? 85)) / 2)
      : annotationMatchScore ?? 85;

  const isIT = talk.sectionId === 1 || sectionTitle.toLowerCase().includes("it");
  const isEng = talk.sectionId === 2 || sectionTitle.toLowerCase().includes("инжен");
  const SectionIcon = isIT ? Laptop : isEng ? Cpu : Leaf;

  const handleDownloadDocument = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!talk.document) return;
    setIsDownloading(true);
    try {
      const response = await apiClient.get<Blob>(`/jury/talks/${talk.id}/document`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", talk.document.originalName || `talk_${talk.id}_doc.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Файл «${talk.document.originalName}» успешно скачан`);
    } catch {
      toast.error("Не удалось скачать файл. Проверьте права доступа.");
    } finally {
      setIsDownloading(false);
    }
  };

  const renderStatusBadge = () => {
    switch (talk.status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Одобрен в программу
          </span>
        );
      case "needs_revision":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="size-3.5 text-amber-600" />
            На доработке
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <X className="size-3.5 text-rose-600" />
            Отклонён
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <Clock className="size-3.5 text-amber-600" />
            Ожидает рецензии
          </span>
        );
    }
  };

  return (
    <Card className="p-0! gap-0! border border-[#1a4d3e]/15 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        {/* Header: Section + ID + Status */}
        <div className="space-y-2 pb-3 border-b border-[#1a4d3e]/10">
          <div className="flex items-start gap-2">
            <span
              className="flex-1 min-w-0 inline-flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold leading-snug text-white shadow-xs"
              style={{ backgroundColor: talk.section?.color || "#1a4d3e" }}
            >
              <SectionIcon className="size-3.5 shrink-0 mt-px" />
              <span className="min-w-0">{sectionTitle}</span>
            </span>
            <span className="shrink-0 text-xs font-mono text-muted-foreground bg-[#1a4d3e]/5 px-2 py-1 rounded-md border border-[#1a4d3e]/10">
              №{talk.id}
            </span>
          </div>
          <div>{renderStatusBadge()}</div>

          {talk.isKeynote && (
            <div className="bg-amber-100 border border-amber-300 rounded-xl px-2.5 py-1 text-xs font-extrabold text-amber-900 flex items-center justify-between shadow-2xs">
              <span className="flex items-center gap-1.5">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                <span>Ключевой доклад секции (15 мин)</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-mono bg-white/70 px-1.5 py-0.2 rounded font-bold">
                1-я очередь
              </span>
            </div>
          )}

          {talk.section?.supervisor && (
            <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 pt-0.5">
              <UserCheck className="size-3 text-[#d4a84b] shrink-0 mt-0.5" />
              <span>Ответств. за секцию: <strong className="text-[#1a4d3e]">{talk.section.supervisor}</strong></span>
            </div>
          )}
        </div>

        {/* Title and Speaker info */}
        <div>
          <h3
            onClick={() => onInspectClick(talk)}
            className="text-lg sm:text-xl font-extrabold text-[#1a4d3e] leading-snug tracking-tight hover:text-[#143d31] hover:underline cursor-pointer transition-colors"
            title="Нажмите для детального просмотра"
          >
            {talk.title}
          </h3>
          <div className="flex flex-col gap-1.5 mt-2.5 text-xs text-muted-foreground">
            <span className="flex items-start gap-1.5 text-[#1a4d3e] font-semibold">
              <GraduationCap className="size-3.5 text-[#d4a84b] shrink-0 mt-px" />
              <span>
                {talk.speakerName}
                {talk.gradeOrGroup && (
                  <span className="whitespace-nowrap font-medium text-muted-foreground"> · {talk.gradeOrGroup}</span>
                )}
              </span>
            </span>
            {talk.supervisor && (
              <span className="flex items-start gap-1.5">
                <UserCheck className="size-3.5 text-muted-foreground shrink-0 mt-px" />
                <span>
                  Науч. рук.: <span className="font-medium text-[#1a4d3e]">{talk.supervisor}</span>
                </span>
              </span>
            )}
            {talk.university && (
              <span className="flex items-start gap-1.5">
                <School className="size-3.5 text-muted-foreground shrink-0 mt-px" />
                <span>{talk.university}</span>
              </span>
            )}
          </div>
        </div>

        {/* Presentation Material Chip */}
        {talk.document ? (
          <div className="flex items-center justify-between bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileText className="size-4 text-emerald-700 shrink-0" />
              <span className="font-semibold text-emerald-950 truncate" title={talk.document.originalName}>
                {talk.document.originalName}
              </span>
              <span className="text-[11px] text-emerald-700/70 whitespace-nowrap">
                ({(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ)
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline shrink-0 cursor-pointer disabled:opacity-50 ml-2"
            >
              <Download className="size-3" />
              <span>{isDownloading ? "..." : "Скачать"}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 py-0.5">
            <AlertCircle className="size-3.5 text-muted-foreground/60" />
            Файл презентации ещё не прикреплен
          </div>
        )}

        {/* AI Analysis Summary Pill */}
        {aiLoading && (
          <div className="p-2.5 rounded-xl border border-[#1a4d3e]/10 bg-[#f5f3ed]/40 animate-pulse text-xs text-muted-foreground">
            Загрузка AI-анализа...
          </div>
        )}

        {!aiLoading && aiResult && (
          <div className="rounded-xl border border-[#1a4d3e]/15 bg-[#fbfaf7] p-2.5 flex items-center justify-between text-xs">
            <span className="font-bold text-[#1a4d3e] flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[#d4a84b]" />
              AI-оценка:
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`font-black px-2 py-0.5 rounded-md border text-xs ${
                  avgAiScore >= 75
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : avgAiScore >= 50
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-rose-700 bg-rose-50 border-rose-200"
                }`}
              >
                {avgAiScore}/100
              </span>
              {aiResult.overallVerdict && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                    aiResult.overallVerdict === "ok" || avgAiScore >= 80
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : aiResult.overallVerdict === "attention" || avgAiScore >= 55
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {aiResult.overallVerdict === "ok" || avgAiScore >= 80
                    ? "Без замечаний"
                    : aiResult.overallVerdict === "attention" || avgAiScore >= 55
                    ? "Требует внимания"
                    : "Есть замечания"}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Abstract Preview */}
        <div className="bg-[#f5f3ed]/50 p-3 rounded-xl border border-[#1a4d3e]/10">
          <p className="text-xs text-[#1a4d3e]/80 line-clamp-3 leading-relaxed">
            {talk.abstract}
          </p>
        </div>

        {/* Scheduled Slot Info if Approved */}
        {talk.status === "approved" && talk.room && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <MapPin className="size-3.5 text-emerald-600" />
              <span>{talk.room.name}</span>
            </div>
            {talk.startTime && (
              <div className="flex items-center gap-1 font-mono font-medium text-emerald-800">
                <Calendar className="size-3" />
                <span>
                  {new Date(talk.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onApproveClick(talk)}
              className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900 cursor-pointer ml-1"
            >
              Изменить слот
            </button>
          </div>
        )}

        {talk.juryComment && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 space-y-0.5">
            <span className="font-bold flex items-center gap-1">
              <MessageSquare className="size-3" />
              Замечание жюри:
            </span>
            <p className="text-amber-800 line-clamp-2">{talk.juryComment}</p>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-auto p-4 sm:p-5 pt-0 sm:pt-0 space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 min-w-0 h-10 px-3 bg-[#1a4d3e]/10 hover:bg-[#1a4d3e]/20 text-[#1a4d3e] font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#1a4d3e]/20 text-xs sm:text-sm"
            onClick={() => onInspectClick(talk)}
          >
            <Eye className="size-4 text-[#d4a84b] shrink-0" />
            <span className="truncate">Детальный просмотр</span>
          </button>

          <button
            type="button"
            className="shrink-0 size-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all cursor-pointer"
            onClick={() => onRejectClick(talk)}
            aria-label="Отклонить заявку"
            title="Отклонить заявку"
          >
            <X className="size-4" />
          </button>

          <button
            type="button"
            className="shrink-0 size-10 flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-40"
            onClick={(e) => {
              e.stopPropagation();
              setIsConfirmDeleteOpen(true);
            }}
            disabled={isDeleting}
            aria-label="Удалить доклад"
            title="Удалить доклад из базы"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="min-w-0 h-10 px-2 flex items-center justify-center gap-1.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-xs sm:text-sm"
            onClick={() => onApproveClick(talk)}
          >
            <Check className="size-4 text-[#d4a84b] shrink-0" />
            <span className="truncate">Одобрить</span>
          </button>

          <button
            type="button"
            className="min-w-0 h-10 px-2 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-all cursor-pointer text-xs sm:text-sm"
            onClick={() => onRevisionClick(talk)}
          >
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <span className="truncate">На доработку</span>
          </button>
        </div>
      </div>

      <ConfirmDeleteTalkModal
        isOpen={isConfirmDeleteOpen}
        talkTitle={talk.title}
        speakerName={talk.speakerName}
        sectionTitle={talk.section?.title}
        isPending={isDeleting}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
