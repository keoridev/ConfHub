import type { Room } from "~entities/talk/model/types";
import { ROOM_COLORS } from "../../model/constants";

interface ScheduleLegendProps {
  rooms: Room[];
}

export function ScheduleLegend({ rooms }: ScheduleLegendProps) {
  return (
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
  );
}
