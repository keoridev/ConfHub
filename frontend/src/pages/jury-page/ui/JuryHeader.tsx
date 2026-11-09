import {
  Scale,
  LogOut,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
} from "lucide-react";
import type { User, Section } from "~entities/talk/model/types";
import { JurySectionFilter } from "./JurySectionFilter";

interface JuryHeaderProps {
  user?: User | null;
  onOpenLogout: () => void;
  activeTab: "pending_review" | "approved" | "needs_revision" | "rejected";
  setActiveTab: (tab: "pending_review" | "approved" | "needs_revision" | "rejected") => void;
  tabCount: number;
  sections: Section[];
  selectedSectionId: string;
  setSelectedSectionId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sectionCounts: Record<string, number>;
  filteredCount: number;
}

export function JuryHeader({
  user,
  onOpenLogout,
  activeTab,
  setActiveTab,
  tabCount,
  sections,
  selectedSectionId,
  setSelectedSectionId,
  searchQuery,
  setSearchQuery,
  sectionCounts,
  filteredCount,
}: JuryHeaderProps) {
  return (
    <>
      {/* Top Banner */}
      <div className="bg-[#1a4d3e] text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 sm:w-96 sm:h-96 bg-[#d4a84b]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-[#f5f3ed] uppercase tracking-wider">
              <Scale className="size-3.5 text-[#d4a84b]" />
              Экспертная комиссия • Оценка заявок
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Кабинет Экспертного Жюри
            </h1>
            <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed">
              Рассмотрение поданных тезисов, проверка соответствия секции, анализ AI-отчётов и формирование официального расписания докладов конференции.
            </p>
          </div>

          {user ? (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 shrink-0 flex items-center gap-3.5 self-start md:self-auto">
              <div className="size-11 rounded-xl bg-[#d4a84b] text-[#1a4d3e] flex items-center justify-center font-bold text-base shadow-xs">
                {user.fullName ? user.fullName[0].toUpperCase() : <Scale className="size-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {user.fullName || user.login}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenLogout}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                    title="Выйти из аккаунта"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#d4a84b] font-medium mt-0.5">
                  <span className="size-2 rounded-full bg-[#d4a84b] animate-pulse" />
                  <span>Член жюри</span>
                </div>
                <p className="text-[10px] text-white/60">Активная сессия</p>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/15 shrink-0 flex items-center gap-3 self-start md:self-auto max-w-full">
              <div className="size-9 sm:size-10 rounded-xl bg-[#d4a84b]/20 border border-[#d4a84b]/30 text-[#e6c16c] flex items-center justify-center shrink-0">
                <Sparkles className="size-4 sm:size-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Режим проверки</p>
                <p className="text-[11px] sm:text-xs text-[#e6c16c] font-medium">AI-модуль активен</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs and Filters */}
      {user && (user.role === "jury" || user.role === "admin") && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#1a4d3e]/15 pb-4 overflow-x-auto no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => setActiveTab("pending_review")}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "pending_review"
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
              }`}
            >
              <Clock className="size-3.5 sm:size-4 text-[#d4a84b]" />
              <span>На рассмотрении</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "pending_review"
                    ? "bg-white/20 text-white"
                    : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                }`}
              >
                {activeTab === "pending_review" ? tabCount : "•"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("approved")}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "approved"
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
              }`}
            >
              <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-400" />
              <span>Одобренные</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "approved"
                    ? "bg-white/20 text-white"
                    : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                }`}
              >
                {activeTab === "approved" ? tabCount : "•"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("needs_revision")}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "needs_revision"
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
              }`}
            >
              <AlertTriangle className="size-3.5 sm:size-4 text-amber-400" />
              <span>На доработке</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "needs_revision"
                    ? "bg-white/20 text-white"
                    : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                }`}
              >
                {activeTab === "needs_revision" ? tabCount : "•"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("rejected")}
              className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "rejected"
                  ? "bg-[#1a4d3e] text-white shadow-sm"
                  : "bg-white text-[#1a4d3e] hover:bg-[#1a4d3e]/10 border border-[#1a4d3e]/15"
              }`}
            >
              <X className="size-3.5 sm:size-4 text-rose-400" />
              <span>Отклонённые</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === "rejected"
                    ? "bg-white/20 text-white"
                    : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                }`}
              >
                {activeTab === "rejected" ? tabCount : "•"}
              </span>
            </button>
          </div>

          {/* Section filter and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-1">
            <JurySectionFilter
              sections={sections}
              selectedSectionId={selectedSectionId}
              setSelectedSectionId={setSelectedSectionId}
              sectionCounts={sectionCounts}
              totalCount={tabCount}
            />

            <div className="relative flex-1 min-w-0">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1a4d3e]/40 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию, докладчику, руководителю, группе, ВУЗу..."
                className="w-full pl-10 pr-10 py-[15px] text-sm rounded-xl border border-[#1a4d3e]/20 bg-white text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-2 focus:ring-[#1a4d3e]/10 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="Очистить поиск"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[#1a4d3e]/50 hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {(selectedSectionId !== "all" || searchQuery.trim()) && (
            <div className="flex items-center justify-between gap-3 text-xs text-[#1a4d3e]/70">
              <span>
                Найдено: <span className="font-bold text-[#1a4d3e]">{filteredCount}</span> из {tabCount}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSectionId("all");
                  setSearchQuery("");
                }}
                className="font-bold text-[#1a4d3e] underline underline-offset-2 hover:text-[#143d31] cursor-pointer"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
