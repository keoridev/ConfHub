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
    <nav className="flex gap-1 py-3">
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          className={({ isActive }) =>
            cn(
              "px-3 py-1.5 rounded-md text-sm transition-colors",
              isActive
                ? "bg-primary text-white"
                : "text-tundora hover:bg-alto/40",
            )
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
