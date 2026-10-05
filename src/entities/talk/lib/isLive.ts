import { Talk } from "../model/types";

export const fmtTime = (iso: string | undefined | null): string => {
  if (!iso) return "—";
  
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    console.warn(`[fmtTime] Invalid date string provided: ${iso}`);
    return "—";
  }
  
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const isLiveNow = (talk: Pick<Talk, "startTime" | "endTime">): boolean => {
  if (!talk.startTime || !talk.endTime) return false;
  
  const now = Date.now();
  const start = Date.parse(talk.startTime);
  const end = Date.parse(talk.endTime);
  
  // Дополнительная защита от невалидных дат в моках
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  
  return now >= start && now <= end;
};