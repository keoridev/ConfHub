import { Link } from "react-router-dom";
import { Users, FileText, BarChart2 } from "lucide-react";
import { pathKeys } from "~shared/lib";

export function QuickNavGrid() {
  return (
    <>
      <div className="admin-section-title-row">
        <Users className="size-4" /> <span>Быстрый доступ</span>
      </div>
      <div className="admin-nav-grid">
        <Link to={pathKeys.jury} className="admin-nav-card">
          <div className="admin-nav-card-icon">
            <BarChart2 className="size-6" />
          </div>
          <div className="admin-nav-card-label">Страница жюри</div>
          <div className="admin-nav-card-desc">Просмотр и оценка докладов</div>
        </Link>
        <Link to={pathKeys.conference.build("demo")} className="admin-nav-card">
          <div className="admin-nav-card-icon">
            <FileText className="size-6" />
          </div>
          <div className="admin-nav-card-label">Расписание (публичное)</div>
          <div className="admin-nav-card-desc">Программа конференции</div>
        </Link>
        <Link to={pathKeys.submission} className="admin-nav-card">
          <div className="admin-nav-card-icon">
            <Users className="size-6" />
          </div>
          <div className="admin-nav-card-label">Подача докладов</div>
          <div className="admin-nav-card-desc">Заявки участников</div>
        </Link>
      </div>
    </>
  );
}
