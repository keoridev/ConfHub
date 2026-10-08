import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays, FilePenLine, Users, Sparkles, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "~app/lib/utils";
import { pathKeys } from "~shared/lib";
import { useCurrentUserQuery, useLogout } from "~entities/talk/api/queries";

const links = [
  { to: pathKeys.conference.build("demo"), label: "Программа", icon: CalendarDays },
  { to: pathKeys.submission, label: "Подать заявку", icon: FilePenLine },
  { to: pathKeys.jury, label: "Жюри", icon: Users },
];

export function AppNavigation() {
  const { data: user } = useCurrentUserQuery();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info("Вы вышли из системы");
    navigate(pathKeys.conference.build("demo"));
  };

  const getRoleLabel = (role?: string) => {
    if (role === "admin") return "Оргкомитет";
    if (role === "jury") return "Жюри";
    return "Студент";
  };

  return (
    <>
      {/* МОБИЛЬНАЯ НАВИГАЦИЯ (Нижняя панель) */}
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
              onClick={handleLogout}
              className="flex flex-col items-center justify-center w-full h-full gap-1.5 rounded-xl transition-all duration-300 outline-none active:scale-95 text-muted-foreground hover:text-danger"
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

      {/* ДЕСКТОПНАЯ НАВИГАЦИЯ (Верхний Header) */}
      <header className="hidden md:flex sticky top-0 z-40 w-full bg-[#f5f3ed]/85 backdrop-blur-md border-b border-[#1a4d3e]/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between w-full">
          <NavLink to={pathKeys.conference.build("demo")} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#1a4d3e] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Sparkles className="size-4 text-[#d4a84b]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1a4d3e] tracking-tight leading-none">СИГНАЛ</h1>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-wider">2026</p>
            </div>
          </NavLink>

          {/* Навигационные ссылки */}
          <nav aria-label="Основная навигация" className="flex items-center gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 outline-none",
                    isActive ? "text-[#1a4d3e] bg-[#1a4d3e]/5" : "text-muted-foreground hover:text-[#1a4d3e] hover:bg-[#1a4d3e]/5"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <l.icon className={cn("size-4", isActive && "text-[#d4a84b]")} />
                    <span>{l.label}</span>
                    {isActive && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#d4a84b]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Блок авторизации */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-[#1a4d3e]/15 px-3 py-1.5 rounded-xl shadow-xs">
                <div className="size-8 rounded-lg bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center text-xs font-bold">
                  {user.fullName ? user.fullName[0].toUpperCase() : <UserIcon className="size-4" />}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#1a4d3e] max-w-[120px] truncate" title={user.fullName}>
                      {user.fullName || user.login}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d4a84b]/20 text-[#1a4d3e] border border-[#d4a84b]/30">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-none">
                    {user.groupName ? `Группа ${user.groupName}` : `@${user.login}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors ml-1"
                  title="Выйти из аккаунта"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <NavLink
                to={pathKeys.login}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[#1a4d3e] text-white hover:bg-[#1a4d3e]/90 shadow-sm transition-all duration-200"
              >
                <LogIn className="size-4 text-[#d4a84b]" />
                <span>Войти</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>
    </>
  );
}