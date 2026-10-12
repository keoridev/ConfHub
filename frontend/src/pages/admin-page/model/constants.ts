export const ROOM_COLORS = [
  "#1a4d3e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
];

export const statusLabel: Record<string, string> = {
  pending_review: "На рассмотрении",
  approved: "Одобрен",
  rejected: "Отклонён",
  needs_revision: "Нужна доработка",
};

export const statusClass: Record<string, string> = {
  pending_review: "admin-badge-pending",
  approved: "admin-badge-approved",
  rejected: "admin-badge-rejected",
  needs_revision: "admin-badge-revision",
};
