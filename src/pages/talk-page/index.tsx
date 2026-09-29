import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin } from "lucide-react";

import { useTalkQuery } from "~entities/talk/api/queries";
import { Skeleton } from "~app/components/ui/skeleton";
import { pathKeys } from "~shared/lib";
import { Card, CardContent } from "~app/components/ui/card";
import { sections } from "~shared/mocks/demoServer";
import { Badge } from "~app/components/ui/badge";

const fmtTime = (iso: string) =>
  iso
    ? new Date(iso).toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function TalkPage() {
  const { talkId = "" } = useParams();
  const { data: talk, isLoading } = useTalkQuery(talkId);

  if (isLoading) return <Skeleton className="h-64 w-full mt-6" />;
  if (!talk) return <p className="py-10 text-center">Доклад не найден</p>;

  const section = sections.find((s) => s.id === talk.sectionId);

  return (
    <div className="py-6 flex flex-col gap-4">
      <Link
        to={pathKeys.conference.byId("demo")}
        className="text-sm text-dove flex items-center gap-1 w-fit hover:text-tundora"
      >
        <ArrowLeft className="size-4" /> К программе
      </Link>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Clock className="size-3" />
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <MapPin className="size-3" />
              {talk.hallNumber
                ? `Ауд. ${talk.hallNumber}`
                : "Аудитория будет назначена"}
            </Badge>
            {section && (
              <Badge
                variant="outline"
                style={{ borderColor: section.color, color: section.color }}
              >
                {section.title}
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-snug">
              {talk.title}
            </h1>
            <p className="text-muted-foreground mt-2">{talk.speakerName}</p>
          </div>
          <p>{talk.abstract}</p>
          <div className="flex gap-2 flex-wrap">
            {talk.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const talkPageRoute = { element: <TalkPage /> };
