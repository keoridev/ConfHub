import { Link } from "react-router-dom";
import { CalendarDays, Trash2 } from "lucide-react";
import { pathKeys } from "~shared/lib";
import type { Room, Talk } from "~entities/talk/model/types";
import { useAdminDeleteTalkMutation } from "~entities/talk/api/queries";
import { ROOM_COLORS } from "../../model/constants";
import { fmt, fmtDate } from "../../lib/formatters";

interface ScheduledTalksTableProps {
  talks: Talk[];
  rooms: Room[];
}

export function ScheduledTalksTable({ talks, rooms }: ScheduledTalksTableProps) {
  const deleteMutation = useAdminDeleteTalkMutation();
  const sortedTalks = [...talks].sort(
    (a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
  );

  const handleDeleteTalk = async (talk: Talk) => {
    if (
      !window.confirm(
        `Удалить запланированный доклад «${talk.title}»?\n\nДоклад будет полностью удалён из базы и расписания.`
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(talk.id);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Не удалось удалить доклад");
    }
  };

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
                      <div className="flex items-center gap-2">
                        <Link to={pathKeys.talk.build(String(talk.id))} className="admin-table-link">
                          Открыть
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteTalk(talk)}
                          className="p-1 text-rose-500/70 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Удалить доклад"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
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
