import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  CalendarDays,
  FilePenLine,
  Users,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Shield,
  ChevronRight,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "~app/lib/utils";
import { pathKeys } from "~shared/lib";
import { useCurrentUserQuery, useLogout } from "~entities/talk/api/queries";
import { ConfirmLogoutModal } from "~shared/ui";



export function AppNavigation() {
  const { data: user } = useCurrentUserQuery();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    toast.info("Вы вышли из системы");
    navigate(pathKeys.root);
  };

  const getRoleLabel = (role?: string) => {
    if (role === "admin") return "Оргкомитет";
    if (role === "jury") return "Жюри";
    return "Студент";
  };

  // Separation of roles:
  // - Admin can do absolutely everything (all links).
  // - Jury sees ONLY jury page ("Кабинет жюри").
  // - Student sees Main, Program & Submission (NO jury, NO admin).
  // - Guest sees Main, Program & Submission.
  const links = (() => {
    if (user?.role === "admin") {
      return [
        { to: pathKeys.root, label: "Главная", description: "О мероприятии", icon: Building2 },
        { to: pathKeys.program, label: "Программа", description: "Расписание и доклады", icon: CalendarDays },
        { to: pathKeys.submission, label: "Подать заявку", description: "Регистрация выступления", icon: FilePenLine },
        { to: pathKeys.jury, label: "Жюри", description: "Экспертный кабинет", icon: Users },
        { to: pathKeys.admin, label: "Админ-панель", description: "Управление конференцией", icon: Shield },
      ];
    }
    if (user?.role === "jury") {
      return [
        { to: pathKeys.jury, label: "Кабинет жюри", description: "Экспертная оценка докладов", icon: Users },
      ];
    }
    // Student or Guest
    return [
      { to: pathKeys.root, label: "Главная", description: "О мероприятии", icon: Building2 },
      { to: pathKeys.program, label: "Программа", description: "Расписание и доклады", icon: CalendarDays },
      { to: pathKeys.submission, label: "Подать заявку", description: "Регистрация выступления", icon: FilePenLine },
    ];
  })();

  const logoTarget = user?.role === "jury" ? pathKeys.jury : pathKeys.root;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#f5f3ed]/95 backdrop-blur-md border-b border-[#1a4d3e]/10 transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between w-full gap-2 sm:gap-4">
          <NavLink
            to={logoTarget}
            className="flex items-center gap-2 sm:gap-2.5 group shrink-0 select-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img
              src="/logo.jpg"
              alt="Conf-Hub Logo"
              className="size-8 sm:size-9 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform border border-[#1a4d3e]/15"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold text-[#1a4d3e] tracking-tight leading-none group-hover:text-[#1a4d3e]/80 transition-colors">
                  Conf-Hub
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#d4a84b] bg-[#d4a84b]/15 px-1 py-0.2 rounded leading-tight">
                  МУИТ • 2026
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground font-semibold tracking-wider hidden xs:block sm:block">
                XVIII Международная конференция
              </p>
            </div>
          </NavLink>

          <nav aria-label="Основная навигация" className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-1.5 px-2.5 lg:px-3.5 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 outline-none select-none",
                    isActive
                      ? "text-[#1a4d3e] bg-[#1a4d3e]/8 shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <l.icon className={cn("size-3.5 lg:size-4 shrink-0 transition-colors", isActive ? "text-[#d4a84b]" : "text-muted-foreground")} />
                    <span>{l.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#d4a84b]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 backdrop-blur-sm border border-[#1a4d3e]/15 p-1 sm:px-2.5 sm:py-1 rounded-xl sm:rounded-2xl shadow-2xs">
                <div className="size-7 sm:size-8 rounded-lg bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="size-3.5 sm:size-4" />}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1a4d3e] max-w-[70px] md:max-w-[95px] lg:max-w-[130px] truncate block" title={user.fullName}>
                      {user.fullName || user.login}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#d4a84b]/20 text-[#1a4d3e] border border-[#d4a84b]/30 hidden xl:inline">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-none truncate max-w-[95px]">
                    {user.groupName ? `Гр. ${user.groupName}` : `@${user.login}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="p-1 sm:p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="size-3.5 sm:size-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to={pathKeys.login}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#1a4d3e] text-white hover:bg-[#1a4d3e]/90 shadow-2xs transition-all duration-200"
              >
                <LogIn className="size-3.5 text-[#d4a84b]" />
                <span>Войти</span>
              </NavLink>
            )}

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={cn(
                "md:hidden p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center",
                isMobileMenuOpen
                  ? "bg-[#1a4d3e] text-white border-[#1a4d3e]"
                  : "bg-white/80 text-[#1a4d3e] border-[#1a4d3e]/15 hover:bg-[#1a4d3e]/10"
              )}
              aria-label={isMobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#1a4d3e]/10 bg-[#f5f3ed]/98 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
              {user && (
                <div className="p-3 rounded-2xl bg-white border border-[#1a4d3e]/15 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center text-sm font-bold shrink-0 shadow-xs">
                      {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#1a4d3e] truncate">
                          {user.fullName || user.login}
                        </p>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d4a84b]/20 text-[#1a4d3e] border border-[#d4a84b]/30 shrink-0">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.groupName ? `Группа ${user.groupName}` : `@${user.login}`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors shrink-0 cursor-pointer"
                    title="Выйти"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a4d3e]/60 px-2 mb-1">
                  Навигация
                </p>
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-[#1a4d3e] text-white shadow-xs font-bold"
                          : "text-[#1a4d3e] hover:bg-[#1a4d3e]/10 bg-white/60 border border-[#1a4d3e]/10"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "size-8 rounded-lg flex items-center justify-center",
                              isActive ? "bg-white/15 text-[#d4a84b]" : "bg-[#1a4d3e]/10 text-[#1a4d3e]"
                            )}
                          >
                            <l.icon className="size-4" />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-bold block">{l.label}</span>
                            <span className={cn("text-[11px] block", isActive ? "text-white/80" : "text-muted-foreground")}>
                              {l.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn("size-4", isActive ? "text-[#d4a84b]" : "text-muted-foreground")} />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {!user && (
                <NavLink
                  to={pathKeys.login}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1a4d3e] text-white font-bold text-sm shadow-xs hover:bg-[#1a4d3e]/90 transition-colors"
                >
                  <LogIn className="size-4 text-[#d4a84b]" />
                  <span>Войти в систему</span>
                </NavLink>
              )}
            </div>
          </div>
        )}
      </header>

      <nav
        aria-label="Мобильная навигация"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden 
                   bg-[#f5f3ed]/95 backdrop-blur-xl border-t border-[#1a4d3e]/10 
                   pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-xl transition-all duration-300 outline-none active:scale-95",
                  isActive ? "text-[#1a4d3e]" : "text-muted-foreground hover:text-[#1a4d3e]/70"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <l.icon className={cn("size-5 transition-transform duration-300", isActive && "scale-110")} />
                    {isActive && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-[#d4a84b] rounded-full" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold tracking-wide">{l.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {user ? (
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-xl transition-all duration-300 outline-none active:scale-95 text-muted-foreground hover:text-danger cursor-pointer"
              title="Выйти"
            >
              <LogOut className="size-5" />
              <span className="text-[10px] font-bold tracking-wide">Выйти</span>
            </button>
          ) : (
            <NavLink
              to={pathKeys.login}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-xl transition-all duration-300 outline-none active:scale-95",
                  isActive ? "text-[#1a4d3e]" : "text-muted-foreground hover:text-[#1a4d3e]"
                )
              }
            >
              <LogIn className="size-5" />
              <span className="text-[10px] font-bold tracking-wide">Войти</span>
            </NavLink>
          )}
        </div>
      </nav>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        userName={user?.fullName || (user?.login ? `@${user.login}` : undefined)}
        userRole={getRoleLabel(user?.role)}
      />
    </>
  );
}