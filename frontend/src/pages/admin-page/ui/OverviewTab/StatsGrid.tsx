import { FileText, CheckCircle, Clock, XCircle, AlertTriangle, BarChart2 } from "lucide-react";
import type { AdminStats } from "../../model/types";

interface StatsGridProps {
  stats: AdminStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards = [
    { cls: "admin-stat-total", icon: <FileText className="size-5" />, val: stats.total, lbl: "Всего докладов" },
    { cls: "admin-stat-approved", icon: <CheckCircle className="size-5" />, val: stats.approved, lbl: "Одобрено" },
    { cls: "admin-stat-pending", icon: <Clock className="size-5" />, val: stats.pending, lbl: "На рассмотрении" },
    { cls: "admin-stat-rejected", icon: <XCircle className="size-5" />, val: stats.rejected, lbl: "Отклонено" },
    { cls: "admin-stat-revision", icon: <AlertTriangle className="size-5" />, val: stats.needsRevision, lbl: "Нужна доработка" },
    { cls: "admin-stat-rate", icon: <BarChart2 className="size-5" />, val: stats.rate, lbl: "Одобрение" },
  ];

  return (
    <div className="admin-stats-grid">
      {statCards.map(({ cls, icon, val, lbl }) => (
        <div key={lbl} className={`admin-stat-card ${cls}`}>
          <div className="admin-stat-icon-wrap">{icon}</div>
          <div>
            <div className="admin-stat-value">{val}</div>
            <div className="admin-stat-label">{lbl}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
