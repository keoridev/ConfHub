import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { pathKeys } from "~shared/lib";
import type { Room, Talk } from "~entities/talk/model/types";
import { ROOM_COLORS } from "../../model/constants";
import { fmt, fmtDate } from "../../lib/formatters";

interface ScheduledTalksTableProps {
  talks: Talk[];
  rooms: Room[];
}

export function ScheduledTalksTable({ talks, rooms }: ScheduledTalksTableProps) {
  const sortedTalks = [...talks].sort((a, b) => {
    if (a.isKeynote && !b.isKeynote) return -1;
    if (!a.isKeynote && b.isKeynote) return 1;
    return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
  });

  return (
    <>
      <div className="admin-section-title-row" style={{ marginTop: "2rem" }}>
        <CalendarDays className="size-4" /> <span>Список запланированных докладов</span>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Аудитория</th>
                <th>Время</th>
                <th>Дата</th>
                <th>Доклад</th>
                <th>Секция</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedTalks.map((talk) => {
                const roomIndex = rooms.findIndex((r) => r.id === talk.room?.id);
                const color = ROOM_COLORS[(roomIndex >= 0 ? roomIndex : 0) % ROOM_COLORS.length];
                const durationMinutes =
                  talk.startTime && talk.endTime
                    ? Math.round((new Date(talk.endTime).getTime() - new Date(talk.startTime).getTime()) / 60000)
                    : talk.isKeynote
                    ? 15
                    : 10;

                return (
                  <tr key={talk.id} className={`admin-table-row ${talk.isKeynote ? "bg-amber-50/40" : ""}`}>
                    <td>
                      <span
                        className="admin-room-pill"
                        style={{
                          backgroundColor: color + "22",
                          color: color,
                        }}
                      >
                        {talk.room?.name ?? "—"}
                      </span>
                    </td>
                    <td className="admin-td-date">
                      <div>
                        <span className="font-bold text-[#1a4d3e] block">
                          {fmt(talk.startTime!)} – {fmt(talk.endTime!)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {durationMinutes} мин
                        </span>
                      </div>
                    </td>
                    <td className="admin-td-date">{fmtDate(talk.startTime!)}</td>
                    <td className="admin-td-title" style={{ maxWidth: "20rem" }}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#1a4d3e]">{talk.title}</span>
                        {talk.isKeynote && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            ⭐ Главный
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5">{talk.speakerName}</span>
                    </td>
                    <td className="admin-td-section">{talk.section?.title ?? "—"}</td>
                    <td>
                      <Link to={pathKeys.talk.build(String(talk.id))} className="admin-table-link">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
