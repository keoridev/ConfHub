import { useState, useMemo, Fragment } from "react";
import {
  Printer,
  X,
  Calendar,
  MapPin,
  Clock,
  Star,
  ExternalLink,
  SlidersHorizontal,
} from "lucide-react";
import type { Section, Talk } from "~entities/talk/model/types";
import { fmt } from "~pages/admin-page/lib/formatters";

interface PrintProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  talks: Talk[];
  sections: Section[];
}

export function PrintProgramModal({
  isOpen,
  onClose,
  talks,
  sections,
}: PrintProgramModalProps) {
  // Filters & Customization Settings for Ideal Print
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [density, setDensity] = useState<"compact" | "normal">("normal");
  const [colorMode, setColorMode] = useState<"mono" | "color">("mono");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [includeAbstracts, setIncludeAbstracts] = useState<boolean>(false);
  const [showCoAuthors, setShowCoAuthors] = useState<boolean>(true);

  // Filter approved or scheduled talks
  const approvedTalks = useMemo(() => {
    return talks.filter((t) => t.status === "approved" || t.startTime);
  }, [talks]);

  // Group talks by section
  const sectionGroups = useMemo(() => {
    const map = new Map<number, { section: Section; talks: Talk[] }>();

    sections.forEach((sec) => {
      map.set(sec.id, { section: sec, talks: [] });
    });

    approvedTalks.forEach((t) => {
      const secId = t.sectionId ?? t.section?.id ?? 0;
      if (map.has(secId)) {
        map.get(secId)!.talks.push(t);
      } else if (t.section) {
        map.set(secId, { section: t.section, talks: [t] });
      }
    });

    // Sort talks within each section: Keynote 1st, then chronological startTime
    map.forEach((group) => {
      group.talks.sort((a, b) => {
        if (a.isKeynote && !b.isKeynote) return -1;
        if (!a.isKeynote && b.isKeynote) return 1;
        if (a.startTime && b.startTime) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        return (a.id || 0) - (b.id || 0);
      });
    });

    // Filter by selected section if not "all"
    let entries = Array.from(map.values());
    if (selectedSectionId !== "all") {
      entries = entries.filter((g) => String(g.section.id) === selectedSectionId);
    }

    // Only show sections that have talks or if a specific section was selected
    return entries.filter((g) => g.talks.length > 0 || selectedSectionId !== "all");
  }, [approvedTalks, sections, selectedSectionId]);

  const totalFilteredTalks = useMemo(() => {
    return sectionGroups.reduce((acc, g) => acc + g.talks.length, 0);
  }, [sectionGroups]);

  const totalKeynotes = useMemo(() => {
    return sectionGroups.reduce(
      (acc, g) => acc + g.talks.filter((t) => !!t.isKeynote).length,
      0
    );
  }, [sectionGroups]);

  if (!isOpen) return null;

  // Dedicated clean window printing (Bulletproof across all browsers & printers)
  const handleOpenCleanPrint = () => {
    const win = window.open("", "_blank");
    if (!win) {
      window.print();
      return;
    }

    const isCompact = density === "compact";
    const isMono = colorMode === "mono";
    const isLandscape = orientation === "landscape";

    const tableRowsHtml = sectionGroups
      .map((group) => {
        const sec = group.section;
        const talksList = group.talks;
        const roomName =
          talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

        const secBannerBg = isMono ? "#f3f4f6" : "#f1f5f9";
        const secBorderLeft = isMono ? "#000000" : "#1a4d3e";
        const secTagColor = isMono ? "#000000" : "#1a4d3e";

        const sectionBannerRow = `
          <tr class="section-row" style="background: ${secBannerBg}; page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
            <td colspan="4" style="border-top: 2px solid #000; border-bottom: 1.5px solid #333; border-left: 5px solid ${secBorderLeft}; padding: ${isCompact ? "5px 8px" : "8px 10px"};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                  <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: ${secTagColor};">
                    СЕКЦИЯ №${sec.id}
                  </div>
                  <div style="font-size: ${isCompact ? "12px" : "13px"}; font-weight: 900; color: #000; line-height: 1.25; margin-top: 1px;">
                    ${sec.title}
                  </div>
                  ${
                    sec.supervisor
                      ? `<div style="font-size: ${isCompact ? "9.5px" : "10.5px"}; color: #333; margin-top: 2px;">
                          Ответственный за секцию: <strong>${sec.supervisor}</strong>
                        </div>`
                      : ""
                  }
                </div>
                <div style="font-size: ${isCompact ? "10px" : "11px"}; font-weight: bold; background: #fff; border: 1px solid #999; padding: 2px 7px; border-radius: 3px; white-space: nowrap; text-align: right; shrink-0;">
                  Зал: <strong>${roomName}</strong> · ${talksList.length} докл.
                </div>
              </div>
            </td>
          </tr>
        `;

        if (talksList.length === 0) {
          return (
            sectionBannerRow +
            `<tr>
              <td colspan="4" style="padding: 10px; text-align: center; color: #666; font-size: 11px; border-bottom: 1px solid #ccc;">
                В данной секции пока нет запланированных докладов.
              </td>
            </tr>`
          );
        }

        const talkRows = talksList
          .map((talk, idx) => {
            const durationMin =
              talk.startTime && talk.endTime
                ? Math.round(
                    (new Date(talk.endTime).getTime() - new Date(talk.startTime).getTime()) /
                      60000
                  )
                : talk.isKeynote
                ? 15
                : 10;

            const timeStr =
              talk.startTime && talk.endTime
                ? `${fmt(talk.startTime)} – ${fmt(talk.endTime)}`
                : "По графику";

            const keynoteBadge = talk.isKeynote
              ? isMono
                ? `<div style="display: inline-block; margin-bottom: 2px; background: #eee; color: #000; border: 1px solid #000; padding: 1px 5px; font-size: 9px; font-weight: 800; border-radius: 2px;">
                    ★ КЛЮЧЕВОЙ ДОКЛАД СЕКЦИИ (15 МИН, 1-я очередь)
                  </div>`
                : `<div style="display: inline-block; margin-bottom: 2px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 1px 5px; font-size: 9px; font-weight: 800; border-radius: 2px;">
                    ★ КЛЮЧЕВОЙ ДОКЛАД СЕКЦИИ (15 МИН, 1-я очередь)
                  </div>`
              : "";

            const coAuthorsHtml =
              showCoAuthors && talk.coAuthors && talk.coAuthors.length > 0
                ? `<div style="font-size: ${isCompact ? "9.5px" : "10px"}; color: #444; margin-top: 1.5px;">
                    Соавторы: <i>${talk.coAuthors.join(", ")}</i>
                  </div>`
                : "";

            const abstractBlock =
              includeAbstracts && talk.abstract
                ? `<div style="font-size: ${isCompact ? "9px" : "10px"}; color: #333; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ccc; line-height: 1.35;">
                    <strong>Тезисы:</strong> ${talk.abstract}
                  </div>`
                : "";

            const rowBg = talk.isKeynote
              ? isMono
                ? "background-color: #fbfbfb;"
                : "background-color: #fffdf5;"
              : "";

            const paddingStyle = isCompact ? "padding: 4px 6px;" : "padding: 6px 8px;";

            return `
              <tr style="${rowBg} page-break-inside: avoid; break-inside: avoid;">
                <td style="border-right: 1px solid #ccc; border-bottom: 1px solid #bbb; ${paddingStyle} text-align: center; font-weight: bold; width: 34px; font-size: 11px;">
                  ${talk.isKeynote ? "★ 1" : idx + 1}
                </td>
                <td style="border-right: 1px solid #ccc; border-bottom: 1px solid #bbb; ${paddingStyle} text-align: center; width: 105px; font-family: monospace; font-size: 11px;">
                  <strong style="color: #000;">${timeStr}</strong><br/>
                  <span style="font-size: 9.5px; color: #555;">${durationMin} мин</span>
                </td>
                <td style="border-right: 1px solid #ccc; border-bottom: 1px solid #bbb; ${paddingStyle}">
                  ${keynoteBadge}
                  <div style="font-size: ${isCompact ? "11px" : "11.5px"}; font-weight: bold; color: #000; line-height: 1.25;">
                    ${talk.title}
                  </div>
                  <div style="font-size: ${isCompact ? "10px" : "10.5px"}; color: #222; margin-top: 2px;">
                    Докладчик: <strong>${talk.speakerName}</strong>
                    ${talk.gradeOrGroup ? ` (гр. ${talk.gradeOrGroup})` : ""}
                    ${talk.university ? ` · ${talk.university}` : ""}
                  </div>
                  ${coAuthorsHtml}
                  ${abstractBlock}
                </td>
                <td style="border-bottom: 1px solid #bbb; ${paddingStyle} width: 145px; font-size: 10.5px; color: #000;">
                  ${talk.supervisor ? `<strong>${talk.supervisor}</strong>` : `<span style="color: #888;">—</span>`}
                </td>
              </tr>
            `;
          })
          .join("");

        return sectionBannerRow + talkRows;
      })
      .join("");

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Программа конференции — Официальный регламент</title>
        <style>
          @page {
            size: A4 ${isLandscape ? "landscape" : "portrait"};
            margin: ${isCompact ? "8mm 8mm 8mm 8mm" : "10mm 10mm 10mm 10mm"};
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 4px;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-box {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: ${isCompact ? "6px" : "9px"};
            margin-bottom: ${isCompact ? "8px" : "12px"};
          }
          .header-inst {
            font-size: ${isCompact ? "10px" : "11px"};
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: ${isMono ? "#000" : "#1a4d3e"};
            margin: 0 0 2px 0;
          }
          .header-title {
            font-size: ${isCompact ? "14px" : "15.5px"};
            font-weight: 900;
            margin: 0 0 2px 0;
            line-height: 1.25;
            color: #000000;
          }
          .header-sub {
            font-size: ${isCompact ? "11px" : "12px"};
            font-weight: bold;
            color: ${isMono ? "#222" : "#8a6d1c"};
            margin: 0 0 4px 0;
          }
          .header-meta {
            font-size: ${isCompact ? "10px" : "10.5px"};
            color: #111111;
            margin-top: 4px;
          }
          .summary-bar {
            display: inline-block;
            margin-top: 4px;
            padding: 2px 10px;
            background: #f4f4f4;
            border: 1px solid #999;
            font-size: ${isCompact ? "9.5px" : "10px"};
            font-weight: bold;
            border-radius: 3px;
          }
          table.program-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            border: 1.5px solid #000000;
          }
          table.program-table thead {
            display: table-header-group;
          }
          table.program-table th {
            background-color: ${isMono ? "#000000" : "#0f172a"};
            color: #ffffff;
            font-weight: bold;
            padding: ${isCompact ? "5px 6px" : "6px 8px"};
            text-align: left;
            border: 1px solid #000000;
            font-size: ${isCompact ? "10px" : "11px"};
          }
          table.program-table th.center {
            text-align: center;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .footer-note {
            margin-top: ${isCompact ? "10px" : "14px"};
            padding-top: 6px;
            border-top: 1px solid #888;
            text-align: center;
            font-size: 9.5px;
            color: #444;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <p class="header-inst">
            Кыргызский Государственный Технический Университет им. И. Раззакова · МУИТ
          </p>
          <h1 class="header-title">
            XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС
          </h1>
          <p class="header-sub">
            «Инновационные технологии и устойчивое развитие в XXI веке»
          </p>
          <div class="header-meta">
            <strong>Дата:</strong> 10 ноября 2026 г. &nbsp;•&nbsp;
            <strong>Место:</strong> Главный корпус КГТУ / МУИТ, г. Бишкек &nbsp;•&nbsp;
            <strong>Регламент:</strong> Ключевой доклад — 15 мин, секционный доклад — 10 мин
          </div>
          <div class="summary-bar">
            Всего докладов в программе: <strong>${totalFilteredTalks}</strong> &nbsp;•&nbsp;
            Секций: <strong>${sectionGroups.length}</strong> &nbsp;•&nbsp;
            Ключевых докладов (1-я очередь): <strong>${totalKeynotes}</strong>
          </div>
        </div>

        <table class="program-table">
          <thead>
            <tr>
              <th class="center" style="width: 34px;">№</th>
              <th class="center" style="width: 105px;">Время</th>
              <th>Тема доклада и автор(ы)</th>
              <th style="width: 145px;">Науч. руководитель</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-note">
          Оргкомитет конференции: тел. +996 (312) 54-51-62, email: conf@kstu.kg · ConfHub 2026 · Дата формирования: ${new Date().toLocaleDateString("ru-RU")}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(fullHtml);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Strict Print CSS for Direct Browser Print without modal clipping */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation === "landscape" ? "landscape" : "portrait"};
            margin: ${density === "compact" ? "8mm" : "10mm"};
          }
          body * {
            visibility: hidden !important;
          }
          #conference-printable-program,
          #conference-printable-program * {
            visibility: visible !important;
          }
          #conference-printable-program {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            background: #fff !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          table.unified-program-table {
            border: 1.5px solid #000 !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          table.unified-program-table thead {
            display: table-header-group !important;
          }
          table.unified-program-table th {
            background-color: ${colorMode === "mono" ? "#000" : "#0f172a"} !important;
            color: #fff !important;
            border: 1px solid #000 !important;
          }
          tr.section-header-tr {
            background-color: #f1f5f9 !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#1a4d3e]/20 max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        {/* Modal Controls Toolbar */}
        <div className="print:hidden p-4 sm:p-5 border-b border-[#1a4d3e]/15 bg-[#fbfaf7] flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#1a4d3e] text-white shadow-xs">
                <Printer className="size-5 text-[#d4a84b]" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#1a4d3e]">
                  Печать программы конференции (А4 / PDF)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Официальный типографский регламент с тонкой настройкой для печати
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Standalone clean print button (Recommended for 100% perfection) */}
              <button
                type="button"
                onClick={handleOpenCleanPrint}
                className="px-4 py-2 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                title="Открыть идеальный документ А4 для печати или сохранения в PDF"
              >
                <ExternalLink className="size-4 text-[#d4a84b]" />
                <span>Печать / Сохранить в PDF (А4)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCleanPrint}
                className="px-3 py-2 bg-white hover:bg-gray-100 text-[#1a4d3e] border border-[#1a4d3e]/20 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                title="Быстрая печать"
              >
                <Printer className="size-4" />
                <span className="hidden sm:inline">Печать</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 flex items-center justify-center text-[#1a4d3e] cursor-pointer shrink-0 ml-1"
                aria-label="Закрыть"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Granular Print Settings Bar */}
          <div className="pt-2 border-t border-[#1a4d3e]/10 flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-slate-700">
              <SlidersHorizontal className="size-3.5 text-[#1a4d3e]" />
              <span>Параметры:</span>
            </span>

            {/* Filter by section */}
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white font-semibold text-[#1a4d3e] focus:outline-none cursor-pointer"
            >
              <option value="all">Все секции ({sections.length})</option>
              {sections.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  Секция №{s.id}: {s.title.slice(0, 30)}...
                </option>
              ))}
            </select>

            {/* Density Toggle (Compact vs Normal) */}
            <div className="inline-flex p-0.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDensity("normal")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  density === "normal"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Стандартная
              </button>
              <button
                type="button"
                onClick={() => setDensity("compact")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  density === "compact"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                title="Уменьшает отступы и шрифт, чтобы максимум докладов поместился на 1 лист"
              >
                Компактная (1 лист)
              </button>
            </div>

            {/* Monochrome vs Color Toggle */}
            <div className="inline-flex p-0.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-xs font-semibold">
              <button
                type="button"
                onClick={() => setColorMode("mono")}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  colorMode === "mono"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                title="Высококонтрастный режим для чёрно-белых офисных принтеров (Canon, HP, Xerox)"
              >
                Ч/Б Принтер
              </button>
              <button
                type="button"
                onClick={() => setColorMode("color")}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  colorMode === "color"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Цветной
              </button>
            </div>

            {/* Orientation Toggle */}
            <div className="inline-flex p-0.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-xs font-semibold">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  orientation === "portrait"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Книжная
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  orientation === "landscape"
                    ? "bg-[#1a4d3e] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                Альбомная
              </button>
            </div>

            {/* Include Abstracts Checkbox */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1a4d3e]/20 bg-white font-semibold text-slate-800 cursor-pointer hover:bg-[#1a4d3e]/5">
              <input
                type="checkbox"
                checked={includeAbstracts}
                onChange={(e) => setIncludeAbstracts(e.target.checked)}
                className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
              />
              <span>Тезисы</span>
            </label>

            {/* Show Co-authors Checkbox */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#1a4d3e]/20 bg-white font-semibold text-slate-800 cursor-pointer hover:bg-[#1a4d3e]/5">
              <input
                type="checkbox"
                checked={showCoAuthors}
                onChange={(e) => setShowCoAuthors(e.target.checked)}
                className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
              />
              <span>Соавторы</span>
            </label>
          </div>
        </div>

        {/* Printable Document Body / Interactive Live Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 sm:p-6">
          <div
            id="conference-printable-program"
            className={`mx-auto bg-white text-black font-sans shadow-md border border-slate-300 rounded-sm print:shadow-none print:border-none print:m-0 print:p-0 ${
              density === "compact" ? "p-5 sm:p-6" : "p-6 sm:p-8"
            } ${orientation === "landscape" ? "max-w-[297mm]" : "max-w-[210mm]"}`}
          >
            {/* Official Academic Letterhead */}
            <div
              className={`text-center border-b-2 border-black ${
                density === "compact" ? "space-y-1 pb-3 mb-3" : "space-y-1.5 pb-4 mb-4"
              }`}
            >
              <p
                className={`font-extrabold uppercase tracking-widest ${
                  density === "compact" ? "text-[10px]" : "text-xs"
                } ${colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"}`}
              >
                Кыргызский Государственный Технический Университет им. И. Раззакова · МУИТ
              </p>
              <h1
                className={`font-black text-black leading-snug ${
                  density === "compact" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                }`}
              >
                XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС
              </h1>
              <p
                className={`font-bold uppercase tracking-wider ${
                  density === "compact" ? "text-xs" : "text-xs sm:text-sm"
                } ${colorMode === "mono" ? "text-neutral-800" : "text-[#8a6d1c]"}`}
              >
                «Инновационные технологии и устойчивое развитие в XXI веке»
              </p>

              <div
                className={`pt-1 flex flex-wrap items-center justify-center gap-3 font-semibold text-black ${
                  density === "compact" ? "text-[10px]" : "text-xs"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3 text-black shrink-0" />
                  <span>Дата: <strong>10 ноября 2026 г.</strong></span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 text-black shrink-0" />
                  <span>Место: Главный корпус КГТУ / МУИТ, г. Бишкек</span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3 text-black shrink-0" />
                  <span>Регламент: Ключевой доклад — <strong>15 мин</strong>, секционный — <strong>10 мин</strong></span>
                </span>
              </div>

              {/* Summary Stats Pill */}
              <div
                className={`mt-2 inline-flex items-center justify-center gap-2.5 bg-neutral-50 border border-neutral-300 rounded-md font-medium text-black ${
                  density === "compact" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-xs"
                }`}
              >
                <span>Всего докладов в программе: <strong>{totalFilteredTalks}</strong></span>
                <span>•</span>
                <span>Секций: <strong>{sectionGroups.length}</strong></span>
                <span>•</span>
                <span>Ключевых докладов (1-я очередь): <strong>{totalKeynotes}</strong></span>
              </div>
            </div>

            {/* Unified Program Table */}
            {sectionGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Нет одобренных докладов для выбранного направления.
              </div>
            ) : (
              <table className="unified-program-table w-full text-left border-collapse border border-black font-sans">
                <thead>
                  <tr
                    className={`text-white font-extrabold ${
                      colorMode === "mono" ? "bg-black" : "bg-[#0f172a]"
                    } ${density === "compact" ? "text-[10.5px]" : "text-[11.5px]"}`}
                  >
                    <th className="p-2 w-10 text-center border-r border-slate-700">№</th>
                    <th className="p-2 w-28 text-center border-r border-slate-700">Время</th>
                    <th className="p-2 border-r border-slate-700">Тема доклада и автор(ы)</th>
                    <th className="p-2 w-36 text-left">Научный руководитель</th>
                  </tr>
                </thead>
                <tbody>
                  {sectionGroups.map((group) => {
                    const sec = group.section;
                    const talksList = group.talks;
                    const roomName =
                      talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

                    return (
                      <Fragment key={sec.id}>
                        {/* Section Divider Bar spanning all 4 columns */}
                        <tr
                          className="section-header-tr break-inside-avoid print:break-inside-avoid bg-neutral-100"
                          style={{
                            pageBreakInside: "avoid",
                            pageBreakAfter: "avoid",
                            breakAfter: "avoid",
                          }}
                        >
                          <td
                            colSpan={4}
                            className={`border-t-2 border-black border-b border-neutral-400 ${
                              colorMode === "mono"
                                ? "border-l-4 border-l-black"
                                : "border-l-4 border-l-[#1a4d3e]"
                            } ${density === "compact" ? "p-2 sm:p-2.5" : "p-2.5 sm:p-3"}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span
                                  className={`font-black uppercase tracking-wider block ${
                                    density === "compact" ? "text-[9.5px]" : "text-[10px]"
                                  } ${colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"}`}
                                >
                                  Секция №${sec.id}
                                </span>
                                <h2
                                  className={`font-black text-black leading-snug ${
                                    density === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                                  }`}
                                >
                                  {sec.title}
                                </h2>
                                {sec.supervisor && (
                                  <p
                                    className={`text-neutral-700 mt-0.5 ${
                                      density === "compact" ? "text-[10px]" : "text-xs"
                                    }`}
                                  >
                                    Ответственный за секцию: <strong>{sec.supervisor}</strong>
                                  </p>
                                )}
                              </div>
                              <div
                                className={`font-bold text-black bg-white px-2 py-0.5 rounded border border-neutral-400 shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 whitespace-nowrap ${
                                  density === "compact" ? "text-[10px]" : "text-xs"
                                }`}
                              >
                                <MapPin className="size-3 text-black shrink-0" />
                                <span>Зал: <strong>{roomName}</strong> · {talksList.length} докл.</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Talks for this Section */}
                        {talksList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-3 text-center text-neutral-500 italic text-xs border-b border-neutral-300"
                            >
                              В данной секции пока нет запланированных выступлений.
                            </td>
                          </tr>
                        ) : (
                          talksList.map((talk, tIdx) => {
                            const durationMin =
                              talk.startTime && talk.endTime
                                ? Math.round(
                                    (new Date(talk.endTime).getTime() -
                                      new Date(talk.startTime).getTime()) /
                                      60000
                                  )
                                : talk.isKeynote
                                ? 15
                                : 10;

                            const timeFormatted =
                              talk.startTime && talk.endTime
                                ? `${fmt(talk.startTime)} – ${fmt(talk.endTime)}`
                                : "По графику";

                            const isKeynoteTalk = Boolean(talk.isKeynote);

                            return (
                              <tr
                                key={talk.id}
                                className={`align-top break-inside-avoid print:break-inside-avoid ${
                                  isKeynoteTalk
                                    ? colorMode === "mono"
                                      ? "bg-neutral-50"
                                      : "bg-amber-50/50"
                                    : "hover:bg-neutral-50/50"
                                }`}
                                style={{ pageBreakInside: "avoid" }}
                              >
                                <td
                                  className={`border-r border-b border-neutral-300 font-bold text-center text-black ${
                                    density === "compact" ? "p-1.5 text-xs" : "p-2 text-xs"
                                  }`}
                                >
                                  {isKeynoteTalk ? (
                                    <span className="inline-flex items-center justify-center gap-0.5 text-black font-extrabold">
                                      <Star className="size-3 fill-black text-black shrink-0" />
                                      <span>1</span>
                                    </span>
                                  ) : (
                                    tIdx + 1
                                  )}
                                </td>
                                <td
                                  className={`border-r border-b border-neutral-300 font-mono text-center whitespace-nowrap ${
                                    density === "compact" ? "p-1.5 text-[10.5px]" : "p-2 text-[11px]"
                                  }`}
                                >
                                  <span className="font-bold block text-black">
                                    {timeFormatted}
                                  </span>
                                  <span className="text-[10px] text-neutral-600 block">
                                    {durationMin} мин
                                  </span>
                                </td>
                                <td
                                  className={`border-r border-b border-neutral-300 space-y-1 ${
                                    density === "compact" ? "p-1.5" : "p-2"
                                  }`}
                                >
                                  {isKeynoteTalk && (
                                    <div
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black mb-0.5 ${
                                        density === "compact" ? "text-[9px]" : "text-[9.5px]"
                                      } ${
                                        colorMode === "mono"
                                          ? "bg-neutral-200 text-black border border-black"
                                          : "bg-amber-100 text-amber-950 border border-amber-300"
                                      }`}
                                    >
                                      <Star className="size-2.5 fill-current shrink-0" />
                                      <span>КЛЮЧЕВОЙ ДОКЛАД СЕКЦИИ (15 МИН, 1-я очередь)</span>
                                    </div>
                                  )}
                                  <div
                                    className={`font-bold text-black leading-snug ${
                                      density === "compact" ? "text-[11px]" : "text-xs"
                                    }`}
                                  >
                                    {talk.title}
                                  </div>
                                  <div
                                    className={`text-neutral-800 font-medium ${
                                      density === "compact" ? "text-[10px]" : "text-[11px]"
                                    }`}
                                  >
                                    <span>Докладчик: <strong>{talk.speakerName}</strong></span>
                                    {talk.gradeOrGroup && <span> (гр. {talk.gradeOrGroup})</span>}
                                    {talk.university && <span> · {talk.university}</span>}
                                  </div>
                                  {showCoAuthors && talk.coAuthors && talk.coAuthors.length > 0 && (
                                    <div
                                      className={`text-neutral-600 ${
                                        density === "compact" ? "text-[9.5px]" : "text-[10px]"
                                      }`}
                                    >
                                      Соавторы: <span className="italic">{talk.coAuthors.join(", ")}</span>
                                    </div>
                                  )}
                                  {includeAbstracts && talk.abstract && (
                                    <div
                                      className={`pt-1 text-neutral-700 leading-relaxed font-sans border-t border-dashed border-neutral-300 mt-1 ${
                                        density === "compact" ? "text-[9px]" : "text-[10px]"
                                      }`}
                                    >
                                      <strong>Тезисы: </strong>
                                      {talk.abstract}
                                    </div>
                                  )}
                                </td>
                                <td
                                  className={`border-b border-neutral-300 text-black ${
                                    density === "compact" ? "p-1.5 text-[10px]" : "p-2 text-[11px]"
                                  }`}
                                >
                                  {talk.supervisor ? (
                                    <strong>{talk.supervisor}</strong>
                                  ) : (
                                    <span className="text-neutral-400">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Official Footer Note */}
            <div
              className={`border-t-2 border-black text-center text-neutral-700 space-y-0.5 break-inside-avoid print:break-inside-avoid ${
                density === "compact" ? "pt-2.5 mt-3 text-[10px]" : "pt-4 mt-4 text-xs"
              }`}
            >
              <p>
                Оргкомитет конференции: тел. +996 (312) 54-51-62, email: conf@kstu.kg
              </p>
              <p className="italic text-[9.5px] text-neutral-500">
                Программа сформирована платформой ConfHub · Дата печати: {new Date().toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
