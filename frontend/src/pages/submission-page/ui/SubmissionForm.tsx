import {
  UseFormRegister,
  UseFormHandleSubmit,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
} from "react-hook-form";
import {
  BookOpen,
  Check,
  Laptop,
  Cpu,
  Leaf,
  User as UserIcon,
  School,
  GraduationCap,
  Mail,
  UserCheck,
  FileCheck,
  FileText,
  Building,
  Clock,
} from "lucide-react";
import { Card, Button } from "@heroui/react";
import type { Section } from "~entities/talk/model/types";
import { getSectionMeta } from "~shared/lib";
import type { SubmissionFormValues, CoAuthorItem } from "../model/types";
import { CoAuthorsEditor } from "./CoAuthorsEditor";
import { KeywordsInput } from "./KeywordsInput";
import { AbstractInput } from "./AbstractInput";

interface SubmissionFormProps {
  register: UseFormRegister<SubmissionFormValues>;
  handleSubmit: UseFormHandleSubmit<SubmissionFormValues>;
  setValue: UseFormSetValue<SubmissionFormValues>;
  watch: UseFormWatch<SubmissionFormValues>;
  errors: FieldErrors<SubmissionFormValues>;
  sections: Section[];
  coAuthorsList: CoAuthorItem[];
  onAddCoAuthor: () => void;
  onRemoveCoAuthor: (id: string) => void;
  onUpdateCoAuthor: (id: string, field: keyof CoAuthorItem, value: string) => void;
  onSubmit: (values: SubmissionFormValues) => void;
  isPending: boolean;
}

