import { useState, useMemo } from "react";
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
  Search,
  User as UserIcon,
  UserCheck,
  GraduationCap,
  Laptop,
  Cpu,
  Leaf,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  LogIn,
  Lock,
  Eye,
  EyeOff,
  MessageSquare,
  Building2,
} from "lucide-react";

import {
  useReviewTalkMutation,
  useJuryQueueQuery,
  useAIResultQuery,
  useRoomsQuery,
  useSectionsQuery,
  useCurrentUserQuery,
  useLoginMutation,
} from "~entities/talk/api/queries";
import { apiClient } from "~shared/lib/api/client";
import type { Talk } from "~entities/talk/model/types";
import { Card, Chip, Button } from "@heroui/react";

interface AIResultData {
  sectionFit?: { score: number; verdict: string; comment: string };
  annotationMatch?: { score: number; verdict: string; comment: string };
  issues?: Array<{ type: string; severity: string; description: string }>;
  suggestions?: string[];
  overallVerdict?: string;
}

interface AIResultResponse {
  id: number;
  talkId: number;
  attemptNo: number;
  result: AIResultData;
  model: string;
}

// =========================================================================
// КАРТОЧКА ДОКЛАДА В ОЧЕРЕДИ ЖЮРИ
// =========================================================================
function JuryCard({
  talk,
  onApproveClick,
  onRejectClick,
  onRevisionClick,
}: {
  talk: Talk;
  onApproveClick: (talk: Talk) => void;
  onRejectClick: (talk: Talk) => void;
  onRevisionClick: (talk: Talk) => void;
}) {
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk.id) as {
    data: AIResultResponse | undefined;
    isLoading: boolean;
  };

  const sectionTitle = talk.section?.title ?? "Без секции";
  const aiResult = ai?.result;
  const sectionFitScore = aiResult?.sectionFit?.score;
  const annotationMatchScore = aiResult?.annotationMatch?.score;

  // Иконка секции
  const isIT = talk.sectionId === 1 || sectionTitle.toLowerCase().includes("it");
  const isEng = talk.sectionId === 2 || sectionTitle.toLowerCase().includes("инжен");
  const SectionIcon = isIT ? Laptop : isEng ? Cpu : Leaf;

  // Скачивание файла с Bearer-токеном
  const handleDownloadDocument = async () => {
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

  // Статус бейдж
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
    <Card className="border border-[#1a4d3e]/15 bg-white shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl overflow-hidden">
      <div className="p-6 space-y-5">
        {/* Верхняя строка: Секция, ID и статус */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-[#1a4d3e]/10">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: talk.section?.color || "#1a4d3e" }}
            >
              <SectionIcon className="size-3.5" />
              {sectionTitle}
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              №{talk.id}
            </span>
          </div>
          {renderStatusBadge()}
        </div>

        {/* Название доклада */}
        <div>
          <h3 className="text-xl font-extrabold text-[#1a4d3e] leading-snug tracking-tight">
            {talk.title}
          </h3>
          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-muted-foreground">
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
          </div>
        </div>

        {/* Текст аннотации */}
        <div className="bg-[#f5f3ed]/60 rounded-xl p-4 border border-[#1a4d3e]/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#1a4d3e]">
            <span>Аннотация доклада:</span>
            <button
              type="button"
              onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
              className="text-[#1a4d3e]/70 hover:text-[#1a4d3e] flex items-center gap-1 font-medium cursor-pointer"
            >
              {isAbstractExpanded ? (
                <>
                  Свернуть <ChevronUp className="size-3.5" />
                </>
              ) : (
                <>
                  Развернуть <ChevronDown className="size-3.5" />
                </>
              )}
            </button>
          </div>
          <p
            className={`text-sm text-[#1a4d3e]/85 leading-relaxed ${
              isAbstractExpanded ? "" : "line-clamp-3"
            }`}
          >
            {talk.abstract}
          </p>
        </div>

        {/* Прикреплённый документ */}
        {talk.document ? (
          <div className="flex items-center justify-between bg-white rounded-xl p-3 border border-[#1a4d3e]/20 shadow-2xs">
            <div className="flex items-center gap-3 truncate">
              <div className="size-9 rounded-lg bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center shrink-0">
                <FileText className="size-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#1a4d3e] truncate" title={talk.document.originalName}>
                  {talk.document.originalName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ •{" "}
                  {talk.document.originalName.endsWith(".docx") || talk.document.originalName.endsWith(".doc")
                    ? "Документ Word"
                    : "Документ PDF"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadDocument}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Download className="size-3.5" />
              <span>{isDownloading ? "Загрузка..." : "Скачать"}</span>
            </button>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic flex items-center gap-1.5 py-1">
            <AlertCircle className="size-3.5 text-muted-foreground/60" />
            Файл доклада ещё не прикреплён автором
          </div>
        )}

        {/* Блок результатов AI-анализа */}
        {aiLoading && (
          <div className="p-4 rounded-xl border border-[#1a4d3e]/10 bg-[#f5f3ed]/40 animate-pulse space-y-2">
            <div className="h-3 w-1/3 bg-[#1a4d3e]/10 rounded" />
            <div className="h-4 w-full bg-[#1a4d3e]/10 rounded" />
          </div>
        )}

        {!aiLoading && !aiResult && (
          <div className="rounded-xl border border-[#1a4d3e]/15 bg-[#f5f3ed]/50 p-3 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-[#1a4d3e]/80">
              <Sparkles className="size-3.5 text-[#d4a84b]" />
              AI-экспресс-анализ: не проводился (прямая подача без отчёта)
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground bg-white px-2 py-0.5 rounded-md border border-[#1a4d3e]/10">
              Без AI-отчёта
            </span>
          </div>
        )}

        {aiResult && (
          <div className="rounded-2xl border border-[#1a4d3e]/15 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#1a4d3e] flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#d4a84b]" />
                Результат анализа Gemini AI
              </span>
              {aiResult.overallVerdict && (
                <Chip
                  size="sm"
                  color={
                    aiResult.overallVerdict === "ok"
                      ? "success"
                      : aiResult.overallVerdict === "attention"
                      ? "warning"
                      : "danger"
                  }
                  variant="soft"
                >
                  {aiResult.overallVerdict === "ok"
                    ? "Всё в норме"
                    : aiResult.overallVerdict === "attention"
                    ? "Требует внимания"
                    : "Есть замечания"}
                </Chip>
              )}
            </div>

            {/* Метрики AI */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={`p-2.5 rounded-xl border ${
                  (sectionFitScore ?? 0) >= 70
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-amber-50/60 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1a4d3e]/80">Секция</span>
                  <span className="text-xs font-extrabold text-[#1a4d3e]">{sectionFitScore ?? 0}/100</span>
                </div>
                {aiResult.sectionFit?.comment && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {aiResult.sectionFit.comment}
                  </p>
                )}
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  (annotationMatchScore ?? 0) >= 70
                    ? "bg-emerald-50/60 border-emerald-200"
                    : "bg-amber-50/60 border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#1a4d3e]/80">Аннотация</span>
                  <span className="text-xs font-extrabold text-[#1a4d3e]">{annotationMatchScore ?? 0}/100</span>
                </div>
                {aiResult.annotationMatch?.comment && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {aiResult.annotationMatch.comment}
                  </p>
                )}
              </div>
            </div>

            {/* Предложения по улучшению */}
            {aiResult.suggestions && aiResult.suggestions.length > 0 && (
              <div className="text-[11px] text-[#1a4d3e]/80 bg-[#f5f3ed]/60 p-2.5 rounded-xl">
                <span className="font-bold block mb-1">Рекомендации AI:</span>
                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                  {aiResult.suggestions.slice(0, 2).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Если доклад уже одобрен — выводим детали расписания */}
        {talk.status === "approved" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold">
              <MapPin className="size-4 text-emerald-600" />
              <span>{talk.room?.name || "Аудитория назначена"}</span>
            </div>
            {talk.startTime && (
              <div className="flex items-center gap-1.5 text-emerald-800 font-mono">
                <Calendar className="size-3.5 text-emerald-600" />
                <span>
                  {new Date(talk.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {talk.endTime && ` – ${new Date(talk.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => onApproveClick(talk)}
              className="text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900 ml-auto cursor-pointer"
            >
              Изменить время/зал
            </button>
          </div>
        )}

        {/* Комментарий жюри при наличии */}
        {talk.juryComment && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              Комментарий жюри:
            </span>
            <p className="text-amber-800">{talk.juryComment}</p>
          </div>
        )}

        {/* Кнопки принятия решений жюри */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 py-2.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            onClick={() => onApproveClick(talk)}
          >
            <Check className="size-4 text-[#d4a84b] mr-1" />
            Одобрить доклад
          </Button>

          <Button
            size="sm"
            className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold rounded-xl transition-all cursor-pointer"
            onClick={() => onRevisionClick(talk)}
          >
            <AlertCircle className="size-4 text-amber-600 mr-1" />
            На доработку
          </Button>

          <Button
            size="sm"
            className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl transition-all cursor-pointer"
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

// =========================================================================
// ОСНОВНАЯ СТРАНИЦА ЖЮРИ
// =========================================================================
export function JuryPage() {
  const { data: user } = useCurrentUserQuery();
  const loginMutation = useLoginMutation();

  // Состояние входа для неавторизованных
  const [authLogin, setAuthLogin] = useState("jury1");
  const [authPassword, setAuthPassword] = useState("jury123");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Табы фильтрации очереди: pending_review, approved, needs_revision, rejected
  const [activeTab, setActiveTab] = useState<"pending_review" | "approved" | "needs_revision" | "rejected">("pending_review");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Запросы данных
  const { data: talks = [], isLoading } = useJuryQueueQuery(1, activeTab);
  const { data: rooms = [] } = useRoomsQuery();
  const { data: sections = [] } = useSectionsQuery();

  const reviewMutation = useReviewTalkMutation();

  // Состояние модалок
  const [targetTalk, setTargetTalk] = useState<Talk | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<"needs_revision" | "rejected">("needs_revision");

  // Поля модалки одобрения
  const [approveRoomId, setApproveRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-10-05");
  const [selectedSlot, setSelectedSlot] = useState("10:00 - 10:30");
  const [customStartTime, setCustomStartTime] = useState("");
  const [customEndTime, setCustomEndTime] = useState("");

  // Поля модалки доработки / отклонения
  const [feedbackComment, setFeedbackComment] = useState("");

  // Вход эксперта жюри
  const handleJuryLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const data = await loginMutation.mutateAsync({
        login: authLogin,
        password: authPassword,
      });
      toast.success(`Вход выполнен: ${data.user.fullName || data.user.login}`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Неверный логин или пароль жюри";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  const handleQuickJuryLogin = async (quickLogin: string, quickPass: string) => {
    setAuthLogin(quickLogin);
    setAuthPassword(quickPass);
    setAuthError(null);
    try {
      const data = await loginMutation.mutateAsync({
        login: quickLogin,
        password: quickPass,
      });
      toast.success(`Вы вошли как ${data.user.fullName || data.user.login}`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Неверный логин или пароль";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  // Открытие модалки одобрения
  const handleOpenApprove = (talk: Talk) => {
    setTargetTalk(talk);
    setApproveRoomId(talk.room?.id ? String(talk.room.id) : rooms[0]?.id ? String(rooms[0].id) : "1");
    setSelectedDate("2026-10-05");
    setSelectedSlot("10:00 - 10:30");
    setIsApproveModalOpen(true);
  };

  // Подтверждение одобрения
  const handleConfirmApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTalk) return;

    if (!approveRoomId) {
      toast.error("Выберите аудиторию");
      return;
    }

    // Собираем ISO время из выбранного дня и слота
    let startIso = "";
    let endIso = "";

    if (customStartTime && customEndTime) {
      startIso = new Date(customStartTime).toISOString();
      endIso = new Date(customEndTime).toISOString();
    } else {
      const [startH, endH] = selectedSlot.split(" - ");
      startIso = new Date(`${selectedDate}T${startH}:00+06:00`).toISOString();
      endIso = new Date(`${selectedDate}T${endH}:00+06:00`).toISOString();
    }

    try {
      await reviewMutation.mutateAsync({
        id: targetTalk.id,
        data: {
          status: "approved",
          roomId: Number(approveRoomId),
          startTime: startIso,
          endTime: endIso,
        },
      });
      toast.success(`Доклад «${targetTalk.title}» одобрен и добавлен в расписание!`);
      setIsApproveModalOpen(false);
      setTargetTalk(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Ошибка утверждения доклада");
    }
  };

  // Открытие модалки доработки / отклонения
  const handleOpenFeedback = (talk: Talk, type: "needs_revision" | "rejected") => {
    setTargetTalk(talk);
    setFeedbackType(type);
    setFeedbackComment("");
    setIsFeedbackModalOpen(true);
  };

  // Подтверждение доработки / отклонения
  const handleConfirmFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTalk) return;

    if (!feedbackComment.trim()) {
      toast.error("Укажите причину или замечания для автора");
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: targetTalk.id,
        data: {
          status: feedbackType,
          juryComment: feedbackComment.trim(),
        },
      });
      if (feedbackType === "needs_revision") {
        toast.info(`Заявка «${targetTalk.title}» отправлена автору на доработку`);
      } else {
        toast.error(`Заявка «${targetTalk.title}» отклонена`);
      }
      setIsFeedbackModalOpen(false);
      setTargetTalk(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Ошибка обновления статуса заявки");
    }
  };

  // Быстрые шаблоны замечаний
  const commentPresets = [
    "Дополнить аннотацию описанием методов исследования и конкретными результатами.",
    "Уточнить соответствие темы профилю и задачам выбранной секции.",
    "Проверить форматирование и библиографический список в файле работы.",
    "Тема доклада не соответствует научным направлениям данной конференции.",
  ];

  // Временные слоты
  const timeSlots = [
    "10:00 - 10:30",
    "10:30 - 11:00",
    "11:00 - 11:30",
    "11:30 - 12:00",
    "14:00 - 14:30",
    "14:30 - 15:00",
    "15:00 - 15:30",
    "15:30 - 16:00",
  ];

  // Фильтрация докладов
  const filteredTalks = useMemo(() => {
    return talks.filter((t) => {
      // Секция
      const secId = t.sectionId ?? t.section?.id;
      if (selectedSectionId !== "all" && String(secId) !== selectedSectionId) {
        return false;
      }
      // Поиск
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSpeaker = t.speakerName.toLowerCase().includes(q);
        const matchSupervisor = (t.supervisor || "").toLowerCase().includes(q);
        const matchAbstract = t.abstract.toLowerCase().includes(q);
        if (!matchTitle && !matchSpeaker && !matchSupervisor && !matchAbstract) {
          return false;
        }
      }
      return true;
    });
  }, [talks, selectedSectionId, searchQuery]);

  return (
    <div className="min-h-screen bg-[#f5f3ed] -mx-4 -my-6 md:-mx-8 md:-my-10 pb-20">
      {/* Шапка кабинета жюри */}
      <div className="bg-[#1a4d3e] text-white py-10 px-4 md:px-8 border-b border-[#1a4d3e]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#f5f3ed]/15 text-[#f5f3ed] tracking-wider uppercase">
              <Sparkles className="size-3.5 text-[#d4a84b]" />
              Экспертный комитет 2026
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Кабинет экспертного жюри
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-2xl">
              Рецензирование заявок, проверка рекомендаций Gemini AI и назначение докладов в расписание аудиторий.
            </p>
          </div>

          {user && (user.role === "jury" || user.role === "admin") && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 flex items-center gap-3.5">
              <div className="size-11 rounded-xl bg-[#d4a84b] text-[#1a4d3e] flex items-center justify-center font-black text-base shadow-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : "Ж"}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{user.fullName || user.login}</p>
                <p className="text-xs text-white/70">
                  {user.role === "admin" ? "Оргкомитет (Администратор)" : "Эксперт комиссии жюри"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* =========================================================================
            1. ЕСЛИ НЕ АВТОРИЗОВАН КАК ЖЮРИ — БЛОК БЫСТРОГО ВХОДА
           ========================================================================= */}
        {(!user || (user.role !== "jury" && user.role !== "admin")) && (
          <div className="max-w-xl mx-auto">
            <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 shadow-md rounded-3xl space-y-6">
              <div className="text-center space-y-2">
                <div className="size-12 rounded-2xl bg-[#1a4d3e] text-[#d4a84b] flex items-center justify-center mx-auto shadow-xs">
                  <Building2 className="size-6" />
                </div>
                <h2 className="text-2xl font-bold text-[#1a4d3e]">Вход для жюри</h2>
                <p className="text-sm text-muted-foreground">
                  Доступ к рецензированию заявок и составлению расписания имеют члены экспертного жюри и оргкомитет.
                </p>
              </div>

              {/* Быстрые аккаунты для тестирования */}
              <div className="p-4 rounded-2xl bg-[#f5f3ed] border border-[#1a4d3e]/15 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/70">
                  Быстрый вход для проверки:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickJuryLogin("jury1", "jury123")}
                    disabled={loginMutation.isPending}
                    className="p-2.5 rounded-xl border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e] hover:text-white transition-all text-left cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-[#1a4d3e] group-hover:text-white block">
                      jury1 (Жюри 1)
                    </span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-white/80 block">
                      Эксперт секции IT
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickJuryLogin("jury2", "jury123")}
                    disabled={loginMutation.isPending}
                    className="p-2.5 rounded-xl border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e] hover:text-white transition-all text-left cursor-pointer group"
                  >
                    <span className="text-xs font-bold text-[#1a4d3e] group-hover:text-white block">
                      jury2 (Жюри 2)
                    </span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-white/80 block">
                      Эксперт секции Экология
                    </span>
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Форма ручного входа */}
              <form onSubmit={handleJuryLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                    Логин эксперта
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <UserIcon className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={authLogin}
                      onChange={(e) => setAuthLogin(e.target.value)}
                      placeholder="jury1"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-1.5">
                    Пароль
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                      <Lock className="size-4" />
                    </div>
                    <input
                      type={showAuthPassword ? "text" : "password"}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e]"
                    >
                      {showAuthPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl transition-all cursor-pointer"
                  isPending={loginMutation.isPending}
                >
                  <LogIn className="size-4 text-[#d4a84b] mr-1.5" />
                  Войти как эксперт жюри
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* =========================================================================
            2. РАБОЧАЯ ОБЛАСТЬ ЖЮРИ (ДЛЯ АВТОРИЗОВАННЫХ ЭКСПЕРТОВ)
           ========================================================================= */}
        {user && (user.role === "jury" || user.role === "admin") && (
          <div className="space-y-6">
            {/* Панель табов статуса */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#1a4d3e]/15 pb-4">
              <button
                type="button"
                onClick={() => setActiveTab("pending_review")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "pending_review"
                    ? "bg-[#1a4d3e] text-white shadow-sm"
                    : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
                }`}
              >
                <Clock className="size-4 text-[#d4a84b]" />
                <span>На рассмотрении</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "pending_review" ? "bg-white/20 text-white" : "bg-[#1a4d3e]/10 text-[#1a4d3e]"}`}>
                  {activeTab === "pending_review" ? talks.length : "•"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("approved")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "approved"
                    ? "bg-[#1a4d3e] text-white shadow-sm"
                    : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
                }`}
              >
                <CheckCircle2 className="size-4 text-emerald-400" />
                <span>Одобренные</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "approved" ? "bg-white/20 text-white" : "bg-[#1a4d3e]/10 text-[#1a4d3e]"}`}>
                  {activeTab === "approved" ? talks.length : "•"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("needs_revision")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "needs_revision"
                    ? "bg-[#1a4d3e] text-white shadow-sm"
                    : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
                }`}
              >
                <AlertCircle className="size-4 text-amber-400" />
                <span>На доработке</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "needs_revision" ? "bg-white/20 text-white" : "bg-[#1a4d3e]/10 text-[#1a4d3e]"}`}>
                  {activeTab === "needs_revision" ? talks.length : "•"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("rejected")}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === "rejected"
                    ? "bg-[#1a4d3e] text-white shadow-sm"
                    : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
                }`}
              >
                <X className="size-4 text-rose-400" />
                <span>Отклонённые</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "rejected" ? "bg-white/20 text-white" : "bg-[#1a4d3e]/10 text-[#1a4d3e]"}`}>
                  {activeTab === "rejected" ? talks.length : "•"}
                </span>
              </button>
            </div>

            {/* Фильтры и поиск */}
            <div className="bg-white rounded-2xl p-4 border border-[#1a4d3e]/15 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Поле поиска */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40">
                  <Search className="size-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по названию темы, докладчику или руководителю..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#f5f3ed]/60 border border-[#1a4d3e]/20 text-sm text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Фильтр по секциям */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedSectionId("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSectionId === "all"
                      ? "bg-[#1a4d3e] text-white"
                      : "bg-[#f5f3ed] text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                  }`}
                >
                  Все секции
                </button>
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSectionId(String(s.id))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedSectionId === String(s.id)
                        ? "bg-[#1a4d3e] text-white"
                        : "bg-[#f5f3ed] text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                    }`}
                  >
                    <span className="size-2 rounded-full" style={{ backgroundColor: s.color || "#1a4d3e" }} />
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Состояние загрузки */}
            {isLoading && (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-[#1a4d3e]/10 shadow-xs animate-pulse space-y-4">
                    <div className="h-5 w-1/3 bg-[#1a4d3e]/10 rounded" />
                    <div className="h-6 w-3/4 bg-[#1a4d3e]/10 rounded" />
                    <div className="h-16 w-full bg-[#1a4d3e]/10 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Пустой список */}
            {!isLoading && filteredTalks.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-[#1a4d3e]/20 p-12 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center mx-auto">
                  <Check className="size-6 text-[#d4a84b]" />
                </div>
                <h3 className="text-lg font-bold text-[#1a4d3e]">Заявок в этой категории не найдено</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery
                    ? `По запросу «${searchQuery}» ничего не найдено. Попробуйте изменить параметры поиска.`
                    : activeTab === "pending_review"
                    ? "Все поступившие заявки были рассмотрены экспертной комиссией."
                    : "В данном статусе пока нет докладов."}
                </p>
                {searchQuery && (
                  <Button
                    size="sm"
                    className="bg-[#1a4d3e] text-white font-bold rounded-xl mt-2 cursor-pointer"
                    onClick={() => setSearchQuery("")}
                  >
                    Сбросить поиск
                  </Button>
                )}
              </div>
            )}

            {/* Сетка карточек докладов */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTalks.map((talk) => (
                <JuryCard
                  key={talk.id}
                  talk={talk}
                  onApproveClick={handleOpenApprove}
                  onRejectClick={(t) => handleOpenFeedback(t, "rejected")}
                  onRevisionClick={(t) => handleOpenFeedback(t, "needs_revision")}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          МОДАЛКА 1: НАЗНАЧЕНИЕ АУДИТОРИИ И ВРЕМЕНИ (ОДОБРЕНИЕ)
         ========================================================================= */}
      {isApproveModalOpen && targetTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a4d3e]/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#1a4d3e]/20 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a4d3e]/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Утверждение доклада
                </span>
                <h3 className="text-xl font-extrabold text-[#1a4d3e] mt-1.5 leading-snug">
                  {targetTalk.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Докладчик: <span className="font-semibold text-[#1a4d3e]">{targetTalk.speakerName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="size-8 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="space-y-6">
              {/* 1. Выбор аудитории */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-2.5">
                  Аудитория доклада <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {rooms.map((room) => {
                    const isSelected = approveRoomId === String(room.id);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setApproveRoomId(String(room.id))}
                        className={`p-3 rounded-xl border-2 text-left font-bold text-sm transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "border-[#1a4d3e] bg-[#1a4d3e] text-white shadow-xs"
                            : "border-[#1a4d3e]/15 bg-[#f5f3ed]/60 text-[#1a4d3e] hover:border-[#1a4d3e]/30"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Building2 className="size-4 opacity-80" />
                          {room.name}
                        </span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. День конференции */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-2">
                  День выступления
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { date: "2026-10-05", label: "5 окт (День 1)" },
                    { date: "2026-10-06", label: "6 окт (День 2)" },
                    { date: "2026-10-07", label: "7 окт (День 3)" },
                  ].map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setSelectedDate(d.date)}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
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

              {/* 3. Быстрые временные слоты */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e] mb-2">
                  Временной слот (30 минут)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {timeSlots.map((slot) => {
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
                        className={`p-2 rounded-xl border text-xs font-mono font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? "border-[#1a4d3e] bg-[#1a4d3e] text-white"
                            : "border-[#1a4d3e]/20 bg-[#f5f3ed]/60 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1a4d3e]/10">
                <Button
                  variant="tertiary"
                  className="rounded-xl font-bold cursor-pointer"
                  onClick={() => setIsApproveModalOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs cursor-pointer"
                  isPending={reviewMutation.isPending}
                >
                  <Check className="size-4 text-[#d4a84b] mr-1.5" />
                  Подтвердить и внести в расписание
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          МОДАЛКА 2: ОТПРАВКА НА ДОРАБОТКУ / ОТКЛОНЕНИЕ
         ========================================================================= */}
      {isFeedbackModalOpen && targetTalk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a4d3e]/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#1a4d3e]/20 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#1a4d3e]/10">
              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    feedbackType === "needs_revision"
                      ? "text-amber-800 bg-amber-100 border-amber-300"
                      : "text-rose-800 bg-rose-100 border-rose-300"
                  }`}
                >
                  {feedbackType === "needs_revision" ? "Отправка на доработку" : "Отклонение доклада"}
                </span>
                <h3 className="text-xl font-extrabold text-[#1a4d3e] mt-1.5 leading-snug">
                  {targetTalk.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="size-8 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmFeedback} className="space-y-5">
              {/* Переключатель типа решения */}
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

              {/* Поле комментария */}
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

              {/* Быстрые шаблоны замечаний */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#1a4d3e]/70 uppercase tracking-wider block">
                  Быстрые шаблоны замечаний:
                </span>
                <div className="space-y-1">
                  {commentPresets.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFeedbackComment(preset)}
                      className="w-full text-left p-2 rounded-lg text-xs text-[#1a4d3e] bg-[#f5f3ed]/80 hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/10 transition-colors cursor-pointer truncate block"
                      title={preset}
                    >
                      ⚡ {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1a4d3e]/10">
                <Button
                  variant="tertiary"
                  className="rounded-xl font-bold cursor-pointer"
                  onClick={() => setIsFeedbackModalOpen(false)}
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
                  isPending={reviewMutation.isPending}
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
      )}
    </div>
  );
}

export const juryPageRoute = { element: <JuryPage /> };
