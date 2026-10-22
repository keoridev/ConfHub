import { UseFormRegister, FieldErrors } from "react-hook-form";
import { Tag, CheckCircle2, AlertCircle, X } from "lucide-react";
import { parseKeywords, type SubmissionFormValues } from "../model/types";

interface KeywordsInputProps {
  register: UseFormRegister<SubmissionFormValues>;
  keywordsValue: string;
  onClear: () => void;
  errors: FieldErrors<SubmissionFormValues>;
}

export function KeywordsInput({
  register,
  keywordsValue,
  onClear,
  errors,
}: KeywordsInputProps) {
  const words = parseKeywords(keywordsValue);
  const count = words.length;
  const isValid = count >= 5 && count <= 10;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e] inline-flex items-center gap-1">
            <span>Ключевые слова (через запятую)</span>
            <span className="text-danger font-bold">*</span>
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e] shrink-0">
            от 5 до 10 слов
          </span>
        </div>
        {keywordsValue && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
          >
            Очистить
          </button>
        )}
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
          <Tag className="size-4" />
        </div>
        <input
          {...register("keywords")}
          placeholder="Например: нейросети, машинное обучение, компьютерное зрение, анализ данных"
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-xs sm:text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium truncate sm:text-clip"
        />
        {keywordsValue && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
            title="Очистить"
          >
            <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
              <X className="size-3" />
            </span>
          </button>
        )}
      </div>

      {/* Keywords Counter & Chips */}
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              isValid
                ? "text-emerald-700"
                : count > 10
                ? "text-danger"
                : "text-amber-700"
            }`}
          >
            {isValid ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Лимит выполнен ({count} из 5–10 слов)
              </>
            ) : count < 5 ? (
              <>
                <AlertCircle className="size-3.5 text-amber-600" />
                {count === 0
                  ? "Требуется от 5 до 10 ключевых слов"
                  : `Осталось указать ещё ${5 - count} слов(а) (минимум 5)`}
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5 text-danger" />
                Превышен лимит: {count} слов (максимум 10)
              </>
            )}
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {count}/10
          </span>
        </div>

        {count > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {words.map((kw, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-[#1a4d3e]/10 text-[#1a4d3e] text-xs font-semibold border border-[#1a4d3e]/15 flex items-center gap-1"
              >
                <Tag className="size-3 text-[#d4a84b]" />
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {errors.keywords && (
        <p className="text-xs text-danger mt-1.5 font-medium">
          {errors.keywords.message}
        </p>
      )}
    </div>
  );
}
