import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { Card, CardHeader, Chip, Skeleton } from "@heroui/react";

import { useTalkQuery } from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { sections } from "~shared/mocks/demoServer";

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

  if (isLoading) return <Skeleton className="h-64 w-full mt-6 rounded-xl" />;
  if (!talk) return <p className="py-10 text-center text-default-500">Доклад не найден</p>;

  const section = sections.find((s) => s.id === talk.sectionId);

  return (
    <div className="py-8 max-w-3xl mx-auto flex flex-col gap-6">
      <Link
        to={pathKeys.conference.byId("demo")}
        className="text-sm text-default-500 flex items-center gap-1 w-fit hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> К программе
      </Link>
      
      <Card className="border border-default-200 shadow-md">
        <CardHeader className="flex flex-col gap-4 pb-2 px-6 pt-6">
          <div className="flex gap-2 flex-wrap">
            <Chip size="sm" variant="flat" color="primary" startContent={<Clock className="size-3" />}>
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Chip>
            <Chip size="sm" variant="bordered" startContent={<MapPin className="size-3" />}>
              {talk.hallNumber ? `Ауд. ${talk.hallNumber}` : "Аудитория будет назначена"}
            </Chip>
            {section && (
              <Chip 
                size="sm" 
                variant="flat"
                style={{ backgroundColor: `${section.color}15`, color: section.color }}
              >
                {section.title}
              </Chip>
            )}
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              {talk.title}
            </h1>
            <p className="text-lg text-default-600 mt-3 font-medium">{talk.speakerName}</p>
          </div>
        </CardHeader>
        
        {/* Заменяем отсутствующий CardBody на обычный div для сохранения отступов и flex */}
        <div className="flex flex-col gap-6 px-6 pb-6">
          <div className="prose prose-sm max-w-none text-default-700 leading-relaxed">
            <p>{talk.abstract}</p>
          </div>
          
          <div className="flex gap-2 flex-wrap pt-4 border-t border-default-200">
            {talk.tags.map((tag) => (
              <Chip key={tag} size="sm" variant="flat" color="default">
                #{tag}
              </Chip>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export const talkPageRoute = { element: <TalkPage /> };