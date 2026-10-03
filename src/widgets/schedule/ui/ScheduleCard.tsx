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
  // --- РЕЖИМ СПИСКА (Compact) ---
  if (isCompact) {
    return (
      <Link to={pathKeys.talk.byId(talk.id)}>
        <div className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 bg-white rounded-xl border border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 hover:shadow-md transition-all duration-300">
          {/* Time Block */}
          <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 min-w-[100px]">
            <div className="flex items-center gap-2 text-[#1a4d3e] font-bold text-base">
              <Clock className="size-4" />
              <span>{fmtTime(talk.startTime)}</span>
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              до {fmtTime(talk.endTime)}
            </div>
          </div>

          {/* Divider for mobile */}
          <div className="w-full h-px bg-[#1a4d3e]/10 sm:hidden" />

          {/* Content Block */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors mb-2 line-clamp-2">
              {talk.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-[#1a4d3e]/80">
                {talk.speakerName}
              </span>
              {talk.company && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">
                    ·
                  </span>
                  <span className="text-muted-foreground">{talk.company}</span>
                </>
              )}
              {talk.hallNumber && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">
                    ·
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground bg-[#f5f3ed] px-2 py-0.5 rounded-md">
                    <MapPin className="size-3" />
                    Зал {talk.hallNumber}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Tags Block */}
          {talk.tags.length > 0 && (
            <div className="flex-shrink-0 flex gap-2 flex-wrap sm:justify-end">
              {talk.tags.slice(0, 2).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="bg-[#f5f3ed] text-[#1a4d3e] text-xs font-medium border border-[#1a4d3e]/10"
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

  // --- РЕЖИМ КАРТОЧЕК (Full) ---
  return (
    <Link to={pathKeys.talk.byId(talk.id)}>
      <Card className="group relative border border-[#1a4d3e]/10 bg-white hover:border-[#d4a84b]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        {section && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
            style={{ backgroundColor: section.color || "#1a4d3e" }}
          />
        )}

        <div className="p-6 pl-8 flex flex-col flex-1">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Chip
              size="sm"
              variant="flat"
              className="bg-[#1a4d3e] text-white font-semibold"
              startContent={<Clock className="size-3.5" />}
            >
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Chip>

            {talk.hallNumber && (
              <Chip
                size="sm"
                variant="bordered"
                startContent={<MapPin className="size-3.5" />}
                className="border-[#1a4d3e]/30 text-[#1a4d3e] font-medium"
              >
                Зал {talk.hallNumber}
              </Chip>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <h3 className="text-xl font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors line-clamp-3">
              {talk.title}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-semibold text-[#1a4d3e]/70">
                {talk.speakerName}
              </span>
              {talk.company && (
                <>
                  <span>·</span>
                  <span>{talk.company}</span>
                </>
              )}
            </div>
          </div>

          {talk.tags.length > 0 && (
            <div className="flex gap-2 mt-6 flex-wrap">
              {talk.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="bg-[#f5f3ed] text-[#1a4d3e] text-xs font-medium border border-[#1a4d3e]/10"
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
