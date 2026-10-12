import { Clock, MapPin } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { pathKeys } from "~shared/lib";
import type { Talk } from "~entities/talk/model/types";
import { fmtTime } from "~entities/talk";

interface CurrentTalkCardProps {
  talk: Talk;
  variant: "current" | "next";
  hallName?: string;
  now?: Date;
}

export function CurrentTalkCard({
  talk,
  variant,
  hallName,
  now = new Date(),
}: CurrentTalkCardProps) {
  const isCurrent = variant === "current";

  const currentTimeMs = now.getTime();
  const startTimeMs = talk.startTime ? new Date(talk.startTime).getTime() : 0;
  const endTimeMs = talk.endTime ? new Date(talk.endTime).getTime() : 0;

  let countdownText = "";
  if (isCurrent) {
    const diff = Math.max(0, endTimeMs - currentTimeMs);
    const minutes = Math.ceil(diff / 60000);
    countdownText = `СЕЙЧАС · ОСТАЛОСЬ ${minutes > 0 ? minutes : 1} МИН`;
  } else {
    if (startTimeMs > currentTimeMs) {
      const diff = startTimeMs - currentTimeMs;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        countdownText = `ДАЛЕЕ · ЧЕРЕЗ ${days} ДН ${hours % 24} Ч`;
      } else if (hours > 0) {
        countdownText = `ДАЛЕЕ · ЧЕРЕЗ ${hours} Ч ${minutes % 60} МИН`;
      } else if (minutes > 0) {
        countdownText = `ДАЛЕЕ · ЧЕРЕЗ ${minutes} МИН`;
      } else {
        countdownText = `ДАЛЕЕ · ЧЕРЕЗ ${seconds} СЕК`;
      }
    } else {
      countdownText = "ДАЛЕЕ · СКОРО";
    }
  }

  const progressPercentage = isCurrent
    ? (() => {
        const totalDuration = endTimeMs - startTimeMs;
        const elapsed = currentTimeMs - startTimeMs;
        if (totalDuration <= 0) return 100;
        return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
      })()
    : 0;

  const roomDisplay =
    talk.room?.name ? (talk.room.name.toLowerCase().startsWith("ауд") || talk.room.name.toLowerCase().startsWith("зал") ? talk.room.name : `Зал ${talk.room.name}`) : hallName || "Зал А";

  return (
    <Link to={pathKeys.talk.build(String(talk.id))} className="block group">
      <Card
        className={`p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:shadow-lg ${
          isCurrent
            ? "bg-gradient-to-br from-[#d4a84b] to-[#c2963b] text-[#1a382e] border border-[#d4a84b]/40 shadow-md"
            : "bg-white/95 backdrop-blur-sm border border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 shadow-xs"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isCurrent ? "bg-[#1a382e] animate-ping" : "bg-emerald-600 animate-pulse"
              }`}
            />
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                isCurrent ? "text-[#1a382e]" : "text-[#1a4d3e]"
              }`}
            >
              {countdownText}
            </span>
          </div>

          <Chip
            size="sm"
            variant="soft"
            className={`font-semibold flex items-center gap-1 ${
              isCurrent
                ? "bg-[#1a382e] text-white border-0"
                : "bg-[#1a4d3e]/10 text-[#1a4d3e] border border-[#1a4d3e]/20"
            }`}
          >
            <MapPin className="size-3 inline mr-1" />
            {roomDisplay}
          </Chip>
        </div>

        <h4
          className={`text-lg font-bold mb-1.5 line-clamp-2 transition-colors ${
            isCurrent ? "text-[#1a382e]" : "text-[#1a4d3e] group-hover:text-[#1a4d3e]/80"
          }`}
        >
          {talk.title}
        </h4>

        <p
          className={`text-sm mb-4 line-clamp-1 ${
            isCurrent ? "text-[#1a382e]/85 font-medium" : "text-muted-foreground"
          }`}
        >
          {talk.speakerName}
        </p>

        <div className="flex items-center justify-between text-xs font-semibold">
          <div
            className={`flex items-center gap-1.5 ${
              isCurrent ? "text-[#1a382e]" : "text-[#1a4d3e]"
            }`}
          >
            <Clock className="size-3.5" />
            <span>
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </span>
          </div>
          
          <span className={`text-[11px] font-medium ${isCurrent ? "text-[#1a382e]/80" : "text-muted-foreground"}`}>
            Подробнее →
          </span>
        </div>

        {isCurrent && (
          <div className="mt-4 h-1.5 bg-[#1a382e]/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a382e] rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </Card>
    </Link>
  );
}