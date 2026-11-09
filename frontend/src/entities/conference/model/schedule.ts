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

/** Consecutive "HH:MM - HH:MM" slots of the given length that fit the day and skip lunch. */
export function buildSlots(settings: ScheduleSettings, minutes: number): string[] {
  const end = toMinutes(settings.dayEnd);
  const hasLunch = Boolean(settings.lunchStart && settings.lunchEnd);
  const lunchStart = hasLunch ? toMinutes(settings.lunchStart) : -1;
  const lunchEnd = hasLunch ? toMinutes(settings.lunchEnd) : -1;

  const slots: string[] = [];
  let t = toMinutes(settings.dayStart);
  while (minutes > 0 && t + minutes <= end) {
    if (hasLunch && t < lunchEnd && t + minutes > lunchStart) {
      t = lunchEnd;
      continue;
    }
    slots.push(`${toClock(t)} - ${toClock(t + minutes)}`);
    t += minutes;
  }
  return slots;
}

/** "10 нояб, вт" */
export function formatDayLabel(day: string): string {
  return new Date(`${day}T12:00:00+06:00`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    weekday: "short",
    timeZone: "Asia/Bishkek",
  });
}
