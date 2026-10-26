import { Clock, MapPin, Star } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { pathKeys } from "~shared/lib";
import type { Section, Talk } from "~entities/talk/model/types";
import { fmtTime } from "~entities/talk";

interface ScheduleCardProps {
  talk: Talk;
  section?: Section;
  isCompact?: boolean;
}

export function ScheduleCard({
  talk,
  section,
  isCompact = false,
}: ScheduleCardProps) {
  const durationMinutes =
    talk.startTime && talk.endTime
      ? Math.round(
          (new Date(talk.endTime).getTime() - new Date(talk.startTime).getTime()) /
            60000
        )
      : talk.isKeynote
      ? 15
      : 10;

  if (isCompact) {
    return (
      <Link to={pathKeys.talk.build(String(talk.id))}>
        <div className={`group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
          talk.isKeynote
            ? "bg-amber-50/40 border-amber-300 hover:border-amber-400 hover:shadow-md"
            : "bg-white border-[#1a4d3e]/10 hover:border-[#d4a84b]/50 hover:shadow-md"
        }`}>
          <div className="flex-shrink-0 flex sm:flex-col items-center sm:items-start gap-2 sm:gap-1 min-w-[100px]">
            <div className="flex items-center gap-2 text-[#1a4d3e] font-bold text-base">
              <Clock className="size-4" />
              <span>{fmtTime(talk.startTime)}</span>
            </div>
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <span>до {fmtTime(talk.endTime)}</span>
              <span className="font-mono">({durationMinutes} мин)</span>
            </div>
          </div>

          <div className="w-full h-px bg-[#1a4d3e]/10 sm:hidden" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {talk.isKeynote && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  <Star className="size-2.5 fill-amber-500 text-amber-500" />
                  <span>КЛЮЧЕВОЙ ДОКЛАД</span>
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors mb-2 line-clamp-2">
              {talk.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="font-semibold text-[#1a4d3e]/80">
                {talk.speakerName}
              </span>
              {talk.room?.name && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">
                    ·
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground bg-[#f5f3ed] px-2 py-0.5 rounded-md">
                    <MapPin className="size-3" />
                    Зал {talk.room.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {talk.tags.length > 0 && (
            <div className="flex-shrink-0 flex gap-2 flex-wrap sm:justify-end">
              {talk.tags.slice(0, 2).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="soft"
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

  return (
    <Link to={pathKeys.talk.build(String(talk.id))}>
      <Card className="group relative border border-[#1a4d3e]/10 bg-white hover:border-[#d4a84b]/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
        {section && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
            style={{ backgroundColor: section.color || "#1a4d3e" }}
          />
        )}

        <div className="p-4 sm:p-6 pl-5 sm:pl-8 flex flex-col flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
            {talk.isKeynote && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                <Star className="size-3 fill-amber-500 text-amber-500" />
                <span>Ключевой доклад</span>
              </span>
            )}

            <Chip
              size="sm"
              variant="soft"
              className="bg-[#1a4d3e] text-white font-semibold flex items-center gap-1"
            >
              <div className="flex items-center gap-1">
                <Clock className="size-3.5" /> {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
                <span className="opacity-75 font-normal ml-0.5 font-mono">({durationMinutes} мин)</span>
              </div>
            </Chip>

            {talk.room?.name && (
              <Chip
                size="sm"
                variant="soft"
                className="border-[#1a4d3e]/30 text-[#1a4d3e] font-medium flex items-center gap-1"
              >
                <div className="flex items-center gap-1"><MapPin className="size-3.5" /> Зал {talk.room.name}</div>
              </Chip>
            )}
          </div>

          <div className="space-y-3 flex-1">
            <h3 className="text-xl font-bold text-[#1a4d3e] group-hover:text-[#1a4d3e]/80 transition-colors line-clamp-3">
              {talk.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-[#1a4d3e]/80">
                {talk.speakerName}
              </span>
              {talk.gradeOrGroup && <span>• {talk.gradeOrGroup}</span>}
              {talk.university && <span className="truncate max-w-[200px]">• {talk.university}</span>}
            </div>
          </div>

          {talk.tags.length > 0 && (
            <div className="flex gap-2 mt-6 flex-wrap">
              {talk.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="soft"
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
