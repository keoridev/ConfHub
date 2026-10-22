import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { SubmissionFormValues } from "../model/types";

interface AbstractInputProps {
  register: UseFormRegister<SubmissionFormValues>;
  abstractValue: string;
  onClear: () => void;
  errors: FieldErrors<SubmissionFormValues>;
}

export function AbstractInput({
  register,
  abstractValue,
  onClear,
  errors,
}: AbstractInputProps) {
  const isOptimal = abstractValue.length >= 250 && abstractValue.length <= 500;
  const isTooShort = abstractValue.length < 250;
  const isTooLong = abstractValue.length > 500;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-bold text-[#1a4d3e]">
            Аннотация доклада <span className="text-danger">*</span>
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e]">
            от 250 до 500 символов
          </span>
        </div>
        <div className="flex items-center gap-3">
          {abstractValue && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-[#1a4d3e]/60 hover:text-danger font-medium transition-colors cursor-pointer"
            >
              Очистить
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <textarea
          {...register("abstract")}
          rows={5}
          maxLength={600}
          placeholder="Опишите цель исследования, методологию и полученные результаты (от 250 до 500 символов)..."
          className="w-full p-4 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium leading-relaxed resize-y min-h-[130px]"
        />
      </div>

      <div className="mt-2 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span
            className={`font-semibold flex items-center gap-1.5 ${
              isOptimal
                ? "text-emerald-700"
                : isTooLong
                ? "text-danger"
                : "text-amber-700"
            }`}
          >
            {isOptimal ? (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-600" />
                Оптимальный объём аннотации ({abstractValue.length} симв., норма: 250–500)
              </>
            ) : isTooShort ? (
              <>
                <AlertCircle className="size-3.5 text-amber-600" />
                {abstractValue.length === 0
                  ? "Требуется от 250 до 500 символов"
                  : `Осталось ещё ${250 - abstractValue.length} симв. до минимума`}
              </>
            ) : (
              <>
                <AlertCircle className="size-3.5 text-danger" />
                Превышен лимит на {abstractValue.length - 500} симв. (максимум 500)
              </>
            )}
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            {abstractValue.length}/500
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-[#1a4d3e]/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isOptimal ? "bg-emerald-600" : isTooLong ? "bg-danger" : "bg-amber-500"
            }`}
            style={{
              width: `${Math.min(100, (abstractValue.length / 500) * 100)}%`,
            }}
          />
        </div>
      </div>

      {errors.abstract && (
        <p className="text-xs text-danger mt-1.5 font-medium">
          {errors.abstract.message}
        </p>
      )}
    </div>
  );
}
