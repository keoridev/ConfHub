import { useMemo } from "react";
import type { Room, Talk } from "~entities/talk/model/types";

export function useAdminSchedule(allTalks: Talk[], rooms: Room[]) {
  const scheduledTalks: Talk[] = useMemo(
    () =>
      allTalks.filter(
        (t) => t.status === "approved" && t.startTime && t.endTime && t.room
      ),
    [allTalks]
  );

  const talksByRoom: Record<number, Talk[]> = useMemo(() => {
    const map: Record<number, Talk[]> = {};
    rooms.forEach((r) => {
      map[r.id] = [];
    });
    scheduledTalks.forEach((t) => {
      if (t.room?.id) {
        if (!map[t.room.id]) map[t.room.id] = [];
        map[t.room.id].push(t);
      }
    });
    return map;
  }, [rooms, scheduledTalks]);

  const { minTime, totalMinutes } = useMemo(() => {
    const allTimes = scheduledTalks
      .flatMap((t) => [new Date(t.startTime!).getTime(), new Date(t.endTime!).getTime()])
      .sort((a, b) => a - b);
    const min = allTimes.length > 0 ? allTimes[0] : Date.now();
    const max = allTimes.length > 0 ? allTimes[allTimes.length - 1] : Date.now() + 3600000;
    const minutes = Math.max((max - min) / 60000, 60);
    return { minTime: min, totalMinutes: minutes };
  }, [scheduledTalks]);

  return {
    scheduledTalks,
    talksByRoom,
    minTime,
    totalMinutes,
  };
}
