import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  GraduationCap,
  UserCheck,
  FileText,
  Presentation,
  Download,
  Copy,
  Check,
  Tag,
  Sparkles,
  School,
  Mail,
  Users,
} from "lucide-react";
import { Card, Skeleton } from "@heroui/react";
import { toast } from "sonner";

import { useTalkQuery } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { mockSections } from "~shared/mocks/mockData";
import { fmtTime } from "~entities/talk";

export function TalkPage() {
  const { talkId = "" } = useParams();
  const { data: talk, isLoading, isError } = useTalkQuery(Number(talkId));
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Ссылка на доклад скопирована в буфер обмена!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-10 max-w-4xl mx-auto px-4 space-y-6">
        <Skeleton className="h-6 w-32 rounded-lg bg-[#1a4d3e]/10" />
        <Skeleton className="h-64 w-full rounded-3xl bg-[#1a4d3e]/10" />
        <Skeleton className="h-40 w-full rounded-3xl bg-[#1a4d3e]/10" />
      </div>
    );
  }

  if (isError || !talk) {
    return (
      <div className="py-16 max-w-md mx-auto px-4 text-center space-y-4">
        <div className="size-16 rounded-3xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center mx-auto">
          <FileText className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#1a4d3e]">Доклад не найден</h2>
        <p className="text-sm text-muted-foreground">
          Возможно, доклад ещё находится на модерации жюри или был перемещён.
        </p>
        <Link
          to={pathKeys.conference.build("demo")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a4d3e] text-white text-sm font-bold shadow-xs hover:bg-[#143d31] transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Вернуться к программе</span>
        </Link>
      </div>
    );
  }

  const section =
    talk.section ||
    mockSections.find((s) => s.id === (talk.sectionId ?? talk.section?.id));

  const hasDocument = !!talk.document;
  const isPptx =
    talk.document?.originalName.endsWith(".pptx") ||
    talk.document?.originalName.endsWith(".ppt");
  const isDocx =
    talk.document?.originalName.endsWith(".docx") ||
    talk.document?.originalName.endsWith(".doc");

  return (
    <div className="py-6 sm:py-10 max-w-4xl mx-auto flex flex-col gap-6 sm:gap-8 px-4 sm:px-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={pathKeys.conference.build("demo")}
          className="text-xs sm:text-sm font-semibold text-[#1a4d3e]/70 flex items-center gap-1.5 hover:text-[#1a4d3e] transition-colors group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
          <span>К расписанию программы</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/5 text-xs font-semibold text-[#1a4d3e] transition-colors cursor-pointer"
            title="Скопировать ссылку"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <Copy className="size-3.5" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Скопировано!" : "Поделиться"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="bg-white rounded-3xl border border-[#1a4d3e]/15 p-6 sm:p-9 shadow-sm shadow-[#1a4d3e]/5 space-y-6 relative overflow-hidden">
        {section && (
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{ backgroundColor: section.color || "#1a4d3e" }}
          />
        )}

        {/* Section, Room, Schedule badges */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {section && (
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
              style={{ backgroundColor: section.color || "#1a4d3e" }}
            >
              {section.title}
            </span>
          )}

          {talk.startTime && talk.endTime ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e] text-xs font-bold border border-[#1a4d3e]/15">
              <Clock className="size-3.5 text-[#d4a84b]" />
              <span>
                {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ed] text-muted-foreground text-xs font-medium">
              <Clock className="size-3.5" />
              <span>Время доклада уточняется</span>
            </span>
          )}

          {talk.room?.name && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f3ed] text-[#1a4d3e] text-xs font-bold border border-[#1a4d3e]/10">
              <MapPin className="size-3.5 text-[#1a4d3e]" />
              <span>Аудитория {talk.room.name}</span>
            </span>
          )}

          <span className="text-xs font-mono text-muted-foreground ml-auto hidden sm:inline">
            ID: #{talk.id}
          </span>
        </div>

        {/* Talk Title */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1a4d3e] tracking-tight leading-snug">
            {talk.title}
          </h1>

          {/* Quick Speaker Subtitle */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#1a4d3e]/80 font-medium pt-1">
            <span className="flex items-center gap-1.5 font-bold text-[#1a4d3e]">
              <User className="size-4 text-[#d4a84b]" />
              {talk.speakerName}
            </span>
            {talk.gradeOrGroup && (
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#1a4d3e]/5 border border-[#1a4d3e]/10 font-semibold">
                {talk.gradeOrGroup}
              </span>
            )}
            {talk.supervisor && (
              <span className="text-xs text-muted-foreground">
                Руководитель:{" "}
                <strong className="text-[#1a4d3e] font-semibold">
                  {talk.supervisor}
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Abstract Box */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">
              Аннотация исследования
            </h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {talk.abstract.length} символов
            </span>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-[#f5f3ed]/70 border border-[#1a4d3e]/15 text-sm sm:text-base text-[#1a4d3e] leading-relaxed font-medium">
            <p className="whitespace-pre-line">{talk.abstract}</p>
          </div>
        </div>

        {/* Keywords */}
        {talk.tags && talk.tags.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/70 flex items-center gap-1.5">
              <Tag className="size-3.5 text-[#d4a84b]" />
              Ключевые слова
            </h3>
            <div className="flex flex-wrap gap-2">
              {talk.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl bg-white text-[#1a4d3e] text-xs font-semibold border border-[#1a4d3e]/20 shadow-2xs hover:border-[#1a4d3e]/40 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Author and Co-Authors Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Speaker profile */}
        <Card className="bg-white rounded-3xl border border-[#1a4d3e]/15 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1a4d3e]/10">
            <GraduationCap className="size-4 text-[#d4a84b]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
              Автор и докладчик
            </h3>
          </div>

          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              {talk.speakerName ? talk.speakerName[0].toUpperCase() : "С"}
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-base font-extrabold text-[#1a4d3e] truncate">
                {talk.speakerName}
              </h4>
              {talk.gradeOrGroup && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="font-semibold text-[#1a4d3e]">
                    Группа / Курс:
                  </span>
                  <span>{talk.gradeOrGroup}</span>
                </p>
              )}
              {talk.university && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <School className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{talk.university}</span>
                </p>
              )}
              {talk.authorEmail && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <Mail className="size-3.5 text-muted-foreground shrink-0" />
                  <span>{talk.authorEmail}</span>
                </p>
              )}
              {talk.supervisor && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <UserCheck className="size-3.5 text-muted-foreground shrink-0" />
                  <span>
                    Руководитель: <strong>{talk.supervisor}</strong>
                  </span>
                </p>
              )}
              {talk.coAuthors && talk.coAuthors.length > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                  <Users className="size-3.5 text-muted-foreground shrink-0" />
                  <span>
                    Соавторы: <strong className="text-[#1a4d3e] font-semibold">{talk.coAuthors.join(", ")}</strong>
                  </span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Presentation materials card */}
        <Card className="bg-white rounded-3xl border border-[#1a4d3e]/15 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1a4d3e]/10">
              <div className="flex items-center gap-2">
                <Presentation className="size-4 text-[#d4a84b]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                  Материалы выступления
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1a4d3e]/10 text-[#1a4d3e]">
                {hasDocument ? "Прикреплено" : "Тезисы"}
              </span>
            </div>

            <div className="pt-3">
              {hasDocument && talk.document ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f5f3ed] border border-[#1a4d3e]/15">
                    <div className="size-10 rounded-xl bg-[#1a4d3e] text-white flex items-center justify-center shrink-0">
                      {isPptx ? (
                        <Presentation className="size-5 text-[#d4a84b]" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1a4d3e] truncate" title={talk.document.originalName}>
                        {talk.document.originalName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ •{" "}
                        {isPptx
                          ? "Презентация (PPTX)"
                          : isDocx
                          ? "Документ Word (DOCX)"
                          : "PDF-документ"}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`/api/talks/${talk.id}/document`}
                    download={talk.document.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Download className="size-4 text-[#d4a84b]" />
                    <span>Скачать презентацию / материалы</span>
                  </a>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-[#1a4d3e]/20 bg-[#f5f3ed]/40 text-center space-y-1">
                  <p className="text-xs font-semibold text-[#1a4d3e]">
                    Презентация будет показана на секции
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Автор подал тезисы доклада. Демонстрация презентации пройдёт в аудитории секции.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              to={pathKeys.conference.build("demo")}
              className="text-xs text-[#1a4d3e]/70 hover:text-[#1a4d3e] underline font-medium"
            >
              Смотреть другие доклады в программе →
            </Link>
          </div>
        </Card>
      </div>

      {/* Guest CTA Card */}
      <div className="bg-gradient-to-br from-[#1a4335] via-[#215241] to-[#163a2e] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-lg shadow-[#1a4d3e]/10">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-semibold text-[#e6c16c] uppercase tracking-wider">
            <Sparkles className="size-3.5" />
            Участие в Conf-Hub 2026
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            Хотите выступить со своим научным докладом?
          </h3>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Подайте заявку на доклад, прикрепите тезисы или презентацию. Жюри оценит работу и включит её в программу конференции.
          </p>
        </div>

        <Link
          to={pathKeys.submission}
          className="shrink-0 py-3.5 px-6 rounded-2xl bg-[#d4a84b] hover:bg-[#c4983b] text-[#1a4d3e] font-extrabold text-sm shadow-md transition-all text-center"
        >
          Подать заявку на доклад
        </Link>
      </div>
    </div>
  );
}

export const talkPageRoute = { element: <TalkPage /> };
