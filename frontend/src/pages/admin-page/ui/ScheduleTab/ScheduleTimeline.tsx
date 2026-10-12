import { Link } from "react-router-dom";
import { pathKeys } from "~shared/lib";
import type { Room, Talk } from "~entities/talk/model/types";
import { ROOM_COLORS } from "../../model/constants";
import { fmt } from "../../lib/formatters";

interface ScheduleTimelineProps {
  rooms: Room[];
  talksByRoom: Record<number, Talk[]>;
  minTime: number;
  totalMinutes: number;
}

export function ScheduleTimeline({
  rooms,
  talksByRoom,
  minTime,
  totalMinutes,
}: ScheduleTimelineProps) {
  return (
    <div className="admin-schedule-grid">
      {rooms.map((room, ri) => {
        const rTalks = (talksByRoom[room.id] || []).sort(
          (a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
        );
        const color = ROOM_COLORS[ri % ROOM_COLORS.length];

        return (
          <div key={room.id} className="admin-schedule-row">
            <div className="admin-schedule-room-label">{room.name}</div>
            <div className="admin-schedule-timeline">
              {rTalks.length === 0 && (
                <div className="admin-schedule-free">Свободна весь день</div>
              )}
              {rTalks.map((talk) => {
                const start = new Date(talk.startTime!).getTime();
                const end = new Date(talk.endTime!).getTime();
                const leftPct = ((start - minTime) / 60000 / totalMinutes) * 100;
                const widthPct = ((end - start) / 60000 / totalMinutes) * 100;

                return (
                  <div
                    key={talk.id}
                    className="admin-schedule-block"
                    style={{
                      left: `${leftPct}%`,
                      width: `max(${widthPct}%, 5rem)`,
                      backgroundColor: color,
                    }}
                    title={`${talk.title} · ${fmt(talk.startTime!)} – ${fmt(talk.endTime!)}`}
                  >
                    <Link
                      to={pathKeys.talk.build(String(talk.id))}
                      className="admin-schedule-block-inner"
                    >
                      <span className="admin-schedule-block-time">
                        {fmt(talk.startTime!)} – {fmt(talk.endTime!)}
                      </span>
                      <span className="admin-schedule-block-title">{talk.title}</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
