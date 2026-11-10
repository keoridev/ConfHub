import { useState, useMemo, useEffect, Fragment } from "react";
import { toast } from "sonner";
import {
  Printer,
  X,
  Calendar,
  MapPin,
  Clock,
  Star,
  ExternalLink,
  SlidersHorizontal,
  BookOpen,
  UserCheck,
  Eye,
  Layout,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import type { Section, SectionPrintCover, Talk } from "~entities/talk/model/types";
import { useSaveSectionPrintCoverMutation } from "~entities/talk/api/queries";
import { coAuthorLabels } from "~entities/talk/lib/coAuthors";
import { fmt } from "~pages/admin-page/lib/formatters";
import { useScheduleSettingsQuery } from "~entities/conference";

interface PrintProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  talks: Talk[];
  sections: Section[];
}

export type PaperFormat = "A4" | "A5" | "Letter" | "A3";
export type BorderStyle = "full" | "minimal" | "none";
export type PrintDensity = "normal" | "compact" | "tiny";
export type LayoutMode = "text" | "table";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const EMPTY_COVER: SectionPrintCover = { organization: "", heading: "", dedication: "", details: "" };

const splitLines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function PrintProgramModal({
  isOpen,
  onClose,
  talks,
  sections,
}: PrintProgramModalProps) {
  const { settings: { talkMinutes: talkMin, keynoteMinutes: keynoteMin } } = useScheduleSettingsQuery();
  // ── Paper & Print Setup ─────────────────────
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("text");
  const [paperFormat, setPaperFormat] = useState<PaperFormat>("A5");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [density, setDensity] = useState<PrintDensity>("compact");
  const [colorMode, setColorMode] = useState<"mono" | "color">("mono");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("none");

  // ── Booklet / Layout Enhancements ───────────
  const [isBookletMode, setIsBookletMode] = useState<boolean>(true);
  const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
  const [sectionPageBreaks, setSectionPageBreaks] = useState<boolean>(true);

  // ── Content Visibility Toggles ──────────────
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [showTime, setShowTime] = useState<boolean>(true);
  const [showSupervisor, setShowSupervisor] = useState<boolean>(true);
  const [showRoom, setShowRoom] = useState<boolean>(true);
  const [showSectionSupervisor, setShowSectionSupervisor] = useState<boolean>(true);
  const [showKeynoteBadge, setShowKeynoteBadge] = useState<boolean>(true);
  const [showCoAuthors, setShowCoAuthors] = useState<boolean>(true);
  const [includeAbstracts, setIncludeAbstracts] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(true);

  // ── Preset Helpers ──────────────────────────
  const applyContinuousTextBookletPreset = () => {
    setLayoutMode("text");
    setIsBookletMode(true);
    setPaperFormat("A5");
    setOrientation("portrait");
    setDensity("compact");
    setBorderStyle("none");
    setShowCoverPage(true);
    setSectionPageBreaks(true);
    setShowTime(true);
    setShowSupervisor(true);
    setShowRoom(true);
    setShowSectionSupervisor(true);
    setShowKeynoteBadge(true);
  };

  const applyContinuousTextA4Preset = () => {
    setLayoutMode("text");
    setIsBookletMode(false);
    setPaperFormat("A4");
    setOrientation("portrait");
    setDensity("normal");
    setBorderStyle("none");
    setShowCoverPage(false);
    setSectionPageBreaks(false);
    setShowTime(true);
    setShowSupervisor(true);
    setShowRoom(true);
    setShowSectionSupervisor(true);
    setShowKeynoteBadge(true);
  };

  const applyA4StandardPreset = () => {
    setLayoutMode("table");
    setIsBookletMode(false);
    setPaperFormat("A4");
    setOrientation("portrait");
    setDensity("normal");
    setBorderStyle("full");
    setShowCoverPage(false);
    setSectionPageBreaks(false);
    setShowTime(true);
    setShowSupervisor(true);
    setShowRoom(true);
    setShowSectionSupervisor(true);
    setShowKeynoteBadge(true);
  };

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

  // A single chosen section gets its own cover page and header
  const coverSectionIndex = sections.findIndex((s) => String(s.id) === selectedSectionId);
  const coverSection = coverSectionIndex >= 0 ? sections[coverSectionIndex] : null;
  const coverSectionNo = coverSection ? coverSection.sortOrder || coverSectionIndex + 1 : 0;

  // Custom cover wording for the chosen section (e.g. a partner round table).
  // The draft drives the preview and print; "Сохранить" stores it for next time.
  const [coverDraft, setCoverDraft] = useState<SectionPrintCover>(EMPTY_COVER);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const savedCover = coverSection?.printCover;
  useEffect(() => {
    setCoverDraft(savedCover ? { ...EMPTY_COVER, ...savedCover } : EMPTY_COVER);
  }, [coverSection?.id, savedCover]);
  const saveCoverMutation = useSaveSectionPrintCoverMutation();
  const isCoverDirty = JSON.stringify(coverDraft) !== JSON.stringify(savedCover ? { ...EMPTY_COVER, ...savedCover } : EMPTY_COVER);

  const cover = coverSection ? coverDraft : EMPTY_COVER;
  // A section with its own heading gets a cover like its own document:
  // no ministry/МУИТ block, no conference title, dedication as a line under the heading.
  const coverOrgLines = splitLines(cover.organization);
  const coverHeadingLines = splitLines(cover.heading);
  const coverDetailLines = splitLines(cover.details);
  const coverDedicationText = cover.dedication.trim();
  const isCustomCover = coverHeadingLines.length > 0;

  const handleSaveCover = async (next: SectionPrintCover) => {
    if (!coverSection) return;
    try {
      await saveCoverMutation.mutateAsync({ sectionId: coverSection.id, cover: next });
      toast.success("Титульный лист секции сохранён");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Не удалось сохранить титульный лист");
    }
  };

  const totalFilteredTalks = useMemo(() => {
    return sectionGroups.reduce((acc, g) => acc + g.talks.length, 0);
  }, [sectionGroups]);

  const totalKeynotes = useMemo(() => {
    return sectionGroups.reduce(
      (acc, g) => acc + g.talks.filter((t) => !!t.isKeynote).length,
      0
    );
  }, [sectionGroups]);

  // Compute column count
  const columnCount = useMemo(() => {
    let count = 2; // № + Тема/автор
    if (showTime) count++;
    if (showSupervisor) count++;
    return count;
  }, [showTime, showSupervisor]);

  // Preview container max-width matching selected format
  const previewMaxWidthClass = useMemo(() => {
    if (paperFormat === "A5") {
      return orientation === "landscape" ? "max-w-[210mm]" : "max-w-[148mm]";
    }
    if (paperFormat === "A3") {
      return orientation === "landscape" ? "max-w-[420mm]" : "max-w-[297mm]";
    }
    if (paperFormat === "Letter") {
      return orientation === "landscape" ? "max-w-[279mm]" : "max-w-[216mm]";
    }
    // A4
    return orientation === "landscape" ? "max-w-[297mm]" : "max-w-[210mm]";
  }, [paperFormat, orientation]);

  if (!isOpen) return null;

  // ── Clean Window Printing ───────────────────
  const handleOpenCleanPrint = () => {
    const win = window.open("", "_blank");
    if (!win) {
      window.print();
      return;
    }

    const isMono = colorMode === "mono";
    const isLandscape = orientation === "landscape";

    // Dynamic sizing variables based on paperFormat & density
    const isA5 = paperFormat === "A5";
    const isA3 = paperFormat === "A3";

    let baseFont = "11px";
    let smallFont = "10px";
    let titleFont = "15px";
    let cellPad = "6px 8px";
    let pageMargin = "10mm";

    if (isA5) {
      baseFont = density === "tiny" ? "8px" : density === "compact" ? "9px" : "9.5px";
      smallFont = density === "tiny" ? "7.5px" : "8px";
      titleFont = "13px";
      cellPad = density === "tiny" ? "2.5px 4px" : "3.5px 5px";
      pageMargin = "6mm";
    } else if (isA3) {
      baseFont = "13px";
      smallFont = "11.5px";
      titleFont = "20px";
      cellPad = "9px 12px";
      pageMargin = "12mm";
    } else {
      // A4 / Letter
      if (density === "compact") {
        baseFont = "10px";
        smallFont = "9px";
        titleFont = "14px";
        cellPad = "4px 6px";
        pageMargin = "7mm";
      } else if (density === "tiny") {
        baseFont = "9px";
        smallFont = "8px";
        titleFont = "13px";
        cellPad = "3px 4px";
        pageMargin = "5mm";
      }
    }

    // Border CSS rules based on borderStyle
    let tableBorderCss = "border: 1.5px solid #000;";
    let thBorderCss = "border: 1px solid #000;";
    let tdBorderCss = "border-right: 1px solid #ccc; border-bottom: 1px solid #bbb;";
    let secBannerBorderCss = `border-top: 2px solid #000; border-bottom: 1.5px solid #333; border-left: 5px solid ${isMono ? "#000" : "#1a4d3e"};`;

    if (borderStyle === "minimal") {
      tableBorderCss = "border-top: 2px solid #000; border-bottom: 2px solid #000; border-left: none; border-right: none;";
      thBorderCss = "border-bottom: 1.5px solid #000; border-top: none; border-left: none; border-right: none;";
      tdBorderCss = "border-bottom: 1px solid #ddd; border-top: none; border-left: none; border-right: none;";
      secBannerBorderCss = `border-top: 1.5px solid #000; border-bottom: 1px solid #999; border-left: 3px solid ${isMono ? "#000" : "#1a4d3e"};`;
    } else if (borderStyle === "none") {
      tableBorderCss = "border: none;";
      thBorderCss = "border-bottom: 1.5px solid #333; border-top: none; border-left: none; border-right: none;";
      tdBorderCss = "border: none; border-bottom: 1px solid #f0f0f0;";
      secBannerBorderCss = "border-top: 1px solid #ccc; border-bottom: none; border-left: none;";
    }

    const tableRowsHtml = sectionGroups
      .map((group, groupIdx) => {
        const sec = group.section;
        const talksList = group.talks;
        const roomName =
          talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

        const secBannerBg = isMono ? "#f3f4f6" : "#f1f5f9";
        const pageBreakBefore =
          sectionPageBreaks && (groupIdx > 0 || showCoverPage)
            ? "page-break-before: always; break-before: page;"
            : "";

        const sectionBannerRow = `
          <tr class="section-row" style="${pageBreakBefore} background: ${secBannerBg}; page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
            <td colspan="${columnCount}" style="${secBannerBorderCss} padding: ${cellPad};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                  <div style="font-size: ${smallFont}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: ${isMono ? "#000" : "#1a4d3e"};">
                    СЕКЦИЯ №${sec.id}
                  </div>
                  <div style="font-size: ${titleFont}; font-weight: 900; color: #000; line-height: 1.25; margin-top: 1px;">
                    ${sec.title}
                  </div>
                  ${
                    showSectionSupervisor && sec.supervisor
                      ? `<div style="font-size: ${smallFont}; color: #333; margin-top: 2px;">
                          Ответственный за секцию: <strong>${sec.supervisor}</strong>
                        </div>`
                      : ""
                  }
                </div>
                ${
                  showRoom
                    ? `<div style="font-size: ${smallFont}; font-weight: bold; background: #fff; border: 1px solid #999; padding: 2px 7px; border-radius: 3px; white-space: nowrap; text-align: right; shrink-0;">
                        Зал: <strong>${roomName}</strong> · ${talksList.length} докл.
                      </div>`
                    : ""
                }
              </div>
            </td>
          </tr>
        `;

        if (talksList.length === 0) {
          return (
            sectionBannerRow +
            `<tr>
              <td colspan="${columnCount}" style="padding: 10px; text-align: center; color: #666; font-size: ${smallFont}; border-bottom: 1px solid #ccc;">
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

            const keynoteBadge =
              showKeynoteBadge && talk.isKeynote
                ? isMono
                  ? `<div style="display: inline-block; margin-bottom: 2px; background: #eee; color: #000; border: 1px solid #000; padding: 1px 5px; font-size: ${smallFont}; font-weight: 800; border-radius: 2px;">
                      ★ КЛЮЧЕВОЙ ДОКЛАД СЕКЦИИ (15 МИН, 1-я очередь)
                    </div>`
                  : `<div style="display: inline-block; margin-bottom: 2px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 1px 5px; font-size: ${smallFont}; font-weight: 800; border-radius: 2px;">
                      ★ КЛЮЧЕВОЙ ДОКЛАД СЕКЦИИ (15 МИН, 1-я очередь)
                    </div>`
                : "";

            const coAuthorsHtml =
              showCoAuthors && talk.coAuthors && talk.coAuthors.length > 0
                ? `<div style="font-size: ${smallFont}; color: #444; margin-top: 1.5px;">
                    Соавторы: <i>${coAuthorLabels(talk.coAuthors).join(", ")}</i>
                  </div>`
                : "";

            const abstractBlock =
              includeAbstracts && talk.abstract
                ? `<div style="font-size: ${smallFont}; color: #333; margin-top: 3px; padding-top: 3px; border-top: 1px dashed #ccc; line-height: 1.35;">
                    <strong>Тезисы:</strong> ${talk.abstract}
                  </div>`
                : "";

            const rowBg = talk.isKeynote
              ? isMono
                ? "background-color: #fbfbfb;"
                : "background-color: #fffdf5;"
              : "";

            return `
              <tr style="${rowBg} page-break-inside: avoid; break-inside: avoid;">
                <td style="${tdBorderCss} padding: ${cellPad}; text-align: center; font-weight: bold; width: 32px; font-size: ${baseFont};">
                  ${talk.isKeynote ? "★ 1" : idx + 1}
                </td>
                ${
                  showTime
                    ? `<td style="${tdBorderCss} padding: ${cellPad}; text-align: center; width: 95px; font-family: monospace; font-size: ${baseFont};">
                        <strong style="color: #000;">${timeStr}</strong><br/>
                        <span style="font-size: ${smallFont}; color: #555;">${durationMin} мин</span>
                      </td>`
                    : ""
                }
                <td style="${tdBorderCss} padding: ${cellPad};">
                  ${keynoteBadge}
                  <div style="font-size: ${baseFont}; font-weight: bold; color: #000; line-height: 1.25;">
                    ${talk.title}
                  </div>
                  <div style="font-size: ${smallFont}; color: #222; margin-top: 2px;">
                    Докладчик: <strong>${talk.speakerName}</strong>
                    ${talk.gradeOrGroup ? ` (гр. ${talk.gradeOrGroup})` : ""}
                    ${talk.university ? ` · ${talk.university}` : ""}
                  </div>
                  ${coAuthorsHtml}
                  ${abstractBlock}
                </td>
                ${
                  showSupervisor
                    ? `<td style="${tdBorderCss} padding: ${cellPad}; width: 135px; font-size: ${baseFont}; color: #000;">
                        ${talk.supervisor ? `<strong>${talk.supervisor}</strong>` : `<span style="color: #888;">—</span>`}
                      </td>`
                    : ""
                }
              </tr>
            `;
          })
          .join("");

        return sectionBannerRow + talkRows;
      })
      .join("");

    const textFlowHtml = sectionGroups
      .map((group, groupIdx) => {
        const sec = group.section;
        const talksList = group.talks;
        const roomName =
          talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

        const pageBreakBefore =
          sectionPageBreaks && (groupIdx > 0 || showCoverPage)
            ? "page-break-before: always; break-before: page;"
            : "";

        const secHeaderHtml = `
          <div style="${pageBreakBefore} margin-top: ${groupIdx === 0 ? "0" : "24px"}; margin-bottom: 14px; border-bottom: 2px solid #000; padding-bottom: 5px; page-break-inside: avoid; break-inside: avoid; page-break-after: avoid; break-after: avoid;">
            <div style="font-size: ${smallFont}; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: ${isMono ? "#000" : "#1a4d3e"};">
              СЕКЦИЯ №${sec.id}
            </div>
            <div style="font-size: ${titleFont}; font-weight: 900; color: #000; line-height: 1.25; margin-top: 2px;">
              ${sec.title}
            </div>
            <div style="font-size: ${smallFont}; color: #333; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 8px;">
              ${showRoom ? `<span>Аудитория: <strong>${roomName}</strong></span>` : ""}
              ${showSectionSupervisor && sec.supervisor ? `<span>• Руководитель секции: <strong>${sec.supervisor}</strong></span>` : ""}
              <span>• Докладов: <strong>${talksList.length}</strong></span>
            </div>
          </div>
        `;

        if (talksList.length === 0) {
          return (
            secHeaderHtml +
            `<p style="color: #666; font-style: italic; font-size: ${smallFont}; margin: 6px 0 16px 0;">
              В данной секции пока нет запланированных докладов.
            </p>`
          );
        }

        const talksTextHtml = talksList
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

            const keynoteBadge =
              showKeynoteBadge && talk.isKeynote
                ? `<span style="font-size: ${smallFont}; font-weight: 800; background: ${isMono ? "#eee" : "#fef3c7"}; color: ${isMono ? "#000" : "#92400e"}; padding: 1px 5px; border-radius: 2px; text-transform: uppercase; margin-left: 4px;">★ Ключевой доклад</span>`
                : "";

            const coAuthorsHtml =
              showCoAuthors && talk.coAuthors && talk.coAuthors.length > 0
                ? `<div style="font-size: ${smallFont}; color: #555; margin-top: 1px;">
                    Соавторы: <i>${coAuthorLabels(talk.coAuthors).join(", ")}</i>
                  </div>`
                : "";

            const abstractBlock =
              includeAbstracts && talk.abstract
                ? `<div style="font-size: ${smallFont}; color: #333; margin-top: 3px; text-align: justify; text-indent: 1.2em; line-height: 1.35;">
                    ${talk.abstract}
                  </div>`
                : "";

            return `
              <div class="talk-entry" style="margin-bottom: 12px; page-break-inside: avoid; break-inside: avoid; line-height: 1.35; ${borderStyle === "minimal" ? "border-bottom: 1px dashed #ccc; padding-bottom: 8px;" : ""}">
                <div style="font-size: ${baseFont}; font-weight: 800; color: #000;">
                  ${idx + 1}. ${talk.title} ${keynoteBadge}
                </div>
                <div style="font-size: ${smallFont}; color: #222; margin-top: 2px;">
                  ${showTime ? `<span style="font-family: monospace; font-weight: bold; margin-right: 6px;">[${timeStr}, ${durationMin} мин]</span>` : ""}
                  Докладчик: <strong>${talk.speakerName}</strong>
                  ${talk.gradeOrGroup ? ` (гр. ${talk.gradeOrGroup})` : ""}
                  ${talk.university ? ` · ${talk.university}` : ""}
                </div>
                ${coAuthorsHtml}
                ${showSupervisor && talk.supervisor ? `<div style="font-size: ${smallFont}; color: #333; margin-top: 1px;">Научный руководитель: <strong>${talk.supervisor}</strong></div>` : ""}
                ${abstractBlock}
              </div>
            `;
          })
          .join("");

        return `
          <div class="section-text-block" style="margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
            ${secHeaderHtml}
            ${talksTextHtml}
          </div>
        `;
      })
      .join("");

    const coverPageHtml = showCoverPage
      ? `
        <div class="cover-page" style="page-break-after: always; break-after: page; min-height: 85vh; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 30px 15px; border: ${borderStyle !== "none" ? "2px double #1a4d3e" : "none"}; margin-bottom: 20px;">
          <div>
            ${
              coverOrgLines.length > 0
                ? coverOrgLines
                    .map(
                      (line) =>
                        `<p style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #000; margin: 0 0 3px 0;">${escapeHtml(line)}</p>`
                    )
                    .join("")
                : `<p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${isMono ? "#000" : "#1a4d3e"}; margin: 0 0 4px 0;">
                    Министерство науки, высшего образования и инноваций КР
                  </p>
                  <p style="font-size: 12px; font-weight: 900; color: #111; margin: 0;">
                    Международный университет инновационных технологий (МУИТ)
                  </p>`
            }
          </div>

          ${
            isCustomCover
              ? `<div style="margin: 40px 0;">
                  ${coverHeadingLines
                    .map(
                      (line, i) =>
                        `<p style="font-size: ${i === 0 ? 16 : 15}px; font-weight: 900; line-height: 1.35; text-transform: uppercase; color: #000; margin: 0 0 ${i === 0 ? 18 : 4}px 0;">${escapeHtml(line)}</p>`
                    )
                    .join("")}
                  ${
                    coverDedicationText
                      ? `<p style="font-size: 15px; font-weight: 900; text-transform: uppercase; color: #000; margin: 0;">${escapeHtml(coverDedicationText)}</p>`
                      : ""
                  }
                  <div style="margin-top: 28px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #333; border-top: 1px solid #bbb; border-bottom: 1px solid #bbb; padding: 6px 0; display: inline-block; min-width: 200px;">
                    ПРОГРАММА
                  </div>
                </div>`
              : `<div style="margin: 40px 0;">
                  <div style="display: inline-block; padding: 4px 12px; border: 1px solid #777; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-radius: 4px; margin-bottom: 16px;">
                    ${escapeHtml(coverDedicationText || "Посвящается Дню науки")}
                  </div>
                  <h1 style="font-size: 18px; font-weight: 900; line-height: 1.3; margin: 0 0 10px 0; color: #000;">
                    XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС
                  </h1>
                  <h2 style="font-size: 22px; font-weight: 900; color: ${isMono ? "#000" : "#1a4d3e"}; margin: 0 0 16px 0;">
                    «ИННОВАЦИОННЫЕ ТЕХНОЛОГИИ И ПЕРЕДОВЫЕ РЕШЕНИЯ»
                  </h2>
                  <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #333; border-top: 1px solid #bbb; border-bottom: 1px solid #bbb; padding: 6px 0; display: inline-block; min-width: 200px;">
                    ${coverSection ? "ПРОГРАММА ЗАСЕДАНИЯ СЕКЦИИ" : "ПРОГРАММА И РЕГЛАМЕНТ ЗАСЕДАНИЙ"}
                  </div>
                  ${
                    coverSection
                      ? `<div style="margin: 20px auto 0 auto; max-width: 92%; padding: 14px 16px; border: 2px solid ${isMono ? "#000" : "#1a4d3e"}; border-radius: 8px;">
                          <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: #555; margin: 0 0 6px 0;">
                            Секция № ${coverSectionNo}
                          </p>
                          <p style="font-size: 17px; font-weight: 900; line-height: 1.3; color: ${isMono ? "#000" : "#1a4d3e"}; margin: 0;">
                            ${escapeHtml(coverSection.title)}
                          </p>
                          ${
                            coverSection.supervisor
                              ? `<p style="font-size: 11px; color: #333; margin: 8px 0 0 0;">Руководитель секции: <strong>${escapeHtml(coverSection.supervisor)}</strong></p>`
                              : ""
                          }
                        </div>`
                      : ""
                  }
                </div>`
          }

          <div>
            ${
              coverDetailLines.length > 0
                ? coverDetailLines
                    .map((line) => `<p style="font-size: 11px; margin: 0 0 3px 0;">${escapeHtml(line)}</p>`)
                    .join("")
                : `<p style="font-size: 11px; font-weight: bold; margin: 0 0 4px 0;">
                    10 – 18 ноября 2026 года
                  </p>
                  <p style="font-size: 10px; color: #555; margin: 0;">
                    МУИТ, г. Бишкек · Очно и онлайн
                  </p>`
            }
          </div>
        </div>
      `
      : "";

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Программа конференции — Официальный регламент (${paperFormat})</title>
        <style>
          @page {
            size: ${paperFormat} ${isLandscape ? "landscape" : "portrait"};
            margin: ${pageMargin};
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 2px;
            color: #000000;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-box {
            text-align: center;
            border-bottom: 2px solid #000000;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .header-inst {
            font-size: ${smallFont};
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: ${isMono ? "#000" : "#1a4d3e"};
            margin: 0 0 2px 0;
          }
          .header-title {
            font-size: ${titleFont};
            font-weight: 900;
            margin: 0 0 2px 0;
            line-height: 1.25;
            color: #000000;
          }
          .header-sub {
            font-size: ${baseFont};
            font-weight: bold;
            color: ${isMono ? "#222" : "#8a6d1c"};
            margin: 0 0 4px 0;
          }
          .header-meta {
            font-size: ${smallFont};
            color: #111111;
            margin-top: 3px;
          }
          .summary-bar {
            display: inline-block;
            margin-top: 4px;
            padding: 2px 8px;
            background: #f4f4f4;
            border: 1px solid #999;
            font-size: ${smallFont};
            font-weight: bold;
            border-radius: 3px;
          }
          table.program-table {
            width: 100%;
            border-collapse: collapse;
            font-size: ${baseFont};
            ${tableBorderCss}
          }
          table.program-table thead {
            display: table-header-group;
          }
          table.program-table th {
            background-color: ${isMono ? "#000000" : "#0f172a"};
            color: #ffffff;
            font-weight: bold;
            padding: ${cellPad};
            text-align: left;
            ${thBorderCss}
            font-size: ${smallFont};
          }
          table.program-table th.center {
            text-align: center;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .footer-note {
            margin-top: 10px;
            padding-top: 6px;
            border-top: 1px solid #888;
            text-align: center;
            font-size: ${smallFont};
            color: #444;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${coverPageHtml}

        <div class="header-box">
          <p class="header-inst">
            ${
              coverOrgLines.length > 0
                ? coverOrgLines.map(escapeHtml).join(" &nbsp;•&nbsp; ")
                : "Министерство науки, высшего образования и инноваций КР &nbsp;•&nbsp; МУИТ"
            }
          </p>
          ${
            coverHeadingLines.length > 0
              ? `<h1 class="header-title">${escapeHtml(coverHeadingLines[0])}</h1>
                ${coverHeadingLines
                  .slice(1)
                  .map((line) => `<p class="header-sub">${escapeHtml(line)}</p>`)
                  .join("")}`
              : `<h1 class="header-title">
                  XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС
                </h1>
                <p class="header-sub">
                  «ИННОВАЦИОННЫЕ ТЕХНОЛОГИИ И ПЕРЕДОВЫЕ РЕШЕНИЯ»
                </p>`
          }
          ${
            coverSection && coverHeadingLines.length === 0
              ? `<p style="font-size: 13px; font-weight: 900; color: ${isMono ? "#000" : "#1a4d3e"}; margin: 6px 0 2px 0;">
                  Секция № ${coverSectionNo}: ${escapeHtml(coverSection.title)}
                </p>`
              : ""
          }
          <div class="header-meta">
            ${
              coverDetailLines.length > 0
                ? coverDetailLines.map(escapeHtml).join(" &nbsp;•&nbsp; ")
                : `<strong>Дата:</strong> 10 – 18 ноября 2026 г. &nbsp;•&nbsp;
                  <strong>Место:</strong> МУИТ, г. Бишкек (очно и онлайн)`
            }
            ${showTime ? `&nbsp;•&nbsp; <strong>Регламент:</strong> Ключевой доклад — ${keynoteMin} мин, секционный — ${talkMin} мин` : ""}
          </div>
          ${
            showStats
              ? `<div class="summary-bar">
                  Всего докладов в программе: <strong>${totalFilteredTalks}</strong> &nbsp;•&nbsp;
                  Секций: <strong>${sectionGroups.length}</strong> &nbsp;•&nbsp;
                  Ключевых докладов (1-я очередь): <strong>${totalKeynotes}</strong>
                </div>`
              : ""
          }
        </div>

        ${
          layoutMode === "text"
            ? `<div class="program-text-flow" style="margin-top: 15px;">${textFlowHtml}</div>`
            : `<table class="program-table">
                <thead>
                  <tr>
                    <th class="center" style="width: 32px;">№</th>
                    ${showTime ? `<th class="center" style="width: 95px;">Время</th>` : ""}
                    <th>Тема доклада и автор(ы)</th>
                    ${showSupervisor ? `<th style="width: 135px;">Науч. руководитель</th>` : ""}
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHtml}
                </tbody>
              </table>`
        }

        <div class="footer-note">
          Оргкомитет: Международный университет инновационных технологий (МУИТ) · email: conf@intuit.kg · ConfHub 2026 · Формат: ${paperFormat} (${orientation === "landscape" ? "Альбомный" : "Книжный"}) · Дата формирования: ${new Date().toLocaleDateString("ru-RU")}
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
      {/* Dynamic Print CSS for direct Ctrl+P */}
      <style>{`
        @media print {
          @page {
            size: ${paperFormat} ${orientation};
            margin: ${density === "tiny" ? "5mm" : density === "compact" ? "7mm" : "10mm"};
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
        }
      `}</style>

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-[#1a4d3e]/20 max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        {/* Modal Controls Toolbar */}
        <div className="print:hidden p-4 sm:p-5 border-b border-[#1a4d3e]/15 bg-[#fbfaf7] flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#1a4d3e] text-white shadow-xs">
                <Printer className="size-5 text-[#d4a84b]" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#1a4d3e] flex items-center gap-2">
                  <span>Печать программы и брошюры-книжки</span>
                  {isBookletMode && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase tracking-wider">
                      Режим «Книжка»
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Форматы А4, А5, Letter, рамки, обложка и фильтры полей для полиграфии
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCleanPrint}
                className="px-4 py-2 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                title="Открыть идеально сверстанный документ для печати или сохранения в PDF"
              >
                <ExternalLink className="size-4 text-[#d4a84b]" />
                <span>Печать / Экспорт в PDF ({paperFormat})</span>
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

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#1a4d3e]/10">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <BookOpen className="size-3.5 text-[#d4a84b]" />
                <span>Шаблоны в 1 клик:</span>
              </span>
              <button
                type="button"
                onClick={applyContinuousTextBookletPreset}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "text" && isBookletMode && paperFormat === "A5"
                    ? "bg-[#1a4d3e] text-white border-[#1a4d3e] shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="size-3" />
                <span>Сплошной текст (Книжка А5)</span>
              </button>
              <button
                type="button"
                onClick={applyContinuousTextA4Preset}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "text" && !isBookletMode && paperFormat === "A4"
                    ? "bg-[#1a4d3e] text-white border-[#1a4d3e] shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <Layout className="size-3" />
                <span>Сплошной текст (А4)</span>
              </button>
              <button
                type="button"
                onClick={applyA4StandardPreset}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  layoutMode === "table"
                    ? "bg-[#1a4d3e] text-white border-[#1a4d3e] shadow-xs"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                }`}
              >
                <FileSpreadsheet className="size-3" />
                <span>Таблица (Официальный А4)</span>
              </button>
            </div>

            {/* Filter by section */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-600" title="Титульный лист и программа будут только для выбранной секции">
                Секция:
              </span>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-[#1a4d3e]/20 bg-white font-semibold text-[#1a4d3e] focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">Все секции ({sections.length})</option>
                {sections.map((s, i) => (
                  <option key={s.id} value={String(s.id)}>
                    №{s.sortOrder || i + 1}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section cover wording (saved per section) */}
          {coverSection && (
            <div className="pt-2 border-t border-[#1a4d3e]/10">
              <button
                type="button"
                onClick={() => setIsCoverEditorOpen((v) => !v)}
                aria-expanded={isCoverEditorOpen}
                className={`w-full flex items-center gap-3 px-3 py-2.5 border-2 text-left cursor-pointer transition-colors ${
                  isCoverEditorOpen
                    ? "rounded-t-xl border-[#d4a84b] bg-[#d4a84b]/20"
                    : "rounded-xl border-[#d4a84b]/60 bg-[#d4a84b]/10 hover:bg-[#d4a84b]/20"
                }`}
              >
                <span className="size-8 rounded-lg bg-[#d4a84b] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="size-4" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#1a4d3e]">
                    Титульный лист секции №{coverSectionNo}
                    {savedCover && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                        свой текст
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-[#1a4d3e]/70 truncate">
                    {savedCover
                      ? "Шапка, заголовок и дата этой секции — нажмите, чтобы изменить"
                      : "Сейчас общий титульник конференции — нажмите, чтобы задать свой"}
                  </span>
                </span>
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1a4d3e] text-white text-xs font-bold">
                  <span className="hidden sm:inline">{isCoverEditorOpen ? "Свернуть" : "Настроить"}</span>
                  <ChevronDown className={`size-4 transition-transform ${isCoverEditorOpen ? "rotate-180" : ""}`} />
                </span>
              </button>
              {isCoverEditorOpen && (
              <div className="p-3 rounded-b-xl border-2 border-t-0 border-[#d4a84b] bg-[#d4a84b]/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-600">Шапка вместо «Министерство… / МУИТ» (каждая строка отдельно)</span>
                  <textarea
                    rows={2}
                    value={coverDraft.organization}
                    onChange={(e) => setCoverDraft((c) => ({ ...c, organization: e.target.value }))}
                    placeholder="Например: РОССИЙСКО-КЫРГЫЗСКИЙ ИНСТИТУТ АВТОМАТИЗАЦИИ УПРАВЛЕНИЯ БИЗНЕСА"
                    className="px-2.5 py-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] resize-y"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-600">Посвящение (строка под заголовком)</span>
                  <input
                    value={coverDraft.dedication}
                    onChange={(e) => setCoverDraft((c) => ({ ...c, dedication: e.target.value }))}
                    placeholder="Посвящается Дню науки"
                    className="px-2.5 py-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-600">Заголовок вместо названия конференции (каждая строка отдельно)</span>
                  <textarea
                    rows={3}
                    value={coverDraft.heading}
                    onChange={(e) => setCoverDraft((c) => ({ ...c, heading: e.target.value }))}
                    placeholder={"МЕЖДУНАРОДНЫЙ НАУЧНЫЙ КРУГЛЫЙ СТОЛ\n«НАЗВАНИЕ»"}
                    className="px-2.5 py-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] resize-y"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-semibold text-slate-600">Дата, время, место (каждая строка отдельно)</span>
                  <textarea
                    rows={3}
                    value={coverDraft.details}
                    onChange={(e) => setCoverDraft((c) => ({ ...c, details: e.target.value }))}
                    placeholder={"Дата проведения: 12.11.2026, 10:00\nМесто: НИБ МУИТ (4 этаж)"}
                    className="px-2.5 py-1.5 rounded-lg border border-[#1a4d3e]/20 bg-white text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] resize-y"
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                <span className="mr-auto text-slate-500">
                  Если заполнен заголовок, титульник печатается как отдельное мероприятие — без блока конференции. Пустые поля — как у общей программы.
                </span>
                {savedCover && (
                  <button
                    type="button"
                    onClick={() => handleSaveCover(EMPTY_COVER)}
                    disabled={saveCoverMutation.isPending}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
                  >
                    Вернуть по умолчанию
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSaveCover(coverDraft)}
                  disabled={saveCoverMutation.isPending || !isCoverDirty}
                  className="px-3 py-1.5 rounded-lg bg-[#1a4d3e] text-white font-bold hover:bg-[#143d31] cursor-pointer disabled:opacity-50"
                >
                  {saveCoverMutation.isPending ? "Сохранение..." : "Сохранить для секции"}
                </button>
              </div>
              </div>
              )}
            </div>
          )}

          {/* Granular Controls: Format, Borders, Density, Color, Toggles */}
          <div className="pt-2 border-t border-[#1a4d3e]/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {/* 1. Format & Orientation */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 w-full text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Layout className="size-3 text-[#1a4d3e]" />
                <span>Формат и ориентация:</span>
              </span>

              {/* Paper Format */}
              <select
                value={paperFormat}
                onChange={(e) => {
                  setPaperFormat(e.target.value as PaperFormat);
                  if (e.target.value === "A5") setIsBookletMode(true);
                }}
                className="px-2 py-1 rounded-md border border-slate-300 bg-slate-50 font-bold text-slate-800 cursor-pointer"
              >
                <option value="A4">Формат А4 (210×297 мм)</option>
                <option value="A5">Формат А5 (Книжка, 148×210 мм)</option>
                <option value="Letter">Letter (US, 216×279 мм)</option>
                <option value="A3">Формат А3 (Стенд, 297×420 мм)</option>
              </select>

              {/* Orientation */}
              <div className="inline-flex p-0.5 rounded-md border border-slate-300 bg-slate-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    orientation === "portrait"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Книжная
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    orientation === "landscape"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Альбомная
                </button>
              </div>

              {/* Density */}
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as PrintDensity)}
                className="px-2 py-1 rounded-md border border-slate-300 bg-slate-50 text-slate-800 font-semibold cursor-pointer"
              >
                <option value="normal">Шрифт: Стандартный</option>
                <option value="compact">Шрифт: Компактный</option>
                <option value="tiny">Шрифт: Мелкий (для брошюр)</option>
              </select>
            </div>

            {/* 2. Layout Mode & Borders */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 w-full text-[11px] uppercase tracking-wider flex items-center gap-1">
                <SlidersHorizontal className="size-3 text-[#1a4d3e]" />
                <span>Вид и оформление:</span>
              </span>

              {/* Layout Mode Selector */}
              <div className="inline-flex p-0.5 rounded-md border border-slate-300 bg-slate-50 text-[11px] w-full mb-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("text");
                    setBorderStyle("none");
                  }}
                  className={`flex-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors text-center ${
                    layoutMode === "text"
                      ? "bg-[#1a4d3e] text-white shadow-xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                  title="Сплошной книжный текст без рамок"
                >
                  📖 Сплошной текст
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode("table");
                    if (borderStyle === "none") setBorderStyle("full");
                  }}
                  className={`flex-1 px-2 py-0.5 rounded font-bold cursor-pointer transition-colors text-center ${
                    layoutMode === "table"
                      ? "bg-[#1a4d3e] text-white shadow-xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                  title="Таблица с колонками"
                >
                  📊 Таблица
                </button>
              </div>

              {/* Border Style Toggle */}
              <div className="inline-flex p-0.5 rounded-md border border-slate-300 bg-slate-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setBorderStyle("full")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    borderStyle === "full"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                  title="Классическая полная сетка со всеми рамками"
                >
                  Сетка
                </button>
                <button
                  type="button"
                  onClick={() => setBorderStyle("minimal")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    borderStyle === "minimal"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                  title="Только горизонтальные линии (книжный стиль)"
                >
                  Легкие
                </button>
                <button
                  type="button"
                  onClick={() => setBorderStyle("none")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    borderStyle === "none"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                  title="Без рамок — чистый книжный стиль"
                >
                  Без рамок
                </button>
              </div>

              {/* Color Mode */}
              <div className="inline-flex p-0.5 rounded-md border border-slate-300 bg-slate-50 text-[11px]">
                <button
                  type="button"
                  onClick={() => setColorMode("mono")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    colorMode === "mono"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Ч/Б
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode("color")}
                  className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                    colorMode === "color"
                      ? "bg-[#1a4d3e] text-white"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  Цветной
                </button>
              </div>

              {/* Booklet specifics */}
              <label className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-300 bg-slate-50 font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 text-[11px]">
                <input
                  type="checkbox"
                  checked={showCoverPage}
                  onChange={(e) => setShowCoverPage(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Титульный лист (обложка)</span>
              </label>

              <label className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-slate-300 bg-slate-50 font-semibold text-slate-800 cursor-pointer hover:bg-slate-100 text-[11px]">
                <input
                  type="checkbox"
                  checked={sectionPageBreaks}
                  onChange={(e) => setSectionPageBreaks(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Секция с новой страницы</span>
              </label>
            </div>

            {/* 3. Content Visibility: What to show / hide */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
              <span className="font-bold text-slate-700 w-full text-[11px] uppercase tracking-wider flex items-center gap-1">
                <Eye className="size-3 text-[#1a4d3e]" />
                <span>Что включить в распечатку:</span>
              </span>

              {/* Time Toggle */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showTime
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showTime}
                  onChange={(e) => setShowTime(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Время докладов</span>
              </label>

              {/* Supervisor Toggle */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showSupervisor
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showSupervisor}
                  onChange={(e) => setShowSupervisor(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Науч. руководитель</span>
              </label>

              {/* Room Toggle */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showRoom
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showRoom}
                  onChange={(e) => setShowRoom(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Аудитория / Зал</span>
              </label>

              {/* Section Supervisor */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showSectionSupervisor
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showSectionSupervisor}
                  onChange={(e) => setShowSectionSupervisor(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Руководитель секции</span>
              </label>

              {/* Keynote Badge */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showKeynoteBadge
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showKeynoteBadge}
                  onChange={(e) => setShowKeynoteBadge(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Метка «Ключевой»</span>
              </label>

              {/* Co-authors */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showCoAuthors
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showCoAuthors}
                  onChange={(e) => setShowCoAuthors(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Соавторы</span>
              </label>

              {/* Abstracts */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  includeAbstracts
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={includeAbstracts}
                  onChange={(e) => setIncludeAbstracts(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Тезисы (аннотация)</span>
              </label>

              {/* Summary Stats */}
              <label
                className={`flex items-center gap-1 px-2 py-0.5 rounded border font-semibold cursor-pointer text-[11px] transition-colors ${
                  showStats
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-slate-50 text-slate-500 border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={showStats}
                  onChange={(e) => setShowStats(e.target.checked)}
                  className="size-3.5 rounded text-[#1a4d3e] accent-[#1a4d3e] cursor-pointer"
                />
                <span>Блок статистики</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable Document Body / Interactive Live Preview */}
        <div className="flex-1 overflow-y-auto bg-slate-100/70 p-3 sm:p-6">
          <div
            id="conference-printable-program"
            className={`mx-auto bg-white text-black font-sans shadow-md rounded-sm print:shadow-none print:border-none print:m-0 print:p-0 transition-all ${
              previewMaxWidthClass
            } ${
              borderStyle === "full"
                ? "border border-slate-400"
                : borderStyle === "minimal"
                ? "border-y-2 border-black"
                : "border-none"
            } ${
              density === "tiny"
                ? "p-3 sm:p-4 text-[10px]"
                : density === "compact"
                ? "p-4 sm:p-5 text-[11px]"
                : "p-6 sm:p-8 text-xs"
            }`}
          >
            {/* Optional Cover Page for Booklet Mode */}
            {showCoverPage && (
              <div
                className={`text-center flex flex-col justify-between items-center my-4 py-8 px-4 rounded-lg bg-neutral-50/50 print:bg-white ${
                  borderStyle !== "none" ? "border-2 border-dashed border-[#1a4d3e]/40" : ""
                }`}
                style={{ minHeight: paperFormat === "A5" ? "120mm" : "180mm" }}
              >
                <div className="space-y-1">
                  {coverOrgLines.length > 0 ? (
                    coverOrgLines.map((line, i) => (
                      <p key={i} className="font-black uppercase text-xs sm:text-sm text-black">
                        {line}
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="font-extrabold uppercase tracking-widest text-[10px] sm:text-xs text-[#1a4d3e]">
                        Министерство науки, высшего образования и инноваций КР
                      </p>
                      <p className="font-bold text-xs sm:text-sm text-neutral-800">
                        Международный университет инновационных технологий (МУИТ)
                      </p>
                    </>
                  )}
                </div>

                {isCustomCover ? (
                  <div className="my-8 space-y-1 max-w-lg">
                    {coverHeadingLines.map((line, i) => (
                      <p
                        key={i}
                        className={`font-black uppercase text-black leading-snug text-xs sm:text-sm md:text-base ${i === 0 ? "pb-3" : ""}`}
                      >
                        {line}
                      </p>
                    ))}
                    {coverDedicationText && (
                      <p className="font-black uppercase text-black text-xs sm:text-sm md:text-base">{coverDedicationText}</p>
                    )}
                    <div className="pt-6">
                      <span className="inline-block px-4 py-1.5 border-y-2 border-black font-extrabold text-xs sm:text-sm uppercase tracking-widest text-neutral-800">
                        ПРОГРАММА
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="my-8 space-y-3 max-w-lg">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900">
                      {coverDedicationText || "Посвящается Дню науки"}
                    </span>
                    <h1 className="text-sm sm:text-base md:text-lg font-black text-black leading-snug">
                      XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС
                    </h1>
                    <h2 className="text-base sm:text-xl md:text-2xl font-black text-[#1a4d3e] leading-tight">
                      «ИННОВАЦИОННЫЕ ТЕХНОЛОГИИ И ПЕРЕДОВЫЕ РЕШЕНИЯ»
                    </h2>
                    <div className="pt-2">
                      <span className="inline-block px-4 py-1.5 border-y-2 border-black font-extrabold text-xs sm:text-sm uppercase tracking-widest text-neutral-800">
                        {coverSection ? "ПРОГРАММА ЗАСЕДАНИЯ СЕКЦИИ" : "ПРОГРАММА И РЕГЛАМЕНТ ЗАСЕДАНИЙ"}
                      </span>
                    </div>
                    {coverSection && (
                      <div
                        className={`mt-4 px-4 py-3 rounded-lg border-2 ${
                          colorMode === "mono" ? "border-black" : "border-[#1a4d3e]"
                        }`}
                      >
                        <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-neutral-500">
                          Секция № {coverSectionNo}
                        </p>
                        <p
                          className={`mt-1 text-sm sm:text-base md:text-lg font-black leading-snug ${
                            colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"
                          }`}
                        >
                          {coverSection.title}
                        </p>
                        {coverSection.supervisor && (
                          <p className="mt-2 text-[11px] sm:text-xs text-neutral-700">
                            Руководитель секции: <strong>{coverSection.supervisor}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1 text-xs text-neutral-600">
                  {coverDetailLines.length > 0 ? (
                    coverDetailLines.map((line, i) => (
                      <p key={i} className="text-black">
                        {line}
                      </p>
                    ))
                  ) : (
                    <>
                      <p className="font-bold text-black">10 – 18 ноября 2026 года</p>
                      <p>МУИТ, г. Бишкек · Очно и онлайн</p>
                    </>
                  )}
                  <p className="text-[10px] text-neutral-400 italic pt-2">
                    [Титульная страница брошюры • При печати начнётся со следующего листа]
                  </p>
                </div>
              </div>
            )}

            {/* Official Academic Letterhead */}
            <div
              className={`text-center border-b-2 border-black ${
                density === "tiny" ? "space-y-0.5 pb-2 mb-2" : density === "compact" ? "space-y-1 pb-3 mb-3" : "space-y-1.5 pb-4 mb-4"
              }`}
            >
              <p
                className={`font-extrabold uppercase tracking-widest ${
                  density === "tiny" ? "text-[9px]" : density === "compact" ? "text-[10px]" : "text-xs"
                } ${colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"}`}
              >
                {coverOrgLines.length > 0
                  ? coverOrgLines.join(" • ")
                  : "Министерство науки, высшего образования и инноваций КР • МУИТ"}
              </p>
              <h1
                className={`font-black text-black leading-snug ${
                  density === "tiny" ? "text-sm sm:text-base" : density === "compact" ? "text-base sm:text-lg" : "text-lg sm:text-xl"
                }`}
              >
                {coverHeadingLines[0] ?? "XVIII МЕЖДУНАРОДНАЯ НАУЧНО-ПРАКТИЧЕСКАЯ КОНФЕРЕНЦИЯ-КОНКУРС"}
              </h1>
              {(coverHeadingLines.length > 0 ? coverHeadingLines.slice(1) : ["«ИННОВАЦИОННЫЕ ТЕХНОЛОГИИ И ПЕРЕДОВЫЕ РЕШЕНИЯ»"]).map(
                (line, i) => (
                  <p
                    key={i}
                    className={`font-bold uppercase tracking-wider ${
                      density === "tiny" ? "text-[10px]" : density === "compact" ? "text-xs" : "text-xs sm:text-sm"
                    } ${colorMode === "mono" ? "text-neutral-800" : "text-[#8a6d1c]"}`}
                  >
                    {line}
                  </p>
                )
              )}
              {coverSection && coverHeadingLines.length === 0 && (
                <p
                  className={`font-black leading-snug ${
                    density === "tiny" ? "text-[11px]" : density === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                  } ${colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"}`}
                >
                  Секция № {coverSectionNo}: {coverSection.title}
                </p>
              )}

              <div
                className={`pt-1 flex flex-wrap items-center justify-center gap-2.5 font-semibold text-black ${
                  density === "tiny" ? "text-[9px]" : density === "compact" ? "text-[10px]" : "text-xs"
                }`}
              >
                {coverDetailLines.length > 0 ? (
                  coverDetailLines.map((line, i) => (
                    <Fragment key={i}>
                      {i > 0 && <span>•</span>}
                      <span>{line}</span>
                    </Fragment>
                  ))
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3 text-black shrink-0" />
                      <span>Дата: <strong>10 – 18 ноября 2026 г.</strong></span>
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3 text-black shrink-0" />
                      <span>Место: МУИТ, г. Бишкек (очно и онлайн)</span>
                    </span>
                  </>
                )}
                {showTime && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3 text-black shrink-0" />
                      <span>Регламент: Ключевой — <strong>{keynoteMin} мин</strong>, секционный — <strong>{talkMin} мин</strong></span>
                    </span>
                  </>
                )}
              </div>

              {/* Summary Stats Pill */}
              {showStats && (
                <div
                  className={`mt-2 inline-flex items-center justify-center gap-2 bg-neutral-50 border border-neutral-300 rounded-md font-medium text-black ${
                    density === "tiny" ? "px-2 py-0.5 text-[9px]" : density === "compact" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1 text-xs"
                  }`}
                >
                  <span>Всего докладов: <strong>{totalFilteredTalks}</strong></span>
                  <span>•</span>
                  <span>Секций: <strong>{sectionGroups.length}</strong></span>
                  <span>•</span>
                  <span>Ключевых (1-я очередь): <strong>{totalKeynotes}</strong></span>
                </div>
              )}
            </div>

            {/* Unified Program: Continuous Text OR Table */}
            {sectionGroups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Нет одобренных докладов для выбранного направления.
              </div>
            ) : layoutMode === "text" ? (
              <div className="space-y-6 pt-2">
                {sectionGroups.map((group, groupIdx) => {
                  const sec = group.section;
                  const talksList = group.talks;
                  const roomName =
                    talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

                  return (
                    <section
                      key={sec.id}
                      className={`space-y-3 ${
                        sectionPageBreaks && (groupIdx > 0 || showCoverPage)
                          ? "pt-6 border-t-2 border-black print:break-before-page"
                          : ""
                      }`}
                    >
                      {/* Section heading */}
                      <div className="border-b-2 border-black pb-1.5">
                        <span
                          className={`font-black uppercase tracking-wider block ${
                            colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"
                          } ${density === "tiny" ? "text-[9.5px]" : "text-[11px]"}`}
                        >
                          СЕКЦИЯ №{sec.id}
                        </span>
                        <h2
                          className={`font-black text-black leading-snug mt-0.5 ${
                            density === "tiny"
                              ? "text-xs sm:text-sm"
                              : density === "compact"
                              ? "text-sm sm:text-base"
                              : "text-base sm:text-lg"
                          }`}
                        >
                          {sec.title}
                        </h2>
                        <div
                          className={`flex flex-wrap items-center gap-2 text-neutral-600 font-semibold pt-1 ${
                            density === "tiny" ? "text-[9px]" : "text-[11px]"
                          }`}
                        >
                          {showRoom && (
                            <span>
                              Аудитория: <strong className="text-black">{roomName}</strong>
                            </span>
                          )}
                          {showSectionSupervisor && sec.supervisor && (
                            <>
                              <span>•</span>
                              <span>
                                Руководитель секции:{" "}
                                <strong className="text-black">{sec.supervisor}</strong>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            Докладов: <strong className="text-black">{talksList.length}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Continuous flowing talks */}
                      {talksList.length === 0 ? (
                        <p className="italic text-neutral-500 text-xs py-2">
                          В данной секции пока нет запланированных докладов.
                        </p>
                      ) : (
                        <div
                          className={`space-y-3 ${
                            density === "tiny"
                              ? "space-y-2"
                              : density === "compact"
                              ? "space-y-2.5"
                              : "space-y-3.5"
                          }`}
                        >
                          {talksList.map((talk, idx) => {
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
                            const timeStr =
                              talk.startTime && talk.endTime
                                ? `${fmt(talk.startTime)} – ${fmt(talk.endTime)}`
                                : "По графику";

                            return (
                              <article
                                key={talk.id || idx}
                                className={`leading-relaxed break-inside-avoid print:break-inside-avoid ${
                                  density === "tiny"
                                    ? "text-[9.5px]"
                                    : density === "compact"
                                    ? "text-[10.5px]"
                                    : "text-xs sm:text-[12.5px]"
                                } ${
                                  borderStyle === "minimal"
                                    ? "pb-2 border-b border-dashed border-neutral-300"
                                    : ""
                                }`}
                              >
                                <div>
                                  <span className="font-extrabold text-black mr-1">
                                    {idx + 1}.
                                  </span>
                                  <strong className="text-black font-extrabold">
                                    {talk.title}
                                  </strong>
                                  {showKeynoteBadge && talk.isKeynote && (
                                    <span
                                      className={`ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                        colorMode === "mono"
                                          ? "bg-neutral-200 text-black border border-black"
                                          : "bg-amber-100 text-amber-900 border border-amber-300"
                                      }`}
                                    >
                                      ★ Ключевой доклад
                                    </span>
                                  )}
                                </div>

                                <div className="text-neutral-700 mt-0.5 flex flex-wrap items-center gap-x-2">
                                  {showTime && (
                                    <span className="font-mono font-bold text-black">
                                      [{timeStr}, {durationMin} мин]
                                    </span>
                                  )}
                                  <span>
                                    Докладчик:{" "}
                                    <strong className="text-black">{talk.speakerName}</strong>
                                    {talk.gradeOrGroup && (
                                      <span> (гр. {talk.gradeOrGroup})</span>
                                    )}
                                    {talk.university && <span> · {talk.university}</span>}
                                  </span>
                                </div>

                                {showCoAuthors &&
                                  talk.coAuthors &&
                                  talk.coAuthors.length > 0 && (
                                    <div className="text-neutral-600 text-[10px]">
                                      Соавторы:{" "}
                                      <span className="italic">
                                        {coAuthorLabels(talk.coAuthors).join(", ")}
                                      </span>
                                    </div>
                                  )}

                                {showSupervisor && talk.supervisor && (
                                  <div className="text-neutral-800 font-medium text-[10.5px]">
                                    Науч. рук.: <strong>{talk.supervisor}</strong>
                                  </div>
                                )}

                                {includeAbstracts && talk.abstract && (
                                  <div className="text-neutral-700 mt-1 pl-3 border-l-2 border-neutral-300 italic text-[10.5px] leading-snug">
                                    {talk.abstract}
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <table
                className={`w-full text-left border-collapse font-sans ${
                  borderStyle === "full"
                    ? "border border-black"
                    : borderStyle === "minimal"
                    ? "border-y border-black"
                    : "border-none"
                }`}
              >
                <thead>
                  <tr
                    className={`text-white font-extrabold ${
                      colorMode === "mono" ? "bg-black" : "bg-[#0f172a]"
                    } ${density === "tiny" ? "text-[9.5px]" : density === "compact" ? "text-[10.5px]" : "text-[11.5px]"}`}
                  >
                    <th
                      className={`p-1.5 w-9 text-center ${
                        borderStyle === "full" ? "border-r border-slate-700" : ""
                      }`}
                    >
                      №
                    </th>
                    {showTime && (
                      <th
                        className={`p-1.5 w-24 text-center ${
                          borderStyle === "full" ? "border-r border-slate-700" : ""
                        }`}
                      >
                        Время
                      </th>
                    )}
                    <th
                      className={`p-1.5 ${
                        borderStyle === "full" ? "border-r border-slate-700" : ""
                      }`}
                    >
                      Тема доклада и автор(ы)
                    </th>
                    {showSupervisor && (
                      <th className="p-1.5 w-32 sm:w-36 text-left">Научный руководитель</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sectionGroups.map((group, gIdx) => {
                    const sec = group.section;
                    const talksList = group.talks;
                    const roomName =
                      talksList.find((t) => t.room?.name)?.room?.name || "Аудитория уточняется";

                    return (
                      <Fragment key={sec.id}>
                        {/* Section Divider Bar */}
                        <tr
                          className={`section-header-tr break-inside-avoid print:break-inside-avoid bg-neutral-100 ${
                            sectionPageBreaks && gIdx > 0 ? "print:break-before-page" : ""
                          }`}
                          style={{
                            pageBreakInside: "avoid",
                            pageBreakAfter: "avoid",
                            breakAfter: "avoid",
                          }}
                        >
                          <td
                            colSpan={columnCount}
                            className={`${
                              borderStyle === "full"
                                ? "border-t-2 border-black border-b border-neutral-400"
                                : borderStyle === "minimal"
                                ? "border-t border-black border-b border-neutral-300"
                                : "border-t border-neutral-300"
                            } ${
                              colorMode === "mono"
                                ? "border-l-4 border-l-black"
                                : "border-l-4 border-l-[#1a4d3e]"
                            } ${density === "tiny" ? "p-1.5" : density === "compact" ? "p-2" : "p-2.5 sm:p-3"}`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <span
                                  className={`font-black uppercase tracking-wider block ${
                                    density === "tiny" ? "text-[8.5px]" : density === "compact" ? "text-[9px]" : "text-[10px]"
                                  } ${colorMode === "mono" ? "text-black" : "text-[#1a4d3e]"}`}
                                >
                                  Секция №{sec.id}
                                </span>
                                <h2
                                  className={`font-black text-black leading-snug ${
                                    density === "tiny" ? "text-[11px]" : density === "compact" ? "text-xs sm:text-sm" : "text-sm sm:text-base"
                                  }`}
                                >
                                  {sec.title}
                                </h2>
                                {showSectionSupervisor && sec.supervisor && (
                                  <p
                                    className={`text-neutral-700 mt-0.5 flex items-center gap-1 ${
                                      density === "tiny" ? "text-[9px]" : density === "compact" ? "text-[10px]" : "text-xs"
                                    }`}
                                  >
                                    <UserCheck className="size-3 text-[#1a4d3e] shrink-0 inline" />
                                    <span>Ответственный за секцию: <strong>{sec.supervisor}</strong></span>
                                  </p>
                                )}
                              </div>
                              {showRoom && (
                                <div
                                  className={`font-bold text-black bg-white px-2 py-0.5 rounded border border-neutral-400 shrink-0 self-start sm:self-auto inline-flex items-center gap-1 whitespace-nowrap ${
                                    density === "tiny" ? "text-[9px]" : density === "compact" ? "text-[10px]" : "text-xs"
                                  }`}
                                >
                                  <MapPin className="size-3 text-black shrink-0" />
                                  <span>Зал: <strong>{roomName}</strong> · {talksList.length} докл.</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Talks for this Section */}
                        {talksList.length === 0 ? (
                          <tr>
                            <td
                              colSpan={columnCount}
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
                                  className={`font-bold text-center text-black ${
                                    borderStyle === "full"
                                      ? "border-r border-b border-neutral-300"
                                      : borderStyle === "minimal"
                                      ? "border-b border-neutral-200"
                                      : ""
                                  } ${density === "tiny" ? "p-1 text-[10px]" : density === "compact" ? "p-1.5 text-xs" : "p-2 text-xs"}`}
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

                                {showTime && (
                                  <td
                                    className={`font-mono text-center whitespace-nowrap ${
                                      borderStyle === "full"
                                        ? "border-r border-b border-neutral-300"
                                        : borderStyle === "minimal"
                                        ? "border-b border-neutral-200"
                                        : ""
                                    } ${density === "tiny" ? "p-1 text-[9.5px]" : density === "compact" ? "p-1.5 text-[10.5px]" : "p-2 text-[11px]"}`}
                                  >
                                    <span className="font-bold block text-black">
                                      {timeFormatted}
                                    </span>
                                    <span className="text-[9.5px] text-neutral-600 block">
                                      {durationMin} мин
                                    </span>
                                  </td>
                                )}

                                <td
                                  className={`space-y-0.5 ${
                                    borderStyle === "full"
                                      ? "border-r border-b border-neutral-300"
                                      : borderStyle === "minimal"
                                      ? "border-b border-neutral-200"
                                      : ""
                                  } ${density === "tiny" ? "p-1" : density === "compact" ? "p-1.5" : "p-2"}`}
                                >
                                  {showKeynoteBadge && isKeynoteTalk && (
                                    <div
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-black mb-0.5 ${
                                        density === "tiny" ? "text-[8.5px]" : density === "compact" ? "text-[9px]" : "text-[9.5px]"
                                      } ${
                                        colorMode === "mono"
                                          ? "bg-neutral-200 text-black border border-black"
                                          : "bg-amber-100 text-amber-950 border border-amber-300"
                                      }`}
                                    >
                                      <Star className="size-2.5 fill-current shrink-0" />
                                      <span>КЛЮЧЕВОЙ ДОКЛАД (15 МИН)</span>
                                    </div>
                                  )}
                                  <div
                                    className={`font-bold text-black leading-snug ${
                                      density === "tiny" ? "text-[10px]" : density === "compact" ? "text-[11px]" : "text-xs"
                                    }`}
                                  >
                                    {talk.title}
                                  </div>
                                  <div
                                    className={`text-neutral-800 font-medium ${
                                      density === "tiny" ? "text-[9px]" : density === "compact" ? "text-[10px]" : "text-[11px]"
                                    }`}
                                  >
                                    <span>Докладчик: <strong>{talk.speakerName}</strong></span>
                                    {talk.gradeOrGroup && <span> (гр. {talk.gradeOrGroup})</span>}
                                    {talk.university && <span> · {talk.university}</span>}
                                  </div>
                                  {showCoAuthors && talk.coAuthors && talk.coAuthors.length > 0 && (
                                    <div
                                      className={`text-neutral-600 ${
                                        density === "tiny" ? "text-[8.5px]" : density === "compact" ? "text-[9.5px]" : "text-[10px]"
                                      }`}
                                    >
                                      Соавторы: <span className="italic">{coAuthorLabels(talk.coAuthors).join(", ")}</span>
                                    </div>
                                  )}
                                  {includeAbstracts && talk.abstract && (
                                    <div
                                      className={`pt-1 text-neutral-700 leading-relaxed font-sans border-t border-dashed border-neutral-300 mt-1 ${
                                        density === "tiny" ? "text-[8.5px]" : density === "compact" ? "text-[9px]" : "text-[10px]"
                                      }`}
                                    >
                                      <strong>Тезисы: </strong>
                                      {talk.abstract}
                                    </div>
                                  )}
                                </td>

                                {showSupervisor && (
                                  <td
                                    className={`text-black ${
                                      borderStyle === "full"
                                        ? "border-b border-neutral-300"
                                        : borderStyle === "minimal"
                                        ? "border-b border-neutral-200"
                                        : ""
                                    } ${density === "tiny" ? "p-1 text-[9.5px]" : density === "compact" ? "p-1.5 text-[10px]" : "p-2 text-[11px]"}`}
                                  >
                                    {talk.supervisor ? (
                                      <strong>{talk.supervisor}</strong>
                                    ) : (
                                      <span className="text-neutral-400">—</span>
                                    )}
                                  </td>
                                )}
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
                density === "tiny" ? "pt-2 mt-2 text-[9px]" : density === "compact" ? "pt-2.5 mt-3 text-[10px]" : "pt-4 mt-4 text-xs"
              }`}
            >
              <p>
                Оргкомитет: Международный университет инновационных технологий (МУИТ) · email: conf@intuit.kg
              </p>
              <p className="italic text-[9.5px] text-neutral-500">
                Формат: {paperFormat} ({orientation === "landscape" ? "Альбомный" : "Книжный"}) · ConfHub 2026 · Дата печати: {new Date().toLocaleDateString("ru-RU")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
