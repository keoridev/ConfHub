import { RefreshCw, LayoutDashboard, BookOpen, DoorOpen, CalendarDays } from "lucide-react";
import type { Tab, TabConfig } from "../model/types";

export const ADMIN_TABS: TabConfig[] = [
  { key: "overview", label: "Обзор", icon: <LayoutDashboard className="size-4" /> },
  { key: "sections", label: "Секции", icon: <BookOpen className="size-4" /> },
  { key: "rooms", label: "Аудитории", icon: <DoorOpen className="size-4" /> },
  { key: "schedule", label: "Расписание", icon: <CalendarDays className="size-4" /> },
];

interface AdminTabsNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  sectionsCount: number;
  roomsCount: number;
  scheduledCount: number;
  onRefresh: () => void;
}

export function AdminTabsNav({
  activeTab,
  onTabChange,
  sectionsCount,
  roomsCount,
  scheduledCount,
  onRefresh,
}: AdminTabsNavProps) {
  return (
    <div className="admin-tab-bar">
      <div className="admin-tab-inner">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.key}
            className={`admin-tab-btn ${activeTab === t.key ? "admin-tab-btn-active" : ""}`}
            onClick={() => onTabChange(t.key)}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.key === "sections" && sectionsCount > 0 && (
              <span className="admin-tab-count">{sectionsCount}</span>
            )}
            {t.key === "rooms" && roomsCount > 0 && (
              <span className="admin-tab-count">{roomsCount}</span>
            )}
            {t.key === "schedule" && scheduledCount > 0 && (
              <span className="admin-tab-count">{scheduledCount}</span>
            )}
          </button>
        ))}
        <div className="admin-tab-spacer" />
        <button className="admin-refresh-btn" onClick={onRefresh} title="Обновить данные">
          <RefreshCw className="size-3.5" />
          <span>Обновить</span>
        </button>
      </div>
    </div>
  );
}
