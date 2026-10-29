import { useState } from "react";
import { CalendarDays, Calendar, Printer } from "lucide-react";
import type { Room, Talk } from "~entities/talk/model/types";
import { useSectionsQuery } from "~entities/talk/api/queries";
import { PrintProgramModal } from "~features/print-program";
import { ScheduleLegend } from "./ScheduleLegend";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { ScheduledTalksTable } from "./ScheduledTalksTable";

interface ScheduleTabProps {
  rooms: Room[];
  scheduledTalks: Talk[];
  talksByRoom: Record<number, Talk[]>;
  minTime?: number;
  totalMinutes?: number;
  availableDates?: Array<{ dateStr: string; label: string; count: number }>;
  selectedDate?: string;
  onSelectDate?: (dateStr: string) => void;
  dayStartHour?: number;
  dayEndHour?: number;
}

export function ScheduleTab({
  rooms,
  scheduledTalks,
  talksByRoom,
  minTime,
  totalMinutes,
  availableDates = [],
  selectedDate,
  onSelectDate,
  dayStartHour = 9,
  dayEndHour = 18,
}: ScheduleTabProps) {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { data: sections = [] } = useSectionsQuery();

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="admin-crud-desc m-0">
          Занятость аудиторий по времени. Цвет блока — аудитория. Данные берутся из одобренных
          докладов с назначенным временем.
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Selector Tabs */}
          {availableDates.length > 0 && onSelectDate && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[#1a4d3e] flex items-center gap-1 mr-1">
                <Calendar className="size-3.5 text-[#d4a84b]" />
                <span>День:</span>
              </span>
              {availableDates.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => onSelectDate(d.dateStr)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedDate === d.dateStr
                      ? "bg-[#1a4d3e] text-white shadow-xs"
                      : "bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] hover:bg-[#1a4d3e]/10"
                  }`}
                >
                  {d.label} ({d.count})
                </button>
              ))}
            </div>
          )}

          {/* Print Program Button */}
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#1a4d3e] hover:bg-[#143d31] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all shrink-0 ml-1"
            title="Распечатать программу конференции"
          >
            <Printer className="size-3.5 text-[#d4a84b]" />
            <span>Печать программы</span>
          </button>
        </div>
      </div>

      {scheduledTalks.length === 0 ? (
        <div className="admin-empty-state">
          <CalendarDays className="size-12 opacity-25" />
          <p>Нет запланированных докладов</p>
          <p className="admin-crud-desc" style={{ fontSize: "0.8rem", textAlign: "center" }}>
            Одобрите доклады с назначением аудитории и времени через страницу жюри
          </p>
        </div>
      ) : (
        <>
          <ScheduleLegend rooms={rooms} />
          <ScheduleTimeline
            rooms={rooms}
            talksByRoom={talksByRoom}
            minTime={minTime}
            totalMinutes={totalMinutes}
            dayStartHour={dayStartHour}
            dayEndHour={dayEndHour}
          />
          <ScheduledTalksTable talks={scheduledTalks} rooms={rooms} />
        </>
      )}

      {/* Official Printable Program Modal */}
      <PrintProgramModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        talks={scheduledTalks}
        sections={sections}
      />
    </>
  );
}
