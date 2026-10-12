import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { pathKeys } from "~shared/lib";
import type { Talk } from "~entities/talk/model/types";
import { statusLabel, statusClass } from "../../model/constants";
import { fmt } from "../../lib/formatters";

interface AllTalksTableProps {
  talks: Talk[];
  loading: boolean;
}

export function AllTalksTable({ talks, loading }: AllTalksTableProps) {
  return (
    <>
      <div className="admin-section-title-row" style={{ marginTop: "2rem" }}>
        <FileText className="size-4" /> <span>Все доклады</span>
      </div>
      <div className="admin-table-card">
        {loading ? (
          <div className="admin-table-empty">
            <div className="admin-spinner" />
            <p>Загрузка...</p>
          </div>
        ) : talks.length === 0 ? (
          <div className="admin-table-empty">
            <FileText className="size-10 opacity-30" />
            <p>Нет докладов</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Название</th>
                  <th>Секция</th>
                  <th>Статус</th>
                  <th>Аудитория</th>
                  <th>Время</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {talks.map((talk, idx) => (
                  <tr key={talk.id} className="admin-table-row">
                    <td className="admin-td-num">{idx + 1}</td>
                    <td className="admin-td-title">
                      <span>{talk.title}</span>
                      {talk.supervisor && (
                        <span className="admin-td-meta">Соавтор: {talk.supervisor}</span>
                      )}
                    </td>
                    <td className="admin-td-section">{talk.section?.title ?? "—"}</td>
                    <td>
                      <span className={`admin-badge ${statusClass[talk.status] ?? ""}`}>
                        {statusLabel[talk.status] ?? talk.status}
                      </span>
                    </td>
                    <td className="admin-td-section">{talk.room?.name ?? "—"}</td>
                    <td className="admin-td-date">
                      {talk.startTime ? `${fmt(talk.startTime)} – ${fmt(talk.endTime!)}` : "—"}
                    </td>
                    <td>
                      <Link to={pathKeys.talk.build(String(talk.id))} className="admin-table-link">
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
