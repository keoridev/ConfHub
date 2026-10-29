import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { pathKeys } from "~shared/lib";
import { ConfirmDeleteTalkModal } from "~shared/ui";
import type { Room, Talk } from "~entities/talk/model/types";
import { useAdminDeleteTalkMutation } from "~entities/talk/api/queries";
import { ROOM_COLORS } from "../../model/constants";
import { fmt, fmtDate } from "../../lib/formatters";

interface ScheduledTalksTableProps {
  talks: Talk[];
  rooms: Room[];
}

export function ScheduledTalksTable({ talks, rooms }: ScheduledTalksTableProps) {
  const [talkToDelete, setTalkToDelete] = useState<Talk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => new Set());
  const deleteMutation = useAdminDeleteTalkMutation();

  const sortedTalks = talks
    .filter((t) => !deletedIds.has(t.id))
    .sort((a, b) => {
      if (a.isKeynote && !b.isKeynote) return -1;
      if (!a.isKeynote && b.isKeynote) return 1;
      return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
    });

  const handleConfirmDelete = async () => {
    if (!talkToDelete) return;
    const talk = talkToDelete;
    try {
      setIsDeleting(true);
      setDeletedIds((prev) => new Set(prev).add(talk.id));
      await deleteMutation.mutateAsync(talk.id);
      toast.success(`Доклад «${talk.title}» удалён`);
      setTalkToDelete(null);
    } catch (err: any) {
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.delete(talk.id);
        return next;
      });
      const errorMsg =
        err?.response?.data?.error?.message ||
        (typeof err?.response?.data?.error === "string" ? err.response.data.error : null) ||
        err?.message ||
        "Не удалось удалить доклад";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
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
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <Star className="size-2.5 fill-amber-600 text-amber-600 shrink-0" />
                            <span>Главный</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground block mt-0.5">{talk.speakerName}</span>
                    </td>
                    <td className="admin-td-section">{talk.section?.title ?? "—"}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={pathKeys.talk.build(String(talk.id))} className="admin-table-link">
                          Открыть
                        </Link>
                        <button
                          type="button"
                          onClick={() => setTalkToDelete(talk)}
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

      <ConfirmDeleteTalkModal
        isOpen={Boolean(talkToDelete)}
        talkTitle={talkToDelete?.title}
        speakerName={talkToDelete?.speakerName}
        sectionTitle={talkToDelete?.section?.title}
        isPending={isDeleting}
        onClose={() => setTalkToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
