import { NavLink } from "react-router-dom";
import { cn } from "~app/lib/utils";
import { pathKeys } from "~shared/lib";

const links = [
  { to: pathKeys.conference.byId("demo"), label: "Программа" },
  { to: pathKeys.submission(), label: "Подать заявку" },
  { to: pathKeys.jury(), label: "Жюри" },
];

export function DemoNav() {
  return (
    <nav 
      aria-label="Основная навигация" 
      className="flex items-center gap-1.5 p-1 bg-muted/40 backdrop-blur-sm rounded-lg border border-border/50"
    >
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              "relative px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 outline-none select-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className="relative z-10">{l.label}</span>
              {/* Акцентная точка/линия для активного состояния */}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full transition-all duration-300" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}