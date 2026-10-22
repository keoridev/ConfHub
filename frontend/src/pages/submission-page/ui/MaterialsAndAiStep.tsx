import {
  Edit3,
  Presentation,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Send,
  School,
  Mail,
  Users,
  Tag,
} from "lucide-react";
import { Card, Button, Chip } from "@heroui/react";
import type { Talk, User } from "~entities/talk/model/types";

interface MaterialsAndAiStepProps {
  createdTalkId: number;
  talk?: Talk;
  user?: User | null;
  file: File | null;
  setFile: (file: File | null) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  hasWordDocument: boolean;
  isWordFileSelected: boolean;
  isNonWordDocumentAttached: boolean;
  isNonWordFileSelected: boolean;
  isAiUsed: boolean;
  uploadDocPending: boolean;
  validateTalkPending: boolean;
  onFileUpload: () => void;
  onValidate: () => void;
  onFinish: () => void;
  onEditSubmission: () => void;
  onReplaceFile: (newFile: File) => void;
}

export function MaterialsAndAiStep({
  createdTalkId,
  talk,
  user,
  file,
  setFile,
  isDragging,
  setIsDragging,
  hasWordDocument,
  isWordFileSelected,
  isNonWordDocumentAttached,
  isNonWordFileSelected,
  isAiUsed,
  uploadDocPending,
  validateTalkPending,
  onFileUpload,
  onValidate,
  onFinish,
  onEditSubmission,
  onReplaceFile,
}: MaterialsAndAiStepProps) {
  const aiResult = talk?.aiResult?.result;

  return (
    <div className="space-y-6 max-w-full">
      <Card className="border border-[#1a4d3e]/20 bg-white p-4 sm:p-7 md:p-8 rounded-3xl shadow-sm space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1a4d3e]/10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1a4d3e] text-white shrink-0">
                Шаг 2 из 2
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a4d3e] break-words">
                Материалы доклада и завершение
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Заявка <strong>№{createdTalkId}</strong> зарегистрирована. Вы можете прикрепить файл презентации или отчёта и по желанию запустить AI-проверку.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onEditSubmission}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/10 text-xs font-bold text-[#1a4d3e] transition-colors cursor-pointer"
            >
              <Edit3 className="size-3.5" />
              <span>Редактировать данные</span>
            </button>
            <Chip color="success" variant="soft">
              Заявка зарегистрирована
            </Chip>
          </div>
        </div>

        {talk && (
          <div className="bg-[#f5f3ed]/60 rounded-2xl p-4 sm:p-5 border border-[#1a4d3e]/15 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-[#1a4d3e]/10">
              <span className="font-bold text-[#1a4d3e] text-sm">
                {talk.title}
              </span>
              <span className="font-mono text-xs">#{talk.id}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-[#1a4d3e]">
                {talk.speakerName || user?.fullName}
                {talk.gradeOrGroup ? ` • ${talk.gradeOrGroup}` : ""}
              </span>
              {talk.university && (
                <span className="flex items-center gap-1">
                  <School className="size-3.5 text-muted-foreground" />
                  {talk.university}
                </span>
              )}
              {talk.authorEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {talk.authorEmail}
                </span>
              )}
              {talk.supervisor && (
                <span>
                  Руководитель: <strong className="text-[#1a4d3e]">{talk.supervisor}</strong>
                </span>
              )}
            </div>
            {talk.coAuthors && talk.coAuthors.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Users className="size-3.5 text-muted-foreground shrink-0" />
                <span>
                  Соавторы: <strong className="text-[#1a4d3e]">{talk.coAuthors.join(", ")}</strong>
                </span>
              </div>
            )}
            {talk.keywords && talk.keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <Tag className="size-3 text-muted-foreground" />
                {talk.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-[#1a4d3e] border border-[#1a4d3e]/10"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-[#1a4d3e] flex items-center gap-2">
              <Presentation className="size-4 text-[#d4a84b]" />
              Прикрепить материалы (презентация или отчёт) —{" "}
              <span className="text-xs font-normal text-muted-foreground">необязательно</span>
            </label>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              PDF, DOCX, PPTX до 10 МБ
            </span>
          </div>

          {!talk?.document ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
                isDragging
                  ? "border-[#d4a84b] bg-[#d4a84b]/10"
                  : "border-[#1a4d3e]/20 hover:border-[#1a4d3e]/50 bg-[#f5f3ed]/40"
              }`}
            >
              <input
                type="file"
                accept=".docx,.doc,.pdf,.pptx,.ppt"
                className="hidden"
                id="file-upload"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center">
                  <Upload className="size-7" />
                </div>
                {file ? (
                  <div className="space-y-1">
                    <span className="font-bold text-[#1a4d3e] text-base block">
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {(file.size / 1024 / 1024).toFixed(2)} МБ •{" "}
                      {file.name.endsWith(".pptx") || file.name.endsWith(".ppt")
                        ? "Презентация (PPTX)"
                        : file.name.endsWith(".docx") || file.name.endsWith(".doc")
                        ? "Документ Word (DOCX)"
                        : "PDF документ / презентация"}
                    </span>
                    <span className="inline-block mt-2 text-xs font-semibold text-[#1a4d3e] underline">
                      Выбрать другой файл
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="font-bold text-[#1a4d3e] text-base block">
                      Перетащите презентацию (PDF, PPTX) или документ Word
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      Поддерживаются PDF, DOCX и PPTX до 10 МБ. Если у вас только презентация — прикрепите её сюда.
                    </span>
                    <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 bg-white rounded-lg border border-[#1a4d3e]/20 text-[#1a4d3e]">
                      Обзор файлов
                    </span>
                  </div>
                )}
              </label>

              {file && (
                <div className="mt-4 pt-4 border-t border-[#1a4d3e]/10 flex justify-center">
                  <Button
                    className="px-6 py-2.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs"
                    isPending={uploadDocPending}
                    onClick={onFileUpload}
                  >
                    <Upload className="size-4 mr-2" />
                    Загрузить выбранный файл
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#f5f3ed] p-5 rounded-2xl border border-[#1a4d3e]/15">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-[#1a4d3e] text-[#f5f3ed] rounded-xl">
                  {talk.document.originalName.endsWith(".pptx") ||
                  talk.document.originalName.endsWith(".ppt") ? (
                    <Presentation className="size-6" />
                  ) : (
                    <FileText className="size-6" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#1a4d3e]">{talk.document.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ • Материалы успешно прикреплены
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip color="success" variant="soft">
                  <CheckCircle2 className="size-4 mr-1" /> Прикреплено
                </Chip>
                <label
                  htmlFor="file-reupload"
                  className="text-xs font-semibold text-[#1a4d3e] hover:underline cursor-pointer ml-2"
                >
                  Заменить
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.pptx,.ppt"
                    className="hidden"
                    id="file-reupload"
                    onChange={(e) => {
                      const newF = e.target.files?.[0];
                      if (newF) onReplaceFile(newF);
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* AI Box */}
        <div className="rounded-2xl border border-[#d4a84b]/40 bg-[#d4a84b]/5 p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#d4a84b] text-[#1a4d3e]">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1a4d3e]">
                  ИИ-экспресс-анализ доклада (1 попытка)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Требуется прикреплённый документ Word (.docx / .doc). Доступна ровно 1 попытка предварительной проверки.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#1a4d3e] border border-[#d4a84b]/40 shrink-0">
              Необязательно
            </span>
          </div>

          {/* Notices regarding Word requirement and 1 attempt limit */}
          {!isAiUsed && !hasWordDocument && !isWordFileSelected && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 animate-in fade-in">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">ИИ-экспертиза требует документ Word (.docx / .doc)</p>
                <p className="text-amber-800/90">
                  Чтобы запустить предварительную оценку, прикрепите файл статьи или доклада в формате Word (.docx или .doc) в блоке выше.
                </p>
              </div>
            </div>
          )}

          {!isAiUsed && (isNonWordDocumentAttached || isNonWordFileSelected) && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 animate-in fade-in">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Неподдерживаемый формат для ИИ</p>
                <p className="text-amber-800/90">
                  ИИ-анализ работает исключительно с документами Word (.docx или .doc). Пожалуйста, прикрепите файл Word.
                </p>
              </div>
            </div>
          )}

          {!isAiUsed && (hasWordDocument || isWordFileSelected) && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>
                Документ Word прикреплён. Доступна <strong>1 разовая попытка</strong> предварительного AI-анализа.
              </span>
            </div>
          )}

          {isAiUsed && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#1a4d3e]/5 border border-[#1a4d3e]/15 text-xs text-[#1a4d3e] animate-in fade-in">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>
                AI-проверка уже выполнена. Для каждой заявки доступна <strong>1 попытка</strong>.
              </span>
            </div>
          )}

          {aiResult && (
            <div className="space-y-4 animate-in fade-in pt-2">
              <div className="grid md:grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-xl border ${
                    (aiResult.sectionFit?.score ?? 0) >= 70
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">
                    Соответствие секции
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {aiResult.sectionFit?.comment || "Оценка тематического соответствия"}
                  </p>
                  <p className="text-xl font-black mt-2 text-[#1a4d3e]">
                    {aiResult.sectionFit?.score ?? 0}/100
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    (aiResult.annotationMatch?.score ?? 0) >= 70
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">
                    Качество тезисов
                  </p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {aiResult.annotationMatch?.comment || "Оценка содержания тезисов"}
                  </p>
                  <p className="text-xl font-black mt-2 text-[#1a4d3e]">
                    {aiResult.annotationMatch?.score ?? 85}/100
                  </p>
                </div>
              </div>

              {aiResult.issues && aiResult.issues.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-[#1a4d3e] space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="size-4 text-amber-600" />
                    Замечания ИИ по содержанию:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-[#1a4d3e]/90">
                    {aiResult.issues.map((iss, i) => (
                      <li key={i}>{iss.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                <div className="bg-white p-4 rounded-xl border border-[#1a4d3e]/10 text-xs text-[#1a4d3e]/80 space-y-1">
                  <span className="font-bold text-[#1a4d3e] block mb-1">Рекомендации ИИ:</span>
                  <ul className="list-disc list-inside space-y-0.5">
                    {aiResult.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <Button
              className={`w-full md:flex-1 min-h-[48px] h-auto py-3 px-3 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all whitespace-normal break-words text-center leading-snug flex items-center justify-center gap-2 cursor-pointer ${
                isAiUsed
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-300 cursor-not-allowed opacity-90"
                  : !hasWordDocument && !isWordFileSelected
                  ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                  : "bg-white hover:bg-white/80 text-[#1a4d3e] border border-[#d4a84b]"
              }`}
              isPending={validateTalkPending}
              isDisabled={isAiUsed || (!hasWordDocument && !isWordFileSelected)}
              onClick={onValidate}
            >
              {isAiUsed ? (
                <>
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span className="break-words">AI-проверка выполнена (1/1 попытка использована)</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4 text-[#d4a84b] shrink-0" />
                  <span className="break-words">Запустить AI-проверку (доступна 1 попытка)</span>
                </>
              )}
            </Button>

            <Button
              className="w-full md:flex-1 min-h-[48px] h-auto py-3 px-3 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-extrabold rounded-xl shadow-xs text-xs sm:text-sm whitespace-normal break-words text-center leading-snug flex items-center justify-center gap-2 cursor-pointer"
              onClick={onFinish}
            >
              <Send className="size-4 text-[#d4a84b] shrink-0" />
              <span className="break-words">
                {isAiUsed || aiResult
                  ? "Завершить и передать в жюри"
                  : "Отправить на принятие (без AI-анализа)"}
              </span>
            </Button>
          </div>
        </div>

        {!talk?.document && !file && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onFinish}
              className="text-xs font-semibold text-muted-foreground hover:text-[#1a4d3e] transition-colors underline cursor-pointer"
            >
              Отправить заявку только с тезисами (без прикрепления файла и без AI)
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
