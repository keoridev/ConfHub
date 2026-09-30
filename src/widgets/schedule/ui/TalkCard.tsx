// CurrentTalkCard.tsx
import { Clock } from "lucide-react";
import { Card, Chip } from "@heroui/react";
import { Link } from "react-router-dom";
import { pathKeys } from "~shared/lib";

interface CurrentTalkCardProps {
  talk: {
    id: string;
    title: string;
    speakerName: string;
    startTime: string;
    endTime: string;
    company?: string;
  };
  variant: "current" | "next";
  hallName: string;
}

const fmtTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const getTimeRemaining = (endTime: string) => {
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const diff = Math.max(0, end - now);
  const minutes = Math.floor(diff / 60000);
  return minutes;
};

export function CurrentTalkCard({
  talk,
  variant,
  hallName,
}: CurrentTalkCardProps) {
  const isCurrent = variant === "current";
  const minutesLeft = isCurrent ? getTimeRemaining(talk.endTime) : 30;

  return (
    <Link to={pathKeys.talk.byId(talk.id)}>
      <Card
        className={`p-6 rounded-xl transition-all duration-300 hover:shadow-lg ${
          isCurrent
            ? "bg-[#e8b84d] border-0"
            : "bg-white border border-border/50"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isCurrent ? "bg-[#1a4d3e] animate-pulse" : "bg-[#1a4d3e]"}`}
            />
            <span
              className={`text-xs font-medium uppercase tracking-wide ${
                isCurrent ? "text-[#1a4d3e]" : "text-muted-foreground"
              }`}
            >
              {isCurrent
                ? `СЕЙЧАС · ОСТАЛОСЬ ${minutesLeft} МИНУТ`
                : `ДАЛЕЕ · ЧЕРЕЗ ${minutesLeft} МИНУТ`}
            </span>
          </div>
        </div>

        <h4
          className={`text-xl font-bold mb-2 ${
            isCurrent ? "text-[#1a4d3e]" : "text-[#1a4d3e]"
          }`}
        >
          {talk.title}
        </h4>

        <p
          className={`text-sm mb-4 ${
            isCurrent ? "text-[#1a4d3e]/80" : "text-muted-foreground"
          }`}
        >
          {talk.speakerName} {talk.company && `· ${talk.company}`}
        </p>

        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-2 text-sm font-medium ${
              isCurrent ? "text-[#1a4d3e]" : "text-[#1a4d3e]"
            }`}
          >
            <Clock className="size-4" />
            {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
          </div>

          <Chip
            size="sm"
            className={`${
              isCurrent ? "bg-[#1a4d3e] text-white" : "bg-[#1a4d3e] text-white"
            }`}
          >
            {hallName}
          </Chip>
        </div>

        {isCurrent && (
          <div className="mt-4 h-1 bg-[#1a4d3e]/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a4d3e] rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, Math.min(100, (1 - minutesLeft / 45) * 100))}%`,
              }}
            />
          </div>
        )}
      </Card>
    </Link>
  );
}
