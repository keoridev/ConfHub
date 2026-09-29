export const fmtTime = (iso: string): string =>
  iso
    ? new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : "—";