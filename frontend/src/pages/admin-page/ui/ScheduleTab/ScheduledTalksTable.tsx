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
  const sortedTalks = [...talks].sort(
    (a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
  );

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

                return (
                  <tr key={talk.id} className="admin-table-row">
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
                      {fmt(talk.startTime!)} – {fmt(talk.endTime!)}
                    </td>
                    <td className="admin-td-date">{fmtDate(talk.startTime!)}</td>
                    <td className="admin-td-title" style={{ maxWidth: "20rem" }}>
                      <span>{talk.title}</span>
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