export function SubmissionForm({
  register,
  handleSubmit,
  setValue,
  watch,
  errors,
  sections,
  coAuthorsList,
  onAddCoAuthor,
  onRemoveCoAuthor,
  onUpdateCoAuthor,
  onSubmit,
  isPending,
}: SubmissionFormProps) {
  const sectionId = watch("sectionId");
  const titleValue = watch("title") || "";
  const speakerNameValue = watch("speakerName") || "";
  const universityValue = watch("university") || "";
  const gradeOrGroupValue = watch("gradeOrGroup") || "";
  const authorEmailValue = watch("authorEmail") || "";
  const keywordsValue = watch("keywords") || "";
  const supervisorValue = watch("supervisor") || "";
  const abstractValue = watch("abstract") || "";

  return (
    <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 rounded-3xl shadow-sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-[#1a4d3e]">
              Название темы доклада <span className="text-danger">*</span>
            </label>
            <div className="flex items-center gap-3">
              {titleValue && (
                <button
                  type="button"
                  onClick={() => setValue("title", "", { shouldValidate: true })}
                  className="text-xs text-[#1a4d3e]/60 hover:text-danger font-medium transition-colors cursor-pointer"
                >
                  Очистить
                </button>
              )}
              <span className="text-xs font-mono text-muted-foreground">
                {titleValue.length}/200
              </span>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
              <BookOpen className="size-4" />
            </div>
            <input
              {...register("title")}
              placeholder="Например: Разработка нейросетевой модели для классификации текстов..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
            />
            {titleValue && (
              <button
                type="button"
                onClick={() => setValue("title", "", { shouldValidate: true })}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                title="Очистить"
              >
                <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                  ×
                </span>
              </button>
            )}
          </div>


          {errors.title && (
            <p className="text-xs text-danger mt-1.5 font-medium">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Sections */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5">
            <label className="text-sm font-bold text-[#1a4d3e] inline-flex items-center gap-1 shrink-0">
              <span>Секция конференции</span>
              <span className="text-danger font-bold">*</span>
            </label>
            <span className="text-xs text-muted-foreground">
              Регламент: 10 мин (15 мин для ключевых) · ключевые в 1-ю очередь
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {sections.map((s, idx) => {
              const isSelected = sectionId === String(s.id);
<<<<<<< HEAD
              const meta = getSectionMeta(s.title, idx);
              const Icon = meta.icon;
=======
              const isIT = s.id === 1 || s.title.toLowerCase().includes("it");
              const isEng = s.id === 2 || s.title.toLowerCase().includes("инжен");
              const Icon = isIT ? Laptop : isEng ? Cpu : Leaf;
              const talksCount = s.talksCount ?? 0;
>>>>>>> 38985a4ec470f6b0620df1907d7c0e07f93286ea

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    setValue("sectionId", String(s.id), { shouldValidate: true })
                  }
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 group relative ${
                    isSelected
                      ? "border-[#1a4d3e] bg-[#1a4d3e]/5 ring-2 ring-[#1a4d3e]/20 shadow-sm"
                      : "border-[#1a4d3e]/15 bg-white hover:border-[#1a4d3e]/35 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div
                      className="size-10 rounded-2xl flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105"
                      style={{ backgroundColor: meta.bgColor || "#1a4d3e" }}
                    >
                      <Icon className="size-5" />
                    </div>
                    {isSelected ? (
                      <span className="size-5 rounded-full bg-[#1a4d3e] text-white flex items-center justify-center shrink-0">
                        <Check className="size-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="size-5 rounded-full border-2 border-[#1a4d3e]/25 group-hover:border-[#1a4d3e]/50 shrink-0 transition-colors" />
                    )}
                  </div>
<<<<<<< HEAD
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#1a4d3e] leading-snug line-clamp-3">
                      {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                      {meta.subtitle}
=======
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold text-[#1a4d3e]">{s.title}</p>
                      {s.hasKeynote && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 shrink-0" title="В секции есть ключевая лекция">
                          ⭐ Ключевой
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isIT
                        ? "ИИ, разработка, алгоритмы"
                        : isEng
                        ? "Робототехника, приборы"
                        : "Экология и мониторинг"}
>>>>>>> 38985a4ec470f6b0620df1907d7c0e07f93286ea
                    </p>

                    {/* Section articles count and room distribution */}
                    <div className="mt-2.5 pt-2 border-t border-[#1a4d3e]/10 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <FileText className="size-3 text-[#1a4d3e]/70" />
                          <span>Статей в секции:</span>
                        </span>
                        <span className="font-bold text-[#1a4d3e] bg-white px-1.5 py-0.5 rounded-md border border-[#1a4d3e]/15">
                          {talksCount > 0 ? `${talksCount} ст.` : "0 (станьте первым!)"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Building className="size-3 text-[#1a4d3e]/70" />
                          <span>В аудиториях:</span>
                        </span>
                        <span className="font-semibold text-[#1a4d3e] truncate max-w-[120px]" title={s.rooms && s.rooms.length > 0 ? s.rooms.map((r) => `${r.name}: ${r.talksCount} ст.`).join(", ") : "Формируются"}>
                          {s.rooms && s.rooms.length > 0
                            ? s.rooms.map((r) => `${r.name} (${r.talksCount})`).join(", ")
                            : "Формируются"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                        <span className="flex items-center gap-1 text-[#1a4d3e]/70 font-medium">
                          <Clock className="size-2.5 text-[#d4a84b]" />
                          <span>10 мин / доклад</span>
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold">
                          Идёт приём
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Section Summary Banner */}
          {sectionId && (() => {
            const currentSection = sections.find((s) => String(s.id) === sectionId);
            if (!currentSection) return null;
            return (
              <div className="mt-3 p-3 rounded-2xl bg-[#1a4d3e]/5 border border-[#1a4d3e]/15 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-[#1a4d3e]">
                    Выбрана секция: «{currentSection.title}»
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#1a4d3e]/15 font-semibold text-[#1a4d3e]">
                    Подано статей: <strong>{currentSection.talksCount ?? 0}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#1a4d3e]/15 font-semibold text-[#1a4d3e]">
                    Аудитории: <strong>{currentSection.rooms && currentSection.rooms.length > 0 ? currentSection.rooms.map(r => `${r.name} (${r.talksCount} ст.)`).join(', ') : 'Назначаются жюри'}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#d4a84b]/20 text-[#1a4d3e] font-bold">
                    ⏱️ 10 мин на статью
                  </span>
                </div>
              </div>
            );
          })()}

          {errors.sectionId && (
            <p className="text-xs text-danger mt-1.5 font-medium">
              {errors.sectionId.message}
            </p>
          )}
        </div>

        {/* Authors Info */}
        <div className="pt-2 border-t border-[#1a4d3e]/10 space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#d4a84b]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a4d3e]">
              Сведения об авторах и организации
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                  ФИО докладчика (Основного автора)
                </label>
                {speakerNameValue && (
                  <button
                    type="button"
                    onClick={() => setValue("speakerName", "")}
                    className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                  <UserIcon className="size-4" />
                </div>
                <input
                  {...register("speakerName")}
                  placeholder="Например: Болотбек Атай"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                />
                {speakerNameValue && (
                  <button
                    type="button"
                    onClick={() => setValue("speakerName", "")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                      ×
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                  Учебное заведение / Организация / ВУЗ
                </label>
                {universityValue && (
                  <button
                    type="button"
                    onClick={() => setValue("university", "")}
                    className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                  <School className="size-4" />
                </div>
                <input
                  {...register("university")}
                  placeholder="Например: КГТУ им. И. Раззакова или МУИТ"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                />
                {universityValue && (
                  <button
                    type="button"
                    onClick={() => setValue("university", "")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                      ×
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                  Группа или курс{" "}
                  <span className="text-[10px] lowercase text-muted-foreground font-normal">
                    (номер группы, не фамилия)
                  </span>
                </label>
                {gradeOrGroupValue && (
                  <button
                    type="button"
                    onClick={() => setValue("gradeOrGroup", "")}
                    className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                  <GraduationCap className="size-4" />
                </div>
                <input
                  {...register("gradeOrGroup")}
                  placeholder="Например: ИС-22 или 2 курс"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                />
                {gradeOrGroupValue && (
                  <button
                    type="button"
                    onClick={() => setValue("gradeOrGroup", "")}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                      ×
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                  Почта авторов (Email для связи)
                </label>
                {authorEmailValue && (
                  <button
                    type="button"
                    onClick={() => setValue("authorEmail", "", { shouldValidate: true })}
                    className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                  <Mail className="size-4" />
                </div>
                <input
                  type="email"
                  {...register("authorEmail")}
                  placeholder="Например: student@example.com"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                />
                {authorEmailValue && (
                  <button
                    type="button"
                    onClick={() => setValue("authorEmail", "", { shouldValidate: true })}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                    title="Очистить"
                  >
                    <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                      ×
                    </span>
                  </button>
                )}
              </div>
              {errors.authorEmail && (
                <p className="text-xs text-danger mt-1.5 font-medium">
                  {errors.authorEmail.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                Научный руководитель
              </label>
              {supervisorValue && (
                <button
                  type="button"
                  onClick={() => setValue("supervisor", "")}
                  className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                >
                  Очистить
                </button>
              )}
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                <UserCheck className="size-4" />
              </div>
              <input
                {...register("supervisor")}
                placeholder="Например: проф. Касымов А.Т."
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
              />
              {supervisorValue && (
                <button
                  type="button"
                  onClick={() => setValue("supervisor", "")}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                  title="Очистить"
                >
                  <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">
                    ×
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Co-Authors */}
          <CoAuthorsEditor
            coAuthorsList={coAuthorsList}
            onAdd={onAddCoAuthor}
            onRemove={onRemoveCoAuthor}
            onUpdate={onUpdateCoAuthor}
          />

          {/* Keywords with limit 5-10 */}
          <KeywordsInput
            register={register}
            keywordsValue={keywordsValue}
            onClear={() => setValue("keywords", "", { shouldValidate: true })}
            errors={errors}
          />
        </div>

        {/* Abstract with limit 250-500 */}
        <AbstractInput
          register={register}
          abstractValue={abstractValue}
          onClear={() => setValue("abstract", "", { shouldValidate: true })}
          errors={errors}
        />

        <Button
          type="submit"
          className="w-full min-h-[52px] h-auto py-3.5 px-4 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer text-sm sm:text-base whitespace-normal break-words text-center leading-snug flex items-center justify-center gap-2"
          isPending={isPending}
        >
          <FileCheck className="size-5 text-[#d4a84b] shrink-0" />
          <span className="break-words">Создать заявку и перейти к загрузке материалов</span>
        </Button>
      </form>
    </Card>
  );
}
