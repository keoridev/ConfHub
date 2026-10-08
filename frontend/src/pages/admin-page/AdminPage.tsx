import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useCurrentUserQuery,
  useLogout,
  useTalksQuery,
  useSectionsQuery,
  useRoomsQuery,
} from "~entities/talk/api/queries";
import { apiClient } from "~shared/lib";
import { pathKeys } from "~shared/lib";
import type { Section, Room, Talk } from "~entities/talk/model/types";
import {
  Shield,
  LogOut,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  BookOpen,
  DoorOpen,
  LayoutDashboard,
  X,
  Save,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────── */
/*  Types                                                  */
/* ─────────────────────────────────────────────────────── */
type Tab = "overview" | "sections" | "rooms" | "schedule";

interface SectionFormState {
  open: boolean;
  mode: "create" | "edit";
  id?: number;
  title: string;
  sortOrder: string;
}

interface RoomFormState {
  open: boolean;
  mode: "create" | "edit";
  id?: number;
  name: string;
}

/* ─────────────────────────────────────────────────────── */
/*  Helpers                                                */
/* ─────────────────────────────────────────────────────── */
const fmt = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });

const ROOM_COLORS = [
  "#1a4d3e",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
];

const statusLabel: Record<string, string> = {
  pending_review: "На рассмотрении",
  approved: "Одобрен",
  rejected: "Отклонён",
  needs_revision: "Нужна доработка",
};
const statusClass: Record<string, string> = {
  pending_review: "admin-badge-pending",
  approved: "admin-badge-approved",
  rejected: "admin-badge-rejected",
  needs_revision: "admin-badge-revision",
};

