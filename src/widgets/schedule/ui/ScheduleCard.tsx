// ScheduleCard.tsx
import { Clock, MapPin } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { pathKeys } from "~shared/lib";

interface ScheduleCardProps {
  talk: {
    id: string;
    title: string;
    speakerName: string;
    startTime: string;
    endTime: string;
    hallNumber?: string;
    sectionId: string;
    tags: string[];
    company?: string;
  };
  section?: {
    id: string;
    title: string;
    color: string;
  };
  isCompact?: boolean;
}

const fmtTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function ScheduleCard({
  talk,
  section,
  isCompact = false,
}: ScheduleCardProps) {
  if (isCompact) {
    return (
      <Link to={pathKeys.talk.byId(talk.id)}>
        <div className="group flex items-start gap-6 p-6 bg-white rounded-xl border border-border/30 hover:border-[#1a4d3e]/50 hover:shadow-lg transition-all duration-300">
          {/* Time */}
          <div className="flex-shrink-0 w-32">
            <div className="flex items-center gap-2 text-[#1a4d3e] font-semibold">
              <Clock className="size-4" />
              <span>{fmtTime(talk.startTime)}</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {fmtTime(talk.endTime)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors mb-2 line-clamp-2">
              {talk.title}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-muted-foreground font-medium">
                {talk.speakerName}
              </span>
              {talk.company && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{talk.company}</span>
                </>
              )}
              {talk.hallNumber && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3" />
                    Зал {talk.hallNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          {talk.tags.length > 0 && (
            <div className="flex-shrink-0 flex gap-2">
              {talk.tags.slice(0, 2).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="bg-[#f5f3ed] text-[#1a4d3e] text-xs"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Full card version
  return (
    <Link to={pathKeys.talk.byId(talk.id)}>
      <Card className="group relative border border-border/50 bg-white hover:border-[#1a4d3e]/30 hover:shadow-xl transition-all duration-300">
        {section && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ backgroundColor: section.color || "#1a4d3e" }}
          />
        )}

        <div className="p-6 pl-7">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Chip
              size="sm"
              variant="flat"
              className="bg-[#1a4d3e] text-white font-medium"
              startContent={<Clock className="size-3" />}
            >
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Chip>

            {talk.hallNumber && (
              <Chip
                size="sm"
                variant="bordered"
                startContent={<MapPin className="size-3" />}
                className="border-[#1a4d3e]/30 text-[#1a4d3e]"
              >
                Зал {talk.hallNumber}
              </Chip>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors line-clamp-2">
              {talk.title}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium">{talk.speakerName}</span>
              {talk.company && (
                <>
                  <span>·</span>
                  <span>{talk.company}</span>
                </>
              )}
            </div>
          </div>

          {talk.tags.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {talk.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="bg-[#f5f3ed] text-[#1a4d3e] text-xs"
                >
                  {tag}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
