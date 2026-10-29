import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, Clock, User, Coffee, ArrowRight, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pathKeys } from "~shared/lib";
import { ConfirmDeleteTalkModal } from "~shared/ui";
import type { Room, Talk } from "~entities/talk/model/types";
import { useAdminDeleteTalkMutation } from "~entities/talk/api/queries";
import { ROOM_COLORS } from "../../model/constants";
import { fmt } from "../../lib/formatters";

interface ScheduleTimelineProps {
  rooms: Room[];
  talksByRoom: Record<number, Talk[]>;
  minTime?: number;
  totalMinutes?: number;
  dayStartHour?: number;
  dayEndHour?: number;
}

export function ScheduleTimeline({
  rooms,
  talksByRoom,
}: ScheduleTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [talkToDelete, setTalkToDelete] = useState<Talk | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useAdminDeleteTalkMutation();

  const handleConfirmDelete = async () => {
    if (!talkToDelete) return;
    const talk = talkToDelete;
    try {
      setIsDeleting(true);
      await deleteMutation.mutateAsync(talk.id);
      toast.success(`Доклад «${talk.title}» удалён из базы и расписания`);
      setTalkToDelete(null);
    } catch (err: any) {
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

  const handleScroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const totalScheduled = Object.values(talksByRoom).reduce(
    (acc, list) => acc + (list ? list.length : 0),
    0
  );

  return (
    <div className="space-y-3">
      {/* Scroll controls and status toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white p-3 rounded-2xl border border-[#1a4d3e]/15 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap text-muted-foreground">
          <span className="p-1.5 rounded-lg bg-[#1a4d3e]/10 text-[#1a4d3e]">
            <Clock className="size-4 text-[#d4a84b]" />
          </span>
          <span className="font-semibold text-[#1a4d3e]">
            Потоковое расписание по аудиториям:
          </span>
          <span>Всего докладов: <strong className="text-[#1a4d3e]">{totalScheduled}</strong></span>
          <span className="text-[#1a4d3e]/30 hidden sm:inline">•</span>
          <span className="hidden sm:inline">Ключевые доклады идут в 1-ю очередь (15 мин), обычные — по 10 мин</span>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleScroll(-360)}
            className="px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 bg-[#f5f3ed]/60 hover:bg-[#1a4d3e]/10 text-[#1a4d3e] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Прокрутить расписание влево"
          >
            <ChevronLeft className="size-4" />
            <span>Влево</span>
          </button>
          <button
            type="button"
            onClick={() => handleScroll(360)}
            className="px-3 py-1.5 rounded-xl border border-[#1a4d3e]/20 bg-[#f5f3ed]/60 hover:bg-[#1a4d3e]/10 text-[#1a4d3e] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Прокрутить расписание вправо"
          >
            <span>Вправо</span>
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Main timeline container with non-overlapping sequential room flow */}
      <div
        ref={scrollRef}
        className="overflow-x-auto rounded-3xl border border-[#1a4d3e]/15 bg-white shadow-xs select-none"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="min-w-[980px] divide-y divide-[#1a4d3e]/10">
          {rooms.map((room, ri) => {
            const rTalks = (talksByRoom[room.id] || []).sort((a, b) => {
              if (a.isKeynote && !b.isKeynote) return -1;
              if (!a.isKeynote && b.isKeynote) return 1;
              return new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime();
            });
            const color = ROOM_COLORS[ri % ROOM_COLORS.length];

            return (
              <div
                key={room.id}
                className="flex items-stretch min-h-[140px] group hover:bg-[#1a4d3e]/[0.02] transition-colors"
              >
                {/* Left Room Card */}
                <div className="w-48 sm:w-56 shrink-0 p-4 bg-[#fbfaf7] border-r border-[#1a4d3e]/15 flex flex-col justify-between gap-2 z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3.5 rounded-full shrink-0 shadow-2xs ring-2 ring-white"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-extrabold text-sm sm:text-base text-[#1a4d3e] leading-snug">
                        {room.name}
                      </span>
                    </div>
                    {room.capacity && (
                      <span className="text-[11px] text-muted-foreground block">
                        Вместимость: {room.capacity} мест
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#1a4d3e]/10 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1a4d3e]">
                      {rTalks.length > 0 ? `${rTalks.length} докл.` : "Свободна"}
                    </span>
                    {rTalks.some((t) => t.isKeynote) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                        <Star className="size-2.5 fill-amber-500 text-amber-500" />
                        Ключевой
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Flow of Talks (Zero overlapping!) */}
                <div className="flex-1 p-3.5 flex items-center gap-3 overflow-x-auto bg-[#faf8f4]/40">
                  {rTalks.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 italic pl-2">
                      <Clock className="size-4 text-muted-foreground/40" />
                      <span>В этой аудитории нет запланированных выступлений на выбранный день</span>
                    </div>
                  ) : (
                    rTalks.map((talk, idx) => {
                      const prevTalk = idx > 0 ? rTalks[idx - 1] : null;
                      const durationMinutes =
                        talk.startTime && talk.endTime
                          ? Math.round(
                              (new Date(talk.endTime).getTime() - new Date(talk.startTime).getTime()) /
                                60000
                            )
                          : talk.isKeynote
                          ? 15
                          : 10;

                      // Check if there is an intermission between talks
                      let breakMinutes = 0;
                      if (prevTalk && prevTalk.endTime && talk.startTime) {
                        breakMinutes = Math.round(
                          (new Date(talk.startTime).getTime() - new Date(prevTalk.endTime).getTime()) /
                            60000
                        );
                      }

                      return (
                        <div key={talk.id} className="flex items-center gap-3 shrink-0">
                          {/* Intermission / Coffee Break Badge if gap >= 15 min */}
                          {breakMinutes >= 15 && (
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shrink-0">
                              <Coffee className="size-3.5 text-amber-600" />
                              <span>Перерыв ({breakMinutes} мин)</span>
                            </div>
                          )}

                          {/* Arrow between back-to-back talks */}
                          {idx > 0 && breakMinutes < 15 && (
                            <ArrowRight className="size-4 text-[#1a4d3e]/30 shrink-0" />
                          )}

                          {/* Talk Card */}
                          <div
                            className={`w-80 sm:w-92 p-4 rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-3 ${
                              talk.isKeynote
                                ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-300/60"
                                : "bg-white border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30"
                            }`}
                          >
                            {/* Card Top: Time & Keynote Status */}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold whitespace-nowrap shrink-0 shadow-2xs ${
                                  talk.isKeynote
                                    ? "bg-amber-600 text-white"
                                    : "bg-[#1a4d3e] text-white"
                                }`}
                              >
                                <Clock className="size-3.5 shrink-0" />
                                <span>
                                  {talk.startTime && talk.endTime
                                    ? `${fmt(talk.startTime)} – ${fmt(talk.endTime)}`
                                    : "Время назначается"}
                                </span>
                                <span className="opacity-85 font-normal ml-0.5">({durationMinutes} мин)</span>
                              </span>

                              {talk.isKeynote && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 shadow-2xs shrink-0 whitespace-nowrap">
                                  <Star className="size-3 fill-amber-600 text-amber-600 shrink-0" />
                                  <span>КЛЮЧЕВОЙ</span>
                                </span>
                              )}
                            </div>

                            {/* Card Middle: Title */}
                            <div>
                              <Link
                                to={pathKeys.talk.build(String(talk.id))}
                                className="font-extrabold text-xs sm:text-sm text-[#1a4d3e] hover:text-[#143d31] hover:underline line-clamp-2 leading-snug tracking-tight"
                                title={talk.title}
                              >
                                {talk.title}
                              </Link>
                            </div>

                            {/* Card Bottom: Speaker & Section */}
                            <div className="pt-2 border-t border-[#1a4d3e]/10 space-y-1 text-xs">
                              <div className="flex items-center justify-between gap-2 text-muted-foreground">
                                <span className="font-semibold text-[#1a4d3e] truncate flex items-center gap-1">
                                  <User className="size-3 text-[#d4a84b] shrink-0" />
                                  <span className="truncate">{talk.speakerName}</span>
                                </span>
                                {talk.gradeOrGroup && (
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {talk.gradeOrGroup}
                                  </span>
                                )}
                              </div>

                              {talk.section?.title && (
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className="truncate text-[10px] font-bold text-white px-2 py-0.5 rounded-md shadow-2xs max-w-[200px]"
                                    style={{ backgroundColor: talk.section.color || "#1a4d3e" }}
                                    title={talk.section.title}
                                  >
                                    {talk.section.title}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Link
                                      to={pathKeys.talk.build(String(talk.id))}
                                      className="text-[10px] font-bold text-[#1a4d3e] hover:underline flex items-center gap-0.5"
                                      title="Открыть страницу доклада"
                                    >
                                      <span>Детали</span>
                                      <ExternalLink className="size-2.5" />
                                    </Link>
                                    <button
                                      type="button"
                                      onClick={() => setTalkToDelete(talk)}
                                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Удалить доклад из базы"
                                    >
                                      <Trash2 className="size-3" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
