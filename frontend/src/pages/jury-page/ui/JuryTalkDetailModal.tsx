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
  GraduationCap,
  Laptop,
  Cpu,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Mail,
  Users,
  Tag,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useAIResultQuery } from "~entities/talk/api/queries";
import { apiClient } from "~shared/lib/api/client";
import type { Talk } from "~entities/talk/model/types";
import type { AIResultResponse } from "../model/types";

interface JuryTalkDetailModalProps {
  talk: Talk | null;
  isOpen: boolean;
  onClose: () => void;
  onApproveClick: (talk: Talk) => void;
  onRejectClick: (talk: Talk) => void;
  onRevisionClick: (talk: Talk) => void;
}

export function JuryTalkDetailModal({
  talk,
  isOpen,
  onClose,
  onApproveClick,
  onRejectClick,
  onRevisionClick,
}: JuryTalkDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk?.id ?? 0) as {
    data: AIResultResponse | undefined;
    isLoading: boolean;
  };

  if (!isOpen || !talk) return null;

  const sectionTitle = talk.section?.title ?? "Без секции";
  const aiResult = ai?.result;
  const sectionFitScore = aiResult?.sectionFit?.score;
  const annotationMatchScore = aiResult?.annotationMatch?.score;

  const isIT = talk.sectionId === 1 || sectionTitle.toLowerCase().includes("it");
  const isEng = talk.sectionId === 2 || sectionTitle.toLowerCase().includes("инжен");
  const SectionIcon = isIT ? Laptop : isEng ? Cpu : Leaf;

  const handleDownload = async () => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a4d3e]/50 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl border border-[#1a4d3e]/20 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#1a4d3e]/10 bg-gradient-to-r from-[#fbfaf7] to-white flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: talk.section?.color || "#1a4d3e" }}
              >
                <SectionIcon className="size-3.5" />
                {sectionTitle}
              </span>
              <span className="text-xs font-mono text-muted-foreground bg-[#1a4d3e]/5 px-2 py-0.5 rounded-md border border-[#1a4d3e]/10">
                Заявка №{talk.id}
              </span>
              {talk.status === "approved" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Одобрен в программу
                </span>
              )}
              {talk.status === "needs_revision" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <AlertTriangle className="size-3.5 text-amber-600" />
                  На доработке
                </span>
              )}
              {talk.status === "rejected" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <X className="size-3.5 text-rose-600" />
                  Отклонён
                </span>
              )}
              {(!talk.status || talk.status === "pending_review") && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                  <Clock className="size-3.5 text-amber-600" />
                  Ожидает экспертизы
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1a4d3e] leading-snug tracking-tight">
              {talk.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-9 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] transition-colors cursor-pointer shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Speaker Profile Card */}
          <div className="bg-[#f5f3ed]/60 rounded-2xl p-4 sm:p-5 border border-[#1a4d3e]/15 space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a4d3e] flex items-center gap-1.5">
              <GraduationCap className="size-4 text-[#d4a84b]" />
              Докладчик и научный руководитель
            </h4>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#1a4d3e]/10">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Докладчик:</span>
                <p className="font-bold text-[#1a4d3e] text-sm">{talk.speakerName}</p>
                {talk.gradeOrGroup && (
                  <span className="text-muted-foreground text-[11px]">Группа: {talk.gradeOrGroup}</span>
                )}
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#1a4d3e]/10">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Научный руководитель:</span>
                <p className="font-bold text-[#1a4d3e] text-sm">{talk.supervisor || "Не указан"}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#1a4d3e]/10">
                <span className="text-muted-foreground block text-[11px] mb-0.5">Университет / Контакты:</span>
                <p className="font-semibold text-[#1a4d3e] truncate">{talk.university || "—"}</p>
                {talk.authorEmail && (
                  <p className="text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                    <span>{talk.authorEmail}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Co-Authors if exist */}
            {talk.coAuthors && talk.coAuthors.length > 0 && (
              <div className="pt-2 border-t border-[#1a4d3e]/10 text-xs">
                <span className="text-muted-foreground flex items-center gap-1 font-semibold mb-1">
                  <Users className="size-3.5 text-muted-foreground" />
                  Соавторы доклада:
                </span>
                <p className="font-medium text-[#1a4d3e] bg-white p-2.5 rounded-xl border border-[#1a4d3e]/10">
                  {talk.coAuthors.join(", ")}
                </p>
              </div>
            )}

            {/* Keywords */}
            {talk.keywords && talk.keywords.length > 0 && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground flex items-center gap-1 mr-1">
                  <Tag className="size-3 text-muted-foreground" />
                  Ключевые слова:
                </span>
                {talk.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-white text-[#1a4d3e] rounded-md border border-[#1a4d3e]/10 text-[11px] font-medium"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Attached Document Download Box */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a4d3e] flex items-center gap-1.5">
              <FileText className="size-4 text-[#d4a84b]" />
              Прикреплённые материалы работы
            </h4>
            {talk.document ? (
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileText className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1a4d3e] text-sm truncate" title={talk.document.originalName}>
                      {talk.document.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ • Формат документа проверен
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  isDisabled={isDownloading}
                  className="px-4 py-2.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs shrink-0"
                >
                  <Download className="size-4 text-[#d4a84b]" />
                  <span>{isDownloading ? "Загрузка..." : "Скачать для экспертизы"}</span>
                </Button>
              </div>
            ) : (
              <div className="bg-[#f5f3ed]/60 border border-dashed border-[#1a4d3e]/20 rounded-2xl p-4 text-xs text-muted-foreground flex items-center gap-2">
                <AlertCircle className="size-4 text-muted-foreground/60" />
                <span>Автор не прикрепил файл презентации или статьи к заявке (поданы только тезисы).</span>
              </div>
            )}
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a4d3e]">
              Аннотация и тезисы доклада:
            </h4>
            <div className="bg-[#f5f3ed]/40 border border-[#1a4d3e]/15 rounded-2xl p-5 text-xs sm:text-sm text-[#1a4d3e] leading-relaxed whitespace-pre-wrap font-medium">
              {talk.abstract}
            </div>
          </div>

          {/* AI Analysis Detailed Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#1a4d3e] flex items-center gap-1.5">
                <Sparkles className="size-4 text-[#d4a84b]" />
                Результаты предварительной AI-экспертизы:
              </h4>
              <span className="text-[11px] font-semibold text-[#1a4d3e]/70 bg-[#1a4d3e]/5 border border-[#1a4d3e]/10 px-2.5 py-0.5 rounded-full">
                Экспресс-анализ ConfHub
              </span>
            </div>

            {aiLoading && (
              <div className="p-6 rounded-2xl border border-[#1a4d3e]/15 bg-[#f5f3ed]/30 animate-pulse text-center text-xs text-muted-foreground">
                Загрузка подробного AI-отчёта...
              </div>
            )}

            {!aiLoading && !aiResult && (
              <div className="p-4 rounded-2xl border border-dashed border-[#1a4d3e]/20 bg-[#f5f3ed]/30 text-xs text-muted-foreground">
                AI-экспертиза для этой работы ещё не запускалась докладчиком.
              </div>
            )}

            {!aiLoading && aiResult && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div
                    className={`p-4 rounded-2xl border ${
                      (sectionFitScore ?? 0) >= 70
                        ? "bg-emerald-50/60 border-emerald-200"
                        : (sectionFitScore ?? 0) >= 50
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-rose-50/60 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                        Соответствие секции
                      </span>
                      <span
                        className={`text-lg font-black ${
                          (sectionFitScore ?? 0) >= 70
                            ? "text-emerald-800"
                            : (sectionFitScore ?? 0) >= 50
                            ? "text-amber-800"
                            : "text-rose-800"
                        }`}
                      >
                        {sectionFitScore ?? 0}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {aiResult.sectionFit?.comment || "Оценка темы"}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-2xl border ${
                      (annotationMatchScore ?? 0) >= 70
                        ? "bg-emerald-50/60 border-emerald-200"
                        : (annotationMatchScore ?? 0) >= 50
                        ? "bg-amber-50/60 border-amber-200"
                        : "bg-rose-50/60 border-rose-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                        Соответствие аннотации
                      </span>
                      <span
                        className={`text-lg font-black ${
                          (annotationMatchScore ?? 0) >= 70
                            ? "text-emerald-800"
                            : (annotationMatchScore ?? 0) >= 50
                            ? "text-amber-800"
                            : "text-rose-800"
                        }`}
                      >
                        {annotationMatchScore ?? 85}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {aiResult.annotationMatch?.comment || "Оценка тезисов"}
                    </p>
                  </div>
                </div>

                {aiResult.issues && aiResult.issues.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-amber-900">
                      <AlertCircle className="size-4 text-amber-600" />
                      Выявленные замечания:
                    </span>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-[#1a4d3e]/90">
                      {aiResult.issues.map((iss, i) => (
                        <li key={i}>{iss.description}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                  <div className="bg-white border border-[#1a4d3e]/15 rounded-2xl p-4 text-xs text-[#1a4d3e] space-y-1.5">
                    <span className="font-bold block text-[#1a4d3e]">
                      Рекомендации по улучшению:
                    </span>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-muted-foreground">
                      {aiResult.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Schedule & Room if Approved */}
          {talk.status === "approved" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <MapPin className="size-4 text-emerald-600" />
                <span>{talk.room?.name || "Аудитория назначена"}</span>
              </div>
              {talk.startTime && (
                <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-bold">
                  <Calendar className="size-3.5 text-emerald-600" />
                  <span>
                    {new Date(talk.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {talk.endTime &&
                      ` – ${new Date(talk.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onApproveClick(talk);
                }}
                className="text-xs font-bold text-emerald-700 underline hover:text-emerald-900 ml-auto cursor-pointer"
              >
                Изменить время/зал
              </button>
            </div>
          )}

          {/* Jury Comment if exists */}
          {talk.juryComment && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <MessageSquare className="size-3.5" />
                Замечания эксперта комиссии:
              </span>
              <p className="text-amber-800 leading-relaxed">{talk.juryComment}</p>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="p-3.5 sm:p-5 border-t border-[#1a4d3e]/10 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <Button
            variant="tertiary"
            onClick={onClose}
            className="rounded-xl font-bold text-xs cursor-pointer order-last sm:order-first py-2 sm:py-2.5"
          >
            Закрыть досье
          </Button>

          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              className="py-2 sm:py-2.5 px-2 sm:px-4 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
              onClick={() => {
                onClose();
                onApproveClick(talk);
              }}
            >
              <Check className="size-3.5 sm:size-4 text-[#d4a84b] mr-1 shrink-0" />
              <span className="truncate">Одобрить</span>
            </Button>

            <Button
              size="sm"
              className="py-2 sm:py-2.5 px-2 sm:px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-all cursor-pointer text-xs"
              onClick={() => {
                onClose();
                onRevisionClick(talk);
              }}
            >
              <AlertCircle className="size-3.5 sm:size-4 text-amber-600 mr-1 shrink-0" />
              <span className="truncate">Доработка</span>
            </Button>

            <Button
              size="sm"
              className="py-2 sm:py-2.5 px-2 sm:px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all cursor-pointer text-xs"
              onClick={() => {
                onClose();
                onRejectClick(talk);
              }}
            >
              <X className="size-3.5 sm:size-4 mr-1 shrink-0" />
              <span className="truncate">Отклонить</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
