import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import {
  useCurrentUserQuery,
  useLogout,
  useTalksQuery,
  useSectionsQuery,
  useRoomsQuery,
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { ConfirmLogoutModal } from "~shared/ui";

import type { Tab, AdminStats } from "../model/types";
import { useAdminSections } from "../model/useAdminSections";
import { useAdminRooms } from "../model/useAdminRooms";
import { useAdminSchedule } from "../model/useAdminSchedule";

import { AdminHeader } from "./AdminHeader";
import { AdminTabsNav, ADMIN_TABS } from "./AdminTabsNav";
import { OverviewTab } from "./OverviewTab/OverviewTab";
import { SectionsTab } from "./SectionsTab/SectionsTab";
import { RoomsTab } from "./RoomsTab/RoomsTab";
import { ScheduleTab } from "./ScheduleTab/ScheduleTab";

export function AdminPage() {
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading } = useCurrentUserQuery();
  const logout = useLogout();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && (!user || user.role !== "admin")) {
      navigate(pathKeys.login + "?redirect=" + pathKeys.admin, { replace: true });
    }
  }, [user, isUserLoading, navigate]);

  const {
    data: allTalks = [],
    isLoading: talksLoading,
    refetch: refetchTalks,
  } = useTalksQuery(1);

  const {
    data: sections = [],
    refetch: refetchSections,
  } = useSectionsQuery();

  const {
    data: rooms = [],
    refetch: refetchRooms,
  } = useRoomsQuery(1);

  const sectionsManager = useAdminSections(sections, refetchSections);
  const roomsManager = useAdminRooms(refetchRooms);
  const scheduleManager = useAdminSchedule(allTalks, rooms);

  const stats: AdminStats = useMemo(() => {
    const total = allTalks.length;
    const approved = allTalks.filter((t) => t.status === "approved").length;
    const rejected = allTalks.filter((t) => t.status === "rejected").length;
    const pending = allTalks.filter((t) => t.status === "pending_review").length;
    const needsRevision = allTalks.filter((t) => t.status === "needs_revision").length;
    const rate = total > 0 ? Math.round((approved / total) * 100) + "%" : "0%";
    return { total, approved, rejected, pending, needsRevision, rate };
  }, [allTalks]);

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate(pathKeys.login, { replace: true });
  };

  const handleRefreshAll = () => {
    refetchTalks();
    refetchSections();
    refetchRooms();
  };

  if (isUserLoading || !user || user.role !== "admin") {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p className="admin-loading-text">Проверка доступа...</p>
      </div>
    );
  }

  return (
    <div className="admin-root">
      <AdminHeader user={user} onLogout={() => setIsLogoutModalOpen(true)} />

      <AdminTabsNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        sectionsCount={sections.length}
        roomsCount={rooms.length}
        scheduledCount={scheduleManager.scheduledTalks.length}
        onRefresh={handleRefreshAll}
      />

      <main className="admin-main">
        <div className="admin-breadcrumb">
          <span>Администратор</span>
          <ChevronRight className="size-3.5" />
          <span>{ADMIN_TABS.find((t) => t.key === activeTab)?.label}</span>
        </div>

        {activeTab === "overview" && (
          <OverviewTab stats={stats} talks={allTalks} loading={talksLoading} />
        )}

        {activeTab === "sections" && (
          <SectionsTab
            sections={sections}
            talks={allTalks}
            form={sectionsManager.secForm}
            setForm={sectionsManager.setSecForm}
            saving={sectionsManager.secSaving}
            error={sectionsManager.secError}
            onOpenCreate={sectionsManager.openSecCreate}
            onOpenEdit={sectionsManager.openSecEdit}
            onCloseForm={sectionsManager.closeSecForm}
            onSave={sectionsManager.saveSection}
            onDelete={sectionsManager.deleteSection}
          />
        )}

        {activeTab === "rooms" && (
          <RoomsTab
            rooms={rooms}
            scheduledTalks={scheduleManager.scheduledTalks}
            form={roomsManager.roomForm}
            setForm={roomsManager.setRoomForm}
            saving={roomsManager.roomSaving}
            error={roomsManager.roomError}
            onOpenCreate={roomsManager.openRoomCreate}
            onOpenEdit={roomsManager.openRoomEdit}
            onCloseForm={roomsManager.closeRoomForm}
            onSave={roomsManager.saveRoom}
            onDelete={roomsManager.deleteRoom}
          />
        )}

        {activeTab === "schedule" && (
          <ScheduleTab
            rooms={rooms}
            scheduledTalks={scheduleManager.scheduledTalks}
            talksByRoom={scheduleManager.talksByRoom}
            minTime={scheduleManager.minTime}
            totalMinutes={scheduleManager.totalMinutes}
            availableDates={scheduleManager.availableDates}
            selectedDate={scheduleManager.selectedDate}
            onSelectDate={scheduleManager.setSelectedDate}
            dayStartHour={scheduleManager.dayStartHour}
            dayEndHour={scheduleManager.dayEndHour}
          />
        )}
      </main>

      <footer className="admin-footer">
        © 2026 Conf-Hub / COMTEHNO — Панель администратора
      </footer>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        user={user}
      />
    </div>
  );
}

export const adminPageRoute = { element: <AdminPage /> };
