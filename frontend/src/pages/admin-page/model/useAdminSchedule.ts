import { useState, useMemo } from "react";
import type { Room, Talk } from "~entities/talk/model/types";
import { fmtDate } from "../lib/formatters";

export function useAdminSchedule(allTalks: Talk[], rooms: Room[]) {
  const scheduledTalks: Talk[] = useMemo(
    () =>
      allTalks.filter(
        (t) => t.status === "approved" && t.startTime && t.endTime && t.room
      ),
    [allTalks]
  );

  // Group talks by date (YYYY-MM-DD in local time)
  const availableDates = useMemo(() => {
    const datesMap: Record<string, { dateStr: string; label: string; count: number }> = {};
    scheduledTalks.forEach((t) => {
      if (!t.startTime) return;
      const d = new Date(t.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!datesMap[key]) {
        datesMap[key] = {
          dateStr: key,
          label: fmtDate(t.startTime),
          count: 0,
        };
      }
      datesMap[key].count++;
    });
    return Object.values(datesMap).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [scheduledTalks]);

  const [selectedDate, setSelectedDate] = useState<string>("");

  const activeDate = useMemo(() => {
    if (selectedDate && availableDates.some((d) => d.dateStr === selectedDate)) {
      return selectedDate;
    }
    return availableDates.length > 0 ? availableDates[0].dateStr : "";
  }, [selectedDate, availableDates]);

  // Filter talks for active date
  const talksForActiveDate = useMemo(() => {
    if (!activeDate) return scheduledTalks;
    return scheduledTalks.filter((t) => {
      if (!t.startTime) return false;
      const d = new Date(t.startTime);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return key === activeDate;
    });
  }, [scheduledTalks, activeDate]);

  const talksByRoom: Record<number, Talk[]> = useMemo(() => {
    const map: Record<number, Talk[]> = {};
    rooms.forEach((r) => {
      map[r.id] = [];
    });
    talksForActiveDate.forEach((t) => {
      if (t.room?.id) {
        if (!map[t.room.id]) map[t.room.id] = [];
        map[t.room.id].push(t);
      }
    });
    return map;
  }, [rooms, talksForActiveDate]);

  // Compute start hour and end hour for the active day (standard 09:00 - 18:00, or expanded if talks fall outside)
  const { dayStartHour, dayEndHour, totalDayMinutes } = useMemo(() => {
    let minHour = 9;
    let maxHour = 18;

    talksForActiveDate.forEach((t) => {
      if (t.startTime) {
        const h = new Date(t.startTime).getHours();
        if (h < minHour) minHour = Math.max(0, h);
      }
      if (t.endTime) {
        const d = new Date(t.endTime);
        const h = d.getHours() + (d.getMinutes() > 0 ? 1 : 0);
        if (h > maxHour) maxHour = Math.min(24, h);
      }
    });

    const totalMinutes = (maxHour - minHour) * 60;
    return {
      dayStartHour: minHour,
      dayEndHour: maxHour,
      totalDayMinutes: totalMinutes,
    };
  }, [talksForActiveDate]);

  // Backward compatibility minTime and totalMinutes
  const minTime = useMemo(() => {
    if (talksForActiveDate.length === 0) return Date.now();
    return new Date(talksForActiveDate[0].startTime!).getTime();
  }, [talksForActiveDate]);

  return {
    scheduledTalks,
    availableDates,
    selectedDate: activeDate,
    setSelectedDate,
    talksForActiveDate,
    talksByRoom,
    dayStartHour,
    dayEndHour,
    totalDayMinutes,
    minTime,
    totalMinutes: totalDayMinutes,
  };
}