/* ─────────────────────────────────────────────────────── */
/*  Component                                              */
/* ─────────────────────────────────────────────────────── */
export function AdminPage() {
  const navigate = useNavigate();
  const { data: user, isLoading } = useCurrentUserQuery();
  const logout = useLogout();

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  /* ── Auth guard ── */
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate(pathKeys.login + "?redirect=" + pathKeys.admin, { replace: true });
    }
  }, [user, isLoading, navigate]);

  /* ── Data ── */
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

  /* ── Section form ── */
  const [secForm, setSecForm] = useState<SectionFormState>({
    open: false,
    mode: "create",
    title: "",
    sortOrder: "1",
  });
  const [secSaving, setSecSaving] = useState(false);
  const [secError, setSecError] = useState("");

  const openSecCreate = () =>
    setSecForm({ open: true, mode: "create", title: "", sortOrder: String(sections.length + 1) });
  const openSecEdit = (s: Section) =>
    setSecForm({ open: true, mode: "edit", id: s.id, title: s.title, sortOrder: String(s.sortOrder) });
  const closeSecForm = () => setSecForm((f) => ({ ...f, open: false }));

  const saveSection = useCallback(async () => {
    if (!secForm.title.trim()) { setSecError("Введите название секции"); return; }
    setSecSaving(true); setSecError("");
    try {
      if (secForm.mode === "create") {
        await apiClient.post("/admin/sections", {
          conferenceId: 1,
          title: secForm.title.trim(),
          sortOrder: Number(secForm.sortOrder) || 1,
        });
      } else {
        await apiClient.patch(`/admin/sections/${secForm.id}`, {
          title: secForm.title.trim(),
          sortOrder: Number(secForm.sortOrder) || 1,
        });
      }
      await refetchSections();
      closeSecForm();
    } catch (e: any) {
      setSecError(e?.response?.data?.error?.message || "Ошибка сохранения");
    } finally {
      setSecSaving(false);
    }
  }, [secForm, refetchSections]);

  const deleteSection = useCallback(async (id: number) => {
    if (!confirm("Удалить секцию? Если есть связанные доклады — бэкенд вернёт ошибку.")) return;
    try {
      await apiClient.delete(`/admin/sections/${id}`);
      await refetchSections();
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || "Не удалось удалить");
    }
  }, [refetchSections]);

  /* ── Room form ── */
  const [roomForm, setRoomForm] = useState<RoomFormState>({
    open: false,
    mode: "create",
    name: "",
  });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomError, setRoomError] = useState("");

  const openRoomCreate = () => setRoomForm({ open: true, mode: "create", name: "" });
  const openRoomEdit = (r: Room) => setRoomForm({ open: true, mode: "edit", id: r.id, name: r.name });
  const closeRoomForm = () => setRoomForm((f) => ({ ...f, open: false }));

  const saveRoom = useCallback(async () => {
    if (!roomForm.name.trim()) { setRoomError("Введите название аудитории"); return; }
    setRoomSaving(true); setRoomError("");
    try {
      if (roomForm.mode === "create") {
        await apiClient.post("/admin/rooms", { conferenceId: 1, name: roomForm.name.trim() });
      } else {
        await apiClient.patch(`/admin/rooms/${roomForm.id}`, { name: roomForm.name.trim() });
      }
      await refetchRooms();
      closeRoomForm();
    } catch (e: any) {
      setRoomError(e?.response?.data?.error?.message || "Ошибка сохранения");
    } finally {
      setRoomSaving(false);
    }
  }, [roomForm, refetchRooms]);

  const deleteRoom = useCallback(async (id: number) => {
    if (!confirm("Удалить аудиторию? Если она используется в расписании — бэкенд вернёт ошибку.")) return;
    try {
      await apiClient.delete(`/admin/rooms/${id}`);
      await refetchRooms();
    } catch (e: any) {
      alert(e?.response?.data?.error?.message || "Не удалось удалить");
    }
  }, [refetchRooms]);

  /* ── Schedule data ── */
  const scheduledTalks: Talk[] = allTalks.filter(
    (t) => t.status === "approved" && t.startTime && t.endTime && t.room
  );

  // Group by room
  const talksByRoom: Record<number, Talk[]> = {};
  rooms.forEach((r) => { talksByRoom[r.id] = []; });
  scheduledTalks.forEach((t) => {
    if (t.room?.id) {
      if (!talksByRoom[t.room.id]) talksByRoom[t.room.id] = [];
      talksByRoom[t.room.id].push(t);
    }
  });

  // Time range
  const allTimes = scheduledTalks
    .flatMap((t) => [new Date(t.startTime!).getTime(), new Date(t.endTime!).getTime()])
    .sort((a, b) => a - b);
  const minTime = allTimes.length > 0 ? allTimes[0] : Date.now();
  const maxTime = allTimes.length > 0 ? allTimes[allTimes.length - 1] : Date.now() + 3600000;
  const totalMinutes = Math.max((maxTime - minTime) / 60000, 60);

  /* ── Loading screen ── */
  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="admin-loading-screen">
        <div className="admin-spinner" />
        <p className="admin-loading-text">Проверка доступа...</p>
      </div>
    );
  }

  /* ── Stats ── */
  const total = allTalks.length;
  const approved = allTalks.filter((t) => t.status === "approved").length;
  const rejected = allTalks.filter((t) => t.status === "rejected").length;
  const pending = allTalks.filter((t) => t.status === "pending_review").length;
  const needsRevision = allTalks.filter((t) => t.status === "needs_revision").length;

  const handleLogout = () => {
    logout();
    navigate(pathKeys.login, { replace: true });
  };

  /* ─────────────────── TAB: OVERVIEW ─────────────────── */
  const OverviewTab = (
    <>
      {/* Stats grid */}
      <div className="admin-stats-grid">
        {[
          { cls: "admin-stat-total",    icon: <FileText className="size-5"/>,    val: total,          lbl: "Всего докладов" },
          { cls: "admin-stat-approved", icon: <CheckCircle className="size-5"/>, val: approved,       lbl: "Одобрено" },
          { cls: "admin-stat-pending",  icon: <Clock className="size-5"/>,       val: pending,        lbl: "На рассмотрении" },
          { cls: "admin-stat-rejected", icon: <XCircle className="size-5"/>,     val: rejected,       lbl: "Отклонено" },
          { cls: "admin-stat-revision", icon: <AlertTriangle className="size-5"/>,val: needsRevision, lbl: "Нужна доработка" },
          { cls: "admin-stat-rate",     icon: <BarChart2 className="size-5"/>,   val: total > 0 ? Math.round((approved/total)*100)+"%" : "0%", lbl: "Одобрение" },
        ].map(({ cls, icon, val, lbl }) => (
          <div key={lbl} className={`admin-stat-card ${cls}`}>
            <div className="admin-stat-icon-wrap">{icon}</div>
            <div>
              <div className="admin-stat-value">{val}</div>
              <div className="admin-stat-label">{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="admin-section-title-row">
        <Users className="size-4"/> <span>Быстрый доступ</span>
      </div>
      <div className="admin-nav-grid">
        <Link to={pathKeys.jury} className="admin-nav-card">
          <div className="admin-nav-card-icon"><BarChart2 className="size-6"/></div>
          <div className="admin-nav-card-label">Страница жюри</div>
          <div className="admin-nav-card-desc">Просмотр и оценка докладов</div>
        </Link>
        <Link to={pathKeys.conference.build("demo")} className="admin-nav-card">
          <div className="admin-nav-card-icon"><FileText className="size-6"/></div>
          <div className="admin-nav-card-label">Расписание (публичное)</div>
          <div className="admin-nav-card-desc">Программа конференции</div>
        </Link>
        <Link to={pathKeys.submission} className="admin-nav-card">
          <div className="admin-nav-card-icon"><Users className="size-6"/></div>
          <div className="admin-nav-card-label">Подача докладов</div>
          <div className="admin-nav-card-desc">Заявки участников</div>
        </Link>
      </div>

      {/* All talks table */}
      <div className="admin-section-title-row" style={{ marginTop: "2rem" }}>
        <FileText className="size-4"/> <span>Все доклады</span>
      </div>
      <div className="admin-table-card">
        {talksLoading ? (
          <div className="admin-table-empty"><div className="admin-spinner"/><p>Загрузка...</p></div>
        ) : allTalks.length === 0 ? (
          <div className="admin-table-empty"><FileText className="size-10 opacity-30"/><p>Нет докладов</p></div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr>
                <th>#</th><th>Название</th><th>Секция</th><th>Статус</th><th>Аудитория</th><th>Время</th><th></th>
              </tr></thead>
              <tbody>
                {allTalks.map((talk, idx) => (
                  <tr key={talk.id} className="admin-table-row">
                    <td className="admin-td-num">{idx + 1}</td>
                    <td className="admin-td-title">
                      <span>{talk.title}</span>
                      {talk.supervisor && <span className="admin-td-meta">Соавтор: {talk.supervisor}</span>}
                    </td>
                    <td className="admin-td-section">{talk.section?.title ?? "—"}</td>
                    <td><span className={`admin-badge ${statusClass[talk.status] ?? ""}`}>{statusLabel[talk.status] ?? talk.status}</span></td>
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

  /* ─────────────────── TAB: SECTIONS ─────────────────── */
  const SectionsTab = (
    <>
      <div className="admin-crud-header">
        <div>
          <p className="admin-crud-desc">Секции группируют доклады по тематикам. Порядок влияет на сортировку в расписании.</p>
        </div>
        <button className="admin-create-btn" onClick={openSecCreate}>
          <Plus className="size-4"/> Добавить секцию
        </button>
      </div>

      {/* Modal */}
      {secForm.open && (
        <div className="admin-modal-overlay" onClick={closeSecForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span>{secForm.mode === "create" ? "Новая секция" : "Редактировать секцию"}</span>
              <button className="admin-modal-close" onClick={closeSecForm}><X className="size-4"/></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label className="admin-label">Название секции *</label>
                <input
                  className="admin-input"
                  placeholder="Например: Информационные технологии"
                  value={secForm.title}
                  onChange={(e) => setSecForm((f) => ({ ...f, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && saveSection()}
                  autoFocus
                />
              </div>
              <div className="admin-field">
                <label className="admin-label">Порядок сортировки</label>
                <input
                  className="admin-input admin-input-sm"
                  type="number"
                  min={1}
                  value={secForm.sortOrder}
                  onChange={(e) => setSecForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </div>
              {secError && <p className="admin-form-error">{secError}</p>}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost" onClick={closeSecForm}>Отмена</button>
              <button className="admin-btn-primary" onClick={saveSection} disabled={secSaving}>
                {secSaving ? <div className="admin-spinner admin-spinner-sm"/> : <Save className="size-3.5"/>}
                {secForm.mode === "create" ? "Создать" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="admin-empty-state">
          <BookOpen className="size-12 opacity-25"/>
          <p>Секции ещё не созданы</p>
          <button className="admin-btn-primary" onClick={openSecCreate}>
            <Plus className="size-4"/> Добавить первую секцию
          </button>
        </div>
      ) : (
        <div className="admin-cards-list">
          {sections
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((s, i) => {
              const talkCount = allTalks.filter((t) => t.sectionId === s.id).length;
              return (
                <div key={s.id} className="admin-crud-card">
                  <div className="admin-crud-card-left">
                    <div
                      className="admin-crud-card-badge"
                      style={{ backgroundColor: ROOM_COLORS[i % ROOM_COLORS.length] }}
                    >
                      {s.sortOrder}
                    </div>
                    <div>
                      <div className="admin-crud-card-title">{s.title}</div>
                      <div className="admin-crud-card-meta">
                        {talkCount} докла{talkCount === 1 ? "д" : talkCount >= 2 && talkCount <= 4 ? "да" : "дов"}
                      </div>
                    </div>
                  </div>
                  <div className="admin-crud-card-actions">
                    <button className="admin-icon-btn" title="Редактировать" onClick={() => openSecEdit(s)}>
                      <Pencil className="size-4"/>
                    </button>
                    <button className="admin-icon-btn admin-icon-btn-danger" title="Удалить" onClick={() => deleteSection(s.id)}>
                      <Trash2 className="size-4"/>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </>
  );

  /* ─────────────────── TAB: ROOMS ─────────────────── */
  const RoomsTab = (
    <>
      <div className="admin-crud-header">
        <div>
          <p className="admin-crud-desc">Аудитории назначаются одобренным докладам при формировании расписания.</p>
        </div>
        <button className="admin-create-btn" onClick={openRoomCreate}>
          <Plus className="size-4"/> Добавить аудиторию
        </button>
      </div>

      {/* Modal */}
      {roomForm.open && (
        <div className="admin-modal-overlay" onClick={closeRoomForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <span>{roomForm.mode === "create" ? "Новая аудитория" : "Редактировать аудиторию"}</span>
              <button className="admin-modal-close" onClick={closeRoomForm}><X className="size-4"/></button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-field">
                <label className="admin-label">Название аудитории *</label>
                <input
                  className="admin-input"
                  placeholder="Например: Ауд. 101"
                  value={roomForm.name}
                  onChange={(e) => setRoomForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && saveRoom()}
                  autoFocus
                />
              </div>
              {roomError && <p className="admin-form-error">{roomError}</p>}
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn-ghost" onClick={closeRoomForm}>Отмена</button>
              <button className="admin-btn-primary" onClick={saveRoom} disabled={roomSaving}>
                {roomSaving ? <div className="admin-spinner admin-spinner-sm"/> : <Save className="size-3.5"/>}
                {roomForm.mode === "create" ? "Создать" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {rooms.length === 0 ? (
        <div className="admin-empty-state">
          <DoorOpen className="size-12 opacity-25"/>
          <p>Аудитории ещё не добавлены</p>
          <button className="admin-btn-primary" onClick={openRoomCreate}>
            <Plus className="size-4"/> Добавить первую аудиторию
          </button>
        </div>
      ) : (
        <div className="admin-cards-list">
          {rooms.map((r, i) => {
            const count = scheduledTalks.filter((t) => t.room?.id === r.id).length;
            const isBusy = count > 0;
            return (
              <div key={r.id} className="admin-crud-card">
                <div className="admin-crud-card-left">
                  <div
                    className="admin-crud-card-badge"
                    style={{ backgroundColor: ROOM_COLORS[i % ROOM_COLORS.length] }}
                  >
                    <DoorOpen className="size-3"/>
                  </div>
                  <div>
                    <div className="admin-crud-card-title">{r.name}</div>
                    <div className="admin-crud-card-meta">
                      {isBusy
                        ? <><span className="admin-room-busy-dot"/>Занята · {count} доклад{count === 1 ? "" : count >= 2 && count <= 4 ? "а" : "ов"}</>
                        : <><span className="admin-room-free-dot"/>Свободна</>}
                    </div>
                  </div>
                </div>
                <div className="admin-crud-card-actions">
                  <button className="admin-icon-btn" title="Редактировать" onClick={() => openRoomEdit(r)}>
                    <Pencil className="size-4"/>
                  </button>
                  <button className="admin-icon-btn admin-icon-btn-danger" title="Удалить" onClick={() => deleteRoom(r.id)}>
                    <Trash2 className="size-4"/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  /* ─────────────────── TAB: SCHEDULE ─────────────────── */
  const ScheduleTab = (
    <>
      <p className="admin-crud-desc" style={{ marginBottom: "1.25rem" }}>
        Занятость аудиторий по времени. Цвет блока — аудитория. Данные берутся из одобренных докладов с назначенным временем.
      </p>

      {scheduledTalks.length === 0 ? (
        <div className="admin-empty-state">
          <CalendarDays className="size-12 opacity-25"/>
          <p>Нет запланированных докладов</p>
          <p className="admin-crud-desc" style={{ fontSize: "0.8rem", textAlign:"center" }}>
            Одобрите доклады с назначением аудитории и времени через страницу жюри
          </p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="admin-schedule-legend">
            {rooms.map((r, i) => (
              <div key={r.id} className="admin-schedule-legend-item">
                <span
                  className="admin-schedule-legend-dot"
                  style={{ backgroundColor: ROOM_COLORS[i % ROOM_COLORS.length] }}
                />
                {r.name}
              </div>
            ))}
          </div>

          {/* Timeline per room */}
          <div className="admin-schedule-grid">
            {rooms.map((room, ri) => {
              const rTalks = (talksByRoom[room.id] || []).sort(
                (a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
              );
              const color = ROOM_COLORS[ri % ROOM_COLORS.length];
              return (
                <div key={room.id} className="admin-schedule-row">
                  <div className="admin-schedule-room-label">{room.name}</div>
                  <div className="admin-schedule-timeline">
                    {/* Free indicator when empty */}
                    {rTalks.length === 0 && (
                      <div className="admin-schedule-free">Свободна весь день</div>
                    )}
                    {rTalks.map((talk) => {
                      const start = new Date(talk.startTime!).getTime();
                      const end = new Date(talk.endTime!).getTime();
                      const leftPct = ((start - minTime) / 60000 / totalMinutes) * 100;
                      const widthPct = ((end - start) / 60000 / totalMinutes) * 100;
                      return (
                        <div
                          key={talk.id}
                          className="admin-schedule-block"
                          style={{
                            left: `${leftPct}%`,
                            width: `max(${widthPct}%, 5rem)`,
                            backgroundColor: color,
                          }}
                          title={`${talk.title} · ${fmt(talk.startTime!)} – ${fmt(talk.endTime!)}`}
                        >
                          <Link to={pathKeys.talk.build(String(talk.id))} className="admin-schedule-block-inner">
                            <span className="admin-schedule-block-time">
                              {fmt(talk.startTime!)} – {fmt(talk.endTime!)}
                            </span>
                            <span className="admin-schedule-block-title">{talk.title}</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card list */}
          <div className="admin-section-title-row" style={{ marginTop: "2rem" }}>
            <CalendarDays className="size-4"/> <span>Список запланированных докладов</span>
          </div>
          <div className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr>
                  <th>Аудитория</th><th>Время</th><th>Дата</th><th>Доклад</th><th>Секция</th><th></th>
                </tr></thead>
                <tbody>
                  {scheduledTalks
                    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
                    .map((talk) => (
                      <tr key={talk.id} className="admin-table-row">
                        <td>
                          <span className="admin-room-pill" style={{
                            backgroundColor: ROOM_COLORS[(rooms.findIndex((r) => r.id === talk.room?.id)) % ROOM_COLORS.length] + "22",
                            color: ROOM_COLORS[(rooms.findIndex((r) => r.id === talk.room?.id)) % ROOM_COLORS.length],
                          }}>
                            {talk.room?.name ?? "—"}
                          </span>
                        </td>
                        <td className="admin-td-date">{fmt(talk.startTime!)} – {fmt(talk.endTime!)}</td>
                        <td className="admin-td-date">{fmtDate(talk.startTime!)}</td>
                        <td className="admin-td-title" style={{ maxWidth: "20rem" }}>
                          <span>{talk.title}</span>
                        </td>
                        <td className="admin-td-section">{talk.section?.title ?? "—"}</td>
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
          </div>
        </>
      )}
    </>
  );

  /* ─────────────────── RENDER ─────────────────── */
  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Обзор",      icon: <LayoutDashboard className="size-4"/> },
    { key: "sections", label: "Секции",     icon: <BookOpen className="size-4"/> },
    { key: "rooms",    label: "Аудитории",  icon: <DoorOpen className="size-4"/> },
    { key: "schedule", label: "Расписание", icon: <CalendarDays className="size-4"/> },
  ];

  return (
    <div className="admin-root">
      {/* ── Topbar ── */}
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-topbar-brand">
            <div className="admin-brand-icon"><Sparkles className="size-4"/></div>
            <span className="admin-brand-name">СИГНАЛ 2026</span>
            <span className="admin-brand-sep">·</span>
            <span className="admin-brand-role">Панель администратора</span>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-user-chip">
              <Shield className="size-3.5"/>
              <span>{user.fullName || user.login}</span>
            </div>
            <button className="admin-logout-btn" onClick={handleLogout} title="Выйти">
              <LogOut className="size-4"/><span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab nav ── */}
      <div className="admin-tab-bar">
        <div className="admin-tab-inner">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`admin-tab-btn ${activeTab === t.key ? "admin-tab-btn-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
              {t.key === "sections" && sections.length > 0 && (
                <span className="admin-tab-count">{sections.length}</span>
              )}
              {t.key === "rooms" && rooms.length > 0 && (
                <span className="admin-tab-count">{rooms.length}</span>
              )}
              {t.key === "schedule" && scheduledTalks.length > 0 && (
                <span className="admin-tab-count">{scheduledTalks.length}</span>
              )}
            </button>
          ))}
          <div className="admin-tab-spacer"/>
          <button
            className="admin-refresh-btn"
            onClick={() => { refetchTalks(); refetchSections(); refetchRooms(); }}
            title="Обновить данные"
          >
            <RefreshCw className="size-3.5"/><span>Обновить</span>
          </button>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="admin-main">
        {/* Breadcrumb */}
        <div className="admin-breadcrumb">
          <span>Администратор</span>
          <ChevronRight className="size-3.5"/>
          <span>{tabs.find((t) => t.key === activeTab)?.label}</span>
        </div>

        {activeTab === "overview"  && OverviewTab}
        {activeTab === "sections"  && SectionsTab}
        {activeTab === "rooms"     && RoomsTab}
        {activeTab === "schedule"  && ScheduleTab}
      </main>

      <footer className="admin-footer">
        © 2026 СИГНАЛ / COMTEHNO — Панель администратора
      </footer>
    </div>
  );
}

export const adminPageRoute = { element: <AdminPage /> };
