import { Link } from "react-router-dom";
import {
  CheckCircle2,
  FileCheck,
  Edit3,
  School,
  Mail,
  Users,
  Tag,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card, Button, Chip } from "@heroui/react";
import { pathKeys } from "~shared/lib";
import type { Talk, Section, User } from "~entities/talk/model/types";

interface SubmittedSuccessViewProps {
  createdTalkId: number;
  talk?: Talk;
  currentSection?: Section;
  user?: User | null;
  onReset: () => void;
  onEditSubmission: () => void;
}

export function SubmittedSuccessView({
  createdTalkId,
  talk,
  currentSection,
  user,
  onReset,
  onEditSubmission,
}: SubmittedSuccessViewProps) {
  const aiResult = talk?.aiResult?.result;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <Card className="border border-emerald-600/30 bg-white p-7 sm:p-9 rounded-3xl shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1a4d3e]/10">
          <div className="flex items-center gap-3.5">
            <div className="size-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Заявка №{createdTalkId} принята
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a4d3e] tracking-tight mt-1">
                Заявка успешно отправлена!
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Материалы зарегистрированы и переданы экспертному жюри секции на рассмотрение.
              </p>
            </div>
          </div>
          <Chip color="success" variant="primary" className="font-bold self-start sm:self-auto">
            В очереди жюри
          </Chip>
        </div>

        <div className="bg-[#f5f3ed]/70 rounded-2xl p-5 sm:p-6 border border-[#1a4d3e]/15 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a4d3e]/10">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: currentSection?.color || "#1a4d3e" }}
              >
                {currentSection?.title || "Секция"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">ID: #{createdTalkId}</span>
            </div>
            <span className="text-xs font-semibold text-[#1a4d3e] bg-white px-3 py-1 rounded-full border border-[#1a4d3e]/15">
              Статус: Ожидает рецензии
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1a4d3e] leading-snug">
              {talk?.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-[#1a4d3e]">
                Докладчик: {talk?.speakerName || user?.fullName}{" "}
                {talk?.gradeOrGroup ? `(${talk.gradeOrGroup})` : ""}
              </span>
              {talk?.university && (
                <span className="flex items-center gap-1">
                  <School className="size-3.5 text-muted-foreground" />
                  {talk.university}
                </span>
              )}
              {talk?.authorEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5 text-muted-foreground" />
                  {talk.authorEmail}
                </span>
              )}
              {talk?.supervisor && (
                <span>
                  Руководитель: <strong className="text-[#1a4d3e]">{talk.supervisor}</strong>
                </span>
              )}
            </div>

            {talk?.coAuthors && talk.coAuthors.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span className="font-semibold text-[#1a4d3e] flex items-center gap-1">
                  <Users className="size-3.5 text-muted-foreground" />
                  Соавторы:
                </span>
                <span>{talk.coAuthors.join(", ")}</span>
              </div>
            )}

            {talk?.keywords && talk.keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                <span className="text-[11px] font-semibold text-[#1a4d3e]/70 flex items-center gap-1 mr-1">
                  <Tag className="size-3" /> Ключевые слова:
                </span>
                {talk.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1a4d3e]/5 text-[#1a4d3e] border border-[#1a4d3e]/10"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-white rounded-xl p-3.5 border border-[#1a4d3e]/10 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="size-3.5 text-[#1a4d3e]" />
                Прикреплённые файлы:
              </span>
              {talk?.document ? (
                <p className="text-xs font-bold text-[#1a4d3e] truncate">
                  {talk.document.originalName} ({(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Файл не прикреплён (поданы только тезисы)
                </p>
              )}
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-[#1a4d3e]/10 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#d4a84b]" />
                ИИ-экспресс-анализ:
              </span>
              {aiResult ? (
                <p className="text-xs font-bold text-emerald-700">
                  Выполнен (соответствие: {aiResult.sectionFit?.score ?? 85}/100)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Не проводился (прямая отправка жюри)
                </p>
              )}
            </div>
          </div>
        </div>

        {aiResult && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#1a4d3e]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-[#d4a84b]" />
                Предварительный отчёт экспертного AI:
              </span>
              <span className="text-muted-foreground font-normal">Анализ выполнен (1/1)</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-emerald-100">
                <span className="font-semibold text-muted-foreground block mb-1">
                  Соответствие секции:
                </span>
                <p className="text-[#1a4d3e]">{aiResult.sectionFit?.comment || "Тема доклада оценена"}</p>
                <span className="text-base font-black text-emerald-700 block mt-1.5">
                  {aiResult.sectionFit?.score ?? 0}/100
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-100">
                <span className="font-semibold text-muted-foreground block mb-1">
                  Качество аннотации:
                </span>
                <p className="text-[#1a4d3e]">{aiResult.annotationMatch?.comment || "Аннотация проверена"}</p>
                <span className="text-base font-black text-emerald-700 block mt-1.5">
                  {aiResult.annotationMatch?.score ?? 85}/100
                </span>
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
              <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-xs text-[#1a4d3e]/80 space-y-1">
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

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1a4d3e]/10">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto px-6 py-3 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl cursor-pointer"
              onClick={onReset}
            >
              <FileCheck className="size-4 mr-2" />
              Подать ещё одну заявку
            </Button>
            <Button
              className="w-full sm:w-auto px-4 py-3 bg-white border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/10 text-[#1a4d3e] font-bold rounded-xl cursor-pointer text-xs"
              onClick={onEditSubmission}
            >
              <Edit3 className="size-3.5 mr-1.5" />
              Редактировать эту заявку
            </Button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to={pathKeys.conference.build("demo")}
              className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/10 text-xs font-bold text-[#1a4d3e] transition-colors"
            >
              К программе конференции
            </Link>
            {(user?.role === "jury" || user?.role === "admin") && (
              <Link
                to={pathKeys.jury}
                className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-[#d4a84b] hover:bg-[#c4983b] text-xs font-bold text-[#1a4d3e] transition-colors"
              >
                Кабинет жюри
              </Link>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
