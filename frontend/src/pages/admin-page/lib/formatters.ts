export const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });

export function formatTalkWord(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return "доклад";
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return "доклада";
  return "докладов";
}
