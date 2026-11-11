export interface ScheduleSettings {
  /** Conference days, "YYYY-MM-DD" */
  days: string[];
  /** Local (Asia/Bishkek) "HH:MM" */
  dayStart: string;
  dayEnd: string;
  talkMinutes: number;
  keynoteMinutes: number;
  /** Empty strings mean no lunch break */
  lunchStart: string;
  lunchEnd: string;
}

// Used until an admin saves settings; matches the timetable that was hardcoded before.
export const DEFAULT_SCHEDULE: ScheduleSettings = {
  days: ["2026-11-10", "2026-11-11"],
  dayStart: "10:00",
  dayEnd: "16:00",
  talkMinutes: 10,
  keynoteMinutes: 15,
  lunchStart: "12:00",
  lunchEnd: "14:00",
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toClock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** A taken interval in minutes since local midnight */
export interface BusyInterval {
  start: number;
  end: number;
}

/**
 * Consecutive "HH:MM - HH:MM" slots of the given length that fit the day and skip lunch
 * and busy intervals; after a busy talk the next slot starts right when it ends.
 */
export function buildSlots(settings: ScheduleSettings, minutes: number, busy: BusyInterval[] = []): string[] {
  const end = toMinutes(settings.dayEnd);
  const blocked: BusyInterval[] = [...busy];
  if (settings.lunchStart && settings.lunchEnd) {
    blocked.push({ start: toMinutes(settings.lunchStart), end: toMinutes(settings.lunchEnd) });
  }

  const slots: string[] = [];
  let t = toMinutes(settings.dayStart);
  while (minutes > 0 && t + minutes <= end) {
    const hit = blocked.find((b) => t < b.end && t + minutes > b.start);
    if (hit) {
      t = Math.max(t + 1, hit.end);
      continue;
    }
    slots.push(`${toClock(t)} - ${toClock(t + minutes)}`);
    t += minutes;
  }
  return slots;
}

/** Local (Asia/Bishkek) day "YYYY-MM-DD" and minutes since midnight for an ISO time */
export function toLocalDayMinutes(iso: string): { day: string; minutes: number } {
  // sv-SE formats as "YYYY-MM-DD HH:MM:SS"
  const [day, clock] = new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Bishkek" }).split(" ");
  return { day, minutes: toMinutes(clock.slice(0, 5)) };
}

export { toClock as minutesToClock };

/** "10 нояб, вт" */
export function formatDayLabel(day: string): string {
  return new Date(`${day}T12:00:00+06:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: "Asia/Bishkek",
  });
}
