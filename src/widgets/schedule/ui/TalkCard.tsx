import { Badge, Clock, MapPin, Radio } from "lucide-react";
import { Card, CardContent } from "~app/components/ui/card";
import type { Section, Talk } from "~entities/talk/model/types";

interface TalkCardProps {
  talk: Talk;
  section?: Section;
  isLive?: boolean;
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

export function TalkCard({ talk, section, isLive = false }: TalkCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <MapPin className="size-3" />
            Ауд. {talk.hallNumber}
          </Badge>
          {section && (
            <Badge
              variant="outline"
              style={{ borderColor: section.color, color: section.color }}
            >
              {section.title}
            </Badge>
          )}
          {isLive && (
            <Badge className="gap-1 bg-red-600 hover:bg-red-600 animate-pulse">
              <Radio className="size-3" />
              Live
            </Badge>
          )}
        </div>
        <div>
          <h3 className="font-semibold leading-snug">{talk.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {talk.speakerName}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {talk.tags.map((tag) => (
            <span key={tag} className="text-xs text-dove">
              #{tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
