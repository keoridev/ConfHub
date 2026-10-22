import { Sparkles } from "lucide-react";
import type { User } from "~entities/talk/model/types";

interface SubmissionHeaderProps {
  user?: User | null;
  createdTalkId: number | null;
  isSubmitted: boolean;
}

export function SubmissionHeader({
  user,
  createdTalkId,
  isSubmitted,
}: SubmissionHeaderProps) {
  return (
    <div className="space-y-3 pb-6 border-b border-[#1a4d3e]/10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1a4d3e]/10 text-[#1a4d3e] uppercase tracking-wider">
        <Sparkles className="size-3.5 text-[#d4a84b]" />
        МУИТ • XVIII Международная конференция-конкурс • 10–18 ноября 2026
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a4d3e] tracking-tight">
        Подача заявки на доклад
      </h1>
      <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
        XVIII Международная научно-практическая конференция «Инновационные технологии и передовые решения», посвященная Дню науки. Заполните сведения о докладе, выберите секцию и прикрепите материалы (Word / PDF) для автоматического AI-анализа и рассмотрения экспертной комиссией.
      </p>

      {user && (
        <div className="flex items-center gap-3 pt-3 flex-wrap">
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
              !createdTalkId
                ? "bg-[#1a4d3e] text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Тема и секция</span>
          </div>
          <div className="w-4 h-px bg-[#1a4d3e]/20" />
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
              createdTalkId && !isSubmitted
                ? "bg-[#1a4d3e] text-white shadow-xs"
                : isSubmitted
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-white text-muted-foreground border border-[#1a4d3e]/15"
            }`}
          >
            <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Материалы & AI</span>
          </div>
          <div className="w-4 h-px bg-[#1a4d3e]/20" />
          <div
            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
              isSubmitted
                ? "bg-[#1a4d3e] text-white shadow-xs"
                : "bg-white text-muted-foreground border border-[#1a4d3e]/15"
            }`}
          >
            <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Готово</span>
          </div>
        </div>
      )}
    </div>
  );
}
