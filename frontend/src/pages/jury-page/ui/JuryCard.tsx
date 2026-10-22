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
} from "lucide-react";
import { Card, Button } from "@heroui/react";
import { useAIResultQuery } from "~entities/talk/api/queries";
import { apiClient } from "~shared/lib/api/client";
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

  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk.id) as {
    data: AIResultResponse | undefined;
    isLoading: boolean;
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
    <Card className="border border-[#1a4d3e]/15 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden flex flex-col justify-between">
      <div className="p-6 space-y-4">
        {/* Header: Section + ID + Status */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#1a4d3e]/10">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: talk.section?.color || "#1a4d3e" }}
            >
              <SectionIcon className="size-3.5" />
              {sectionTitle}
            </span>
            <span className="text-xs font-mono text-muted-foreground bg-[#1a4d3e]/5 px-2 py-0.5 rounded-md border border-[#1a4d3e]/10">
              №{talk.id}
            </span>
          </div>
          {renderStatusBadge()}
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
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 text-[#1a4d3e] font-semibold">
              <GraduationCap className="size-3.5 text-[#d4a84b]" />
              {talk.speakerName} {talk.gradeOrGroup ? `(${talk.gradeOrGroup})` : ""}
            </span>
            {talk.supervisor && (
              <span className="flex items-center gap-1">
                <UserCheck className="size-3.5 text-muted-foreground" />
                Науч. рук.: <span className="font-medium text-[#1a4d3e]">{talk.supervisor}</span>
              </span>
            )}
            {talk.university && (
              <span className="flex items-center gap-1">
                <School className="size-3.5 text-muted-foreground" />
                {talk.university}
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
      <div className="p-6 pt-0 space-y-2">
        <Button
          size="sm"
          className="w-full py-2.5 bg-[#1a4d3e]/10 hover:bg-[#1a4d3e]/20 text-[#1a4d3e] font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-[#1a4d3e]/20"
          onClick={() => onInspectClick(talk)}
        >
          <Eye className="size-4 text-[#d4a84b]" />
          <span>Детальный просмотр и экспертиза</span>
        </Button>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 py-2 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            onClick={() => onApproveClick(talk)}
          >
            <Check className="size-4 text-[#d4a84b] mr-1" />
            Одобрить
          </Button>

          <Button
            size="sm"
            className="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-all cursor-pointer"
            onClick={() => onRevisionClick(talk)}
          >
            <AlertCircle className="size-4 text-amber-600 mr-1" />
            На доработку
          </Button>

          <Button
            size="sm"
            className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all cursor-pointer"
            onClick={() => onRejectClick(talk)}
            aria-label="Отклонить заявку"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
