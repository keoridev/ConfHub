import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Search,
  Download,
  Presentation,
  Sparkles,
  ExternalLink,
  Eye,
  X,
  Trash2,
  Star,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import { pathKeys } from "~shared/lib";
import { ConfirmDeleteTalkModal } from "~shared/ui";
import {
  useSetKeynoteMutation,
  useAdminDeleteTalkMutation,
  useSectionsQuery,
} from "~entities/talk/api/queries";
import type { Talk, Section } from "~entities/talk/model/types";
import { PrintProgramModal } from "~features/print-program";
import { statusLabel, statusClass } from "../../model/constants";
import { fmt } from "../../lib/formatters";

interface AllTalksTableProps {
  talks: Talk[];
  loading: boolean;
  sections?: Section[];
}

export function AllTalksTable({ talks, loading, sections: propSections }: AllTalksTableProps) {
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hasDocFilter, setHasDocFilter] = useState<"all" | "with_doc" | "no_doc">("all");
  const [previewTalk, setPreviewTalk] = useState<Talk | null>(null);
  const [talkToDelete, setTalkToDelete] = useState<Talk | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => new Set());
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Pagination state (for 200+ articles)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const tableScrollRef = useRef<HTMLDivElement>(null);

  const { data: fetchedSections = [] } = useSectionsQuery();
  const sections = propSections || fetchedSections;

  const deleteMutation = useAdminDeleteTalkMutation();
  const setKeynoteMutation = useSetKeynoteMutation();

  const handleTableScroll = (offset: number) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const uniqueSections = useMemo(() => {
    if (sections && sections.length > 0) {
      return sections.map((s) => ({ id: s.id, title: s.title }));
    }
    const map = new Map<number, string>();
    talks.forEach((t) => {
      if (t.section?.id && t.section?.title) {
        map.set(t.section.id, t.section.title);
      }
    });
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.id - b.id);
  }, [talks, sections]);

  const handleRequestDelete = (talk: Talk) => {
    setTalkToDelete(talk);
  };

  const handleConfirmDelete = async () => {
    if (!talkToDelete) return;
    const talk = talkToDelete;
    try {
      setDeletingId(talk.id);
      // Optimistically hide immediately
      setDeletedIds((prev) => new Set(prev).add(talk.id));
      await deleteMutation.mutateAsync(talk.id);
      toast.success(`Доклад «${talk.title}» успешно удалён из базы`);
      if (previewTalk?.id === talk.id) {
        setPreviewTalk(null);
      }
      setTalkToDelete(null);
    } catch (err: any) {
      // Revert optimistic delete on error
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(talk.id);
        return next;
      });
      const errorMsg =
        err?.response?.data?.error?.message ||
        (typeof err?.response?.data?.error === "string" ? err.response.data.error : null) ||
        err?.message ||
        "Не удалось удалить доклад";
      toast.error(errorMsg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleKeynote = async (talk: Talk) => {
    const nextState = !talk.isKeynote;
    try {
      await setKeynoteMutation.mutateAsync({
        talkId: talk.id,
        isKeynote: nextState,
      });
      if (nextState) {
        toast.success(`Доклад «${talk.title}» назначен ключевым в секции (15 мин, 1-я очередь)!`);
      } else {
        toast.info(`С доклада «${talk.title}» снят статус ключевого.`);
      }
      if (previewTalk?.id === talk.id) {
        setPreviewTalk({ ...previewTalk, isKeynote: nextState });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Ошибка смены статуса доклада");
    }
  };

  const sortedTalks = useMemo(() => {
    return talks
      .filter((t) => !deletedIds.has(t.id))
      .sort((a, b) => {
        // 1. Keynote talks first
        if (a.isKeynote && !b.isKeynote) return -1;
        if (!a.isKeynote && b.isKeynote) return 1;

        // 2. If scheduled start time exists, sort by time
        if (a.startTime && b.startTime) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        if (a.startTime) return -1;
        if (b.startTime) return 1;

        // 3. Otherwise order of registration (created_at ASC)
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
  }, [talks, deletedIds]);

  const filteredTalks = useMemo(() => {
    return sortedTalks.filter((t) => {
      // Section filter
      if (sectionFilter !== "all" && String(t.sectionId ?? t.section?.id) !== sectionFilter) {
        return false;
      }

      // Keynote filter
      if (statusFilter === "keynote" && !t.isKeynote) return false;

      // Status filter
      if (statusFilter !== "all" && statusFilter !== "keynote" && t.status !== statusFilter) return false;

      // Has document filter
      if (hasDocFilter === "with_doc" && !t.document) return false;
      if (hasDocFilter === "no_doc" && t.document) return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchSpeaker = (t.speakerName || "").toLowerCase().includes(q);
        const matchSection = (t.section?.title || "").toLowerCase().includes(q);
        const matchSuper = (t.supervisor || "").toLowerCase().includes(q);
        const matchGroup = (t.gradeOrGroup || "").toLowerCase().includes(q);
        const matchUniv = (t.university || "").toLowerCase().includes(q);
        const matchEmail = (t.authorEmail || "").toLowerCase().includes(q);
        const matchCo = (t.coAuthors || []).some((ca) => ca.toLowerCase().includes(q));
        if (
          !matchTitle &&
          !matchSpeaker &&
          !matchSection &&
          !matchSuper &&
          !matchGroup &&
          !matchUniv &&
          !matchEmail &&
          !matchCo
        ) {
          return false;
        }
      }

      return true;
    });
  }, [sortedTalks, statusFilter, hasDocFilter, search, sectionFilter]);

  // Reset page to 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, sectionFilter, statusFilter, hasDocFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTalks.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTalks = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTalks.slice(start, start + pageSize);
  }, [filteredTalks, safeCurrentPage, pageSize]);

  const counts = useMemo(() => {
    return {
      all: talks.length,
      keynotes: talks.filter((t) => !!t.isKeynote).length,
      approved: talks.filter((t) => t.status === "approved").length,
      pending: talks.filter((t) => !t.status || t.status === "pending_review").length,
      revision: talks.filter((t) => t.status === "needs_revision").length,
      rejected: talks.filter((t) => t.status === "rejected").length,
      withDoc: talks.filter((t) => !!t.document).length,
    };
  }, [talks]);

  return (
    <>
      {/* Top Header & Search / Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ marginTop: "2rem" }}>
        <div className="flex items-center gap-2 text-lg font-black text-[#1a4d3e]">
          <FileText className="size-5 text-[#d4a84b]" />
          <span>Реестр докладов и материалов</span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e]">
            {filteredTalks.length} из {talks.length}
          </span>
        </div>

        {/* Action Controls: Print Program, Section Selector & Search */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full md:w-auto">
          {/* Print Conference Program Button */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
            title="Сформировать и распечатать официальную программу для гостей и участников"
          >
            <Printer className="size-4 text-[#d4a84b]" />
            <span>Печать программы</span>
          </button>

          {/* Section dropdown */}
          {uniqueSections.length > 0 && (
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#1a4d3e]/20 bg-white text-xs font-semibold text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/20 cursor-pointer"
            >
              <option value="all">Все направления ({uniqueSections.length})</option>
              {uniqueSections.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  Секция {s.id}: {s.title.slice(0, 32)}...
                </option>
              ))}
            </select>
          )}

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1a4d3e]/40 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, автору..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#1a4d3e]/20 bg-white text-xs text-[#1a4d3e] focus:outline-none focus:ring-2 focus:ring-[#1a4d3e]/20"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Scroll navigation toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 pb-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-[#1a4d3e] text-white shadow-2xs"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            Все ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "keynote" ? "all" : "keynote")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              statusFilter === "keynote"
                ? "bg-amber-500 text-white shadow-2xs font-bold"
                : "bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100"
            }`}
          >
            <Star className={`size-3 ${statusFilter === "keynote" ? "fill-white text-white" : "fill-amber-500 text-amber-500"}`} />
            <span>Ключевые ({counts.keynotes})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("approved")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            Одобрено ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending_review")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === "pending_review"
                ? "bg-amber-600 text-white shadow-2xs"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            На рассмотрении ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("needs_revision")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === "needs_revision"
                ? "bg-orange-600 text-white shadow-2xs"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            На доработке ({counts.revision})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("rejected")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
              statusFilter === "rejected"
                ? "bg-rose-600 text-white shadow-2xs"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            Отклонено ({counts.rejected})
          </button>

          <span className="text-[#1a4d3e]/30 px-1 hidden sm:inline">|</span>

          <button
            type="button"
            onClick={() => setHasDocFilter(hasDocFilter === "with_doc" ? "all" : "with_doc")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              hasDocFilter === "with_doc"
                ? "bg-[#d4a84b] text-[#1a4d3e] shadow-2xs font-bold"
                : "bg-white border border-[#1a4d3e]/15 text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
            }`}
          >
            <Presentation className="size-3" />
            <span>С презентацией ({counts.withDoc})</span>
          </button>
        </div>

        {/* Scroll Helper Buttons for Desktop/Mouse users so they never need middle-click! */}
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
          <span className="text-[11px] text-muted-foreground mr-1 hidden sm:inline">Таблица:</span>
          <button
            type="button"
            onClick={() => handleTableScroll(-260)}
            className="p-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] cursor-pointer transition-colors shadow-2xs"
            title="Прокрутить таблицу влево"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleTableScroll(260)}
            className="p-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] cursor-pointer transition-colors shadow-2xs"
            title="Прокрутить таблицу вправо к действиям"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card relative">
        {loading ? (
          <div className="admin-table-empty">
            <div className="admin-spinner" />
            <p>Загрузка докладов...</p>
          </div>
        ) : filteredTalks.length === 0 ? (
          <div className="admin-table-empty">
            <FileText className="size-10 opacity-30" />
            <p>Нет докладов по заданным фильтрам</p>
          </div>
        ) : (
          <div
            ref={tableScrollRef}
            className="admin-table-wrapper"
            style={{ maxHeight: "72vh", overflowY: "auto", overflowX: "auto" }}
          >
            <table className="admin-table w-full">
              <thead className="sticky top-0 z-20 bg-[#fbfaf7] shadow-2xs">
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th className="min-w-[280px]">Доклад и Докладчик</th>
                  <th className="min-w-[180px]">Секция</th>
                  <th className="min-w-[120px]">Материалы</th>
                  <th className="min-w-[90px]">AI</th>
                  <th className="min-w-[100px]">Статус</th>
                  <th className="min-w-[130px]">Аудитория и Время</th>
                  {/* Sticky Actions column header so actions are NEVER lost off-screen! */}
                  <th className="min-w-[170px] text-right sticky right-0 bg-[#fbfaf7] z-30 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] pr-3">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTalks.map((talk, idx) => {
                  const globalIdx = (safeCurrentPage - 1) * pageSize + idx + 1;
                  const aiResult = talk.aiResult?.result;
                  const aiScore = aiResult?.sectionFit?.score;
                  const hasDoc = !!talk.document;
                  const sectionSupervisor = talk.section?.supervisor;

                  return (
                    <tr
                      key={talk.id}
                      className={`admin-table-row group ${talk.isKeynote ? "bg-amber-50/50" : ""}`}
                    >
                      <td className="admin-td-num text-center">
                        {talk.isKeynote ? (
                          <span title="Ключевой доклад секции (15 мин, 1-я очередь)" className="text-amber-500 font-bold inline-flex items-center justify-center">
                            <Star className="size-3.5 fill-amber-500 text-amber-500" />
                          </span>
                        ) : (
                          globalIdx
                        )}
                      </td>
                      <td className="admin-td-title">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#1a4d3e] text-xs sm:text-sm">
                            {talk.title}
                          </span>
                          {talk.isKeynote && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
                              <Star className="size-2.5 fill-amber-500 text-amber-500" />
                              <span>ГЛАВНЫЙ В СЕКЦИИ (15 МИН)</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
                          <span className="font-semibold text-[#1a4d3e]">
                            {talk.speakerName || "Докладчик"}
                          </span>
                          {talk.gradeOrGroup && <span>• Гр. {talk.gradeOrGroup}</span>}
                          {talk.university && <span>• {talk.university}</span>}
                          {talk.supervisor && (
                            <span>• Рук: <strong>{talk.supervisor}</strong></span>
                          )}
                          {talk.coAuthors && talk.coAuthors.length > 0 && (
                            <span className="text-[#d4a84b] font-medium">• +{talk.coAuthors.length} соавт.</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-td-section">
                        {talk.section ? (
                          <div className="space-y-0.5">
                            <span
                              className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-2xs max-w-[220px] truncate"
                              style={{ backgroundColor: talk.section.color || "#1a4d3e" }}
                              title={talk.section.title}
                            >
                              {talk.section.title}
                            </span>
                            {sectionSupervisor && (
                              <span className="block text-[10px] text-muted-foreground font-medium truncate" title={sectionSupervisor}>
                                Рук: {sectionSupervisor}
                              </span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {hasDoc && talk.document ? (
                          <a
                            href={`/api/talks/${talk.id}/document`}
                            download={talk.document.originalName}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1a4d3e]/10 hover:bg-[#1a4d3e]/20 text-[#1a4d3e] font-bold text-[11px] transition-colors border border-[#1a4d3e]/15"
                            title={`Скачать ${talk.document.originalName}`}
                          >
                            <Download className="size-3 text-[#d4a84b]" />
                            <span className="max-w-[100px] truncate">{talk.document.originalName}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            Только тезисы
                          </span>
                        )}
                      </td>
                      <td>
                        {aiResult ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              (aiScore ?? 0) >= 70
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            <Sparkles className="size-3 text-[#d4a84b]" />
                            <span>{aiScore ?? 85}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Без AI</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-badge ${statusClass[talk.status] ?? ""}`}>
                          {statusLabel[talk.status] ?? talk.status}
                        </span>
                      </td>
                      <td className="admin-td-date">
                        {talk.room?.name ? (
                          <div className="text-[11px]">
                            <span className="font-bold text-[#1a4d3e] block">
                              Ауд. {talk.room.name}
                            </span>
                            {talk.startTime && talk.endTime && (
                              <span className="text-muted-foreground font-mono">
                                {fmt(talk.startTime)} – {fmt(talk.endTime)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Не назначено</span>
                        )}
                      </td>

                      {/* Sticky Right Actions Column (Never gets lost!) */}
                      <td className="sticky right-0 bg-white group-hover:bg-[#fbfaf7] z-10 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.06)] pr-3 transition-colors">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                          {/* Keynote Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleKeynote(talk)}
                            disabled={setKeynoteMutation.isPending}
                            className={`px-2 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              talk.isKeynote
                                ? "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900 shadow-2xs font-bold"
                                : "border-[#1a4d3e]/20 text-[#1a4d3e]/70 hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                            }`}
                            title={talk.isKeynote ? "Снять статус главного доклада" : "Сделать главным докладом секции (15 мин)"}
                          >
                            <Star className={`size-3 ${talk.isKeynote ? "fill-amber-500 text-amber-500" : ""}`} />
                            <span>{talk.isKeynote ? "Главный" : "Сделать гл."}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPreviewTalk(talk)}
                            className="px-2 py-1 rounded-lg border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/10 text-xs font-semibold text-[#1a4d3e] transition-colors cursor-pointer flex items-center gap-1"
                            title="Быстрый просмотр"
                          >
                            <Eye className="size-3" />
                            <span>Детали</span>
                          </button>

                          <Link
                            to={pathKeys.talk.build(String(talk.id))}
                            className="p-1 text-[#1a4d3e]/60 hover:text-[#1a4d3e] transition-colors rounded-lg hover:bg-[#1a4d3e]/5"
                            title="Открыть страницу доклада"
                          >
                            <ExternalLink className="size-3.5" />
                          </Link>

                          <button
                            type="button"
                            disabled={deletingId === talk.id}
                            onClick={() => handleRequestDelete(talk)}
                            className="p-1 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                            title="Удалить доклад из базы"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar (Supports 200+ articles easily!) */}
        {filteredTalks.length > 0 && (
          <div className="p-3 border-t border-[#1a4d3e]/15 bg-[#fbfaf7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>
                Показано{" "}
                <strong className="text-[#1a4d3e]">
                  {(safeCurrentPage - 1) * pageSize + 1}–
                  {Math.min(safeCurrentPage * pageSize, filteredTalks.length)}
                </strong>{" "}
                из <strong className="text-[#1a4d3e]">{filteredTalks.length}</strong>
              </span>

              <span className="text-[#1a4d3e]/30">•</span>

              <div className="flex items-center gap-1.5">
                <span>Строк:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-0.5 rounded-lg border border-[#1a4d3e]/20 bg-white font-bold text-[#1a4d3e] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Numeric page buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="p-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Первая страница"
              >
                <ChevronsLeft className="size-3.5" />
              </button>

              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="size-3.5" />
                <span>Назад</span>
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safeCurrentPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const hasGap = prev && p - prev > 1;

                  return (
                    <div key={p} className="flex items-center gap-1">
                      {hasGap && <span className="px-1 text-muted-foreground">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={`size-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          safeCurrentPage === p
                            ? "bg-[#1a4d3e] text-white shadow-2xs"
                            : "bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                        }`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Вперёд</span>
                <ChevronRight className="size-3.5" />
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="p-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e]/10 text-[#1a4d3e] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Последняя страница"
              >
                <ChevronsRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Details Modal for Admin */}
      {previewTalk && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewTalk(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#1a4d3e]/20 p-4 sm:p-7 space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1a4d3e]/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`admin-badge ${statusClass[previewTalk.status] ?? ""}`}>
                    {statusLabel[previewTalk.status] ?? previewTalk.status}
                  </span>
                  {previewTalk.isKeynote && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                      <Star className="size-3 fill-amber-500 text-amber-500" />
                      <span>Главный доклад секции (15 мин)</span>
                    </span>
                  )}
                  <span className="text-xs font-mono text-muted-foreground">#{previewTalk.id}</span>
                </div>
                <h3 className="text-xl font-extrabold text-[#1a4d3e] leading-snug">
                  {previewTalk.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTalk(null)}
                className="size-8 rounded-full hover:bg-black/5 text-[#1a4d3e]/60 hover:text-[#1a4d3e] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Author info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#f5f3ed]/60 p-4 rounded-2xl border border-[#1a4d3e]/10">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase font-bold tracking-wider">Докладчик:</span>
                <span className="font-extrabold text-[#1a4d3e] text-sm">{previewTalk.speakerName}</span>
                {previewTalk.university && <p className="text-muted-foreground font-medium mt-0.5">{previewTalk.university}</p>}
                {previewTalk.gradeOrGroup && <p className="text-muted-foreground">Группа: {previewTalk.gradeOrGroup}</p>}
                {previewTalk.authorEmail && <p className="text-muted-foreground text-[11px]">Email: {previewTalk.authorEmail}</p>}
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase font-bold tracking-wider">Научный руководитель:</span>
                <span className="font-bold text-[#1a4d3e]">{previewTalk.supervisor || "Не указан"}</span>
                {previewTalk.coAuthors && previewTalk.coAuthors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#1a4d3e]/10">
                    <span className="text-muted-foreground block text-[11px] uppercase font-bold tracking-wider">Соавторы:</span>
                    <span className="font-medium text-[#1a4d3e] text-[11px]">{previewTalk.coAuthors.join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Abstract */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">Аннотация доклада:</span>
              <div className="p-4 rounded-2xl bg-[#f5f3ed]/40 border border-[#1a4d3e]/10 text-xs sm:text-sm text-[#1a4d3e] leading-relaxed">
                {previewTalk.abstract}
              </div>
            </div>

            {/* Attached File */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">Прикреплённые материалы:</span>
              {previewTalk.document ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#f5f3ed] border border-[#1a4d3e]/15">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#1a4d3e] text-white">
                      <Presentation className="size-5 text-[#d4a84b]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1a4d3e]">{previewTalk.document.originalName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(previewTalk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/talks/${previewTalk.id}/document`}
                    download={previewTalk.document.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a4d3e] text-white text-xs font-bold hover:bg-[#143d31] transition-colors"
                  >
                    <Download className="size-3.5 text-[#d4a84b]" />
                    <span>Скачать файл</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-[#f5f3ed]/30 border border-dashed border-[#1a4d3e]/15">
                  Файл презентации не прикреплён (только тезисы)
                </p>
              )}
            </div>

            {/* AI Review if available */}
            {previewTalk.aiResult?.result && (
              <div className="space-y-2 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 text-xs text-[#1a4d3e]">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-[#d4a84b]" />
                    Результаты экспертной AI-проверки:
                  </span>
                  <span>Оценка: {previewTalk.aiResult.result.sectionFit?.score ?? 85}/100</span>
                </div>
                <p>{previewTalk.aiResult.result.sectionFit?.comment}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 border-t border-[#1a4d3e]/10">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleToggleKeynote(previewTalk)}
                  disabled={setKeynoteMutation.isPending}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                    previewTalk.isKeynote
                      ? "bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-2xs"
                      : "border-[#1a4d3e]/20 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                  }`}
                >
                  <Star className={`size-3.5 ${previewTalk.isKeynote ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{previewTalk.isKeynote ? "Снять статус главного" : "Сделать главным докладом"}</span>
                </button>

                <button
                  type="button"
                  disabled={deletingId === previewTalk.id}
                  onClick={() => handleRequestDelete(previewTalk)}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-rose-200 disabled:opacity-40"
                >
                  <Trash2 className="size-3.5 text-rose-600" />
                  <span>Удалить доклад</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to={pathKeys.talk.build(String(previewTalk.id))}
                  className="flex-1 sm:flex-initial py-2.5 px-3 sm:px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <ExternalLink className="size-3.5 text-[#d4a84b] shrink-0" />
                  <span>Открыть страницу</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewTalk(null)}
                  className="py-2.5 px-4 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/5 text-xs font-bold text-[#1a4d3e] transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-app safe deletion confirmation modal */}
      <ConfirmDeleteTalkModal
        isOpen={Boolean(talkToDelete)}
        talkTitle={talkToDelete?.title}
        speakerName={talkToDelete?.speakerName}
        sectionTitle={talkToDelete?.section?.title}
        isPending={Boolean(deletingId)}
        onClose={() => setTalkToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Official Print Program Modal */}
      <PrintProgramModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        talks={talks}
        sections={sections}
      />
    </>
  );
}
