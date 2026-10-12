import { CalendarDays } from "lucide-react";
import type { Room, Talk } from "~entities/talk/model/types";
import { ScheduleLegend } from "./ScheduleLegend";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { ScheduledTalksTable } from "./ScheduledTalksTable";

interface ScheduleTabProps {
  rooms: Room[];
  scheduledTalks: Talk[];
  talksByRoom: Record<number, Talk[]>;
  minTime: number;
  totalMinutes: number;
}

export function ScheduleTab({
  rooms,
  scheduledTalks,
  talksByRoom,
  minTime,
  totalMinutes,
}: ScheduleTabProps) {
  return (
    <>
      <p className="admin-crud-desc" style={{ marginBottom: "1.25rem" }}>
        Занятость аудиторий по времени. Цвет блока — аудитория. Данные берутся из одобренных
        докладов с назначенным временем.
      </p>

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
          />
          <ScheduledTalksTable talks={scheduledTalks} rooms={rooms} />
        </>
      )}
    </>
  );
}
