import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import { Card, Chip } from "@heroui/react";

import type { Section, Talk } from "~entities/talk/model/types";
import { pathKeys } from "~shared/lib";

interface TalkCardProps {
  talk: Talk;
  section?: Section;
  isLive?: boolean;
}

const fmtTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function TalkCard({ talk, section, isLive = false }: TalkCardProps) {
  return (
    <Link to={pathKeys.talk.byId(talk.id)} className="block">
      <Card
        isHoverable
        className="border border-default-200 shadow-sm transition-all duration-200"
      >
        {/* Заменяем отсутствующий CardBody на обычный div */}
        <div className="flex flex-col gap-3 p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Chip
              size="sm"
              variant="flat"
              color="default"
              startContent={<Clock className="size-3" />}
            >
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Chip>

            {talk.hallNumber && (
              <Chip
                size="sm"
                variant="bordered"
                startContent={<MapPin className="size-3" />}
              >
                Ауд. {talk.hallNumber}
              </Chip>
            )}

            {section && (
              <Chip
                size="sm"
                variant="flat"
                style={{
                  backgroundColor: `${section.color}15`,
                  color: section.color,
                  border: `1px solid ${section.color}30`,
                }}
              >
                {section.title}
              </Chip>
            )}

            {isLive && (
              <Chip
                size="sm"
                color="danger"
                variant="dot"
                className="font-semibold animate-pulse"
              >
                Live
              </Chip>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-foreground leading-snug text-base">
              {talk.title}
            </h3>
            <p className="text-sm text-default-500 mt-1">{talk.speakerName}</p>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {talk.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-default-400 bg-default-100 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}