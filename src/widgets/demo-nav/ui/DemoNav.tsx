import { NavLink } from "react-router-dom";
import { CalendarDays, FilePenLine, Users, Sparkles } from "lucide-react";
import { cn } from "~app/lib/utils";
import { pathKeys } from "~shared/lib";

const links = [
  { to: pathKeys.conference.byId("demo"), label: "Программа", icon: CalendarDays },
  { to: pathKeys.submission(), label: "Подать заявку", icon: FilePenLine },
  { to: pathKeys.jury(), label: "Жюри", icon: Users },
];

export function AppNavigation() {
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
        </div>
      </nav>

      {/* ДЕСКТОПНАЯ НАВИГАЦИЯ (Верхний Header) */}
      <header className="hidden md:flex sticky top-0 z-40 w-full bg-[#f5f3ed]/80 backdrop-blur-md border-b border-[#1a4d3e]/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between w-full">
          <NavLink to={pathKeys.conference.byId("demo")} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#1a4d3e] flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Sparkles className="size-4 text-[#d4a84b]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1a4d3e] tracking-tight leading-none">СИГНАЛ</h1>
              <p className="text-[10px] text-muted-foreground font-semibold tracking-wider">2026</p>
            </div>
          </NavLink>

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
        </div>
      </header>
    </>
  );
}