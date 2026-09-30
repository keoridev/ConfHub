import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, MapPin, User } from "lucide-react";
import { Card, Chip, Skeleton } from "@heroui/react";

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
    <div className="py-8 max-w-3xl mx-auto flex flex-col gap-6 px-4">
      {/* Кнопка назад */}
      <Link
        to={pathKeys.conference.byId("demo")}
        className="text-sm text-default-500 flex items-center gap-1.5 w-fit hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> 
        К программе
      </Link>
      
      {/* Основная карточка */}
      <Card className="border border-default-200 bg-background/80 backdrop-blur-sm shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
        
        {/* Шапка карточки */}
        <Card.Header className="flex flex-col gap-4 px-6 pt-6 pb-2">
          {/* Чипсы с мета-информацией */}
          <div className="flex gap-2 flex-wrap">
            <Chip 
              size="sm" 
              variant="flat" 
              color="primary" 
              startContent={<Clock className="size-3" />}
            >
              {fmtTime(talk.startTime)} – {fmtTime(talk.endTime)}
            </Chip>
            
            <Chip 
              size="sm" 
              variant="bordered" 
              startContent={<MapPin className="size-3" />}
            >
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
          
          {/* Заголовок и спикер */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-foreground">
              {talk.title}
            </h1>
            <div className="flex items-center gap-2 text-lg text-default-600 font-medium">
              <User className="size-4 text-default-400" />
              <p>{talk.speakerName}</p>
            </div>
          </div>
        </Card.Header>
        
        {/* Основной контент */}
        <Card.Content className="px-6 pb-6 flex flex-col gap-6">
          {/* Аннотация */}
          <div className="prose prose-sm max-w-none text-default-700 leading-relaxed bg-default-50/50 p-4 rounded-lg border border-default-100">
            <p className="m-0">{talk.abstract}</p>
          </div>
          
          {/* Теги */}
          <div className="flex gap-2 flex-wrap pt-2">
            {talk.tags.map((tag) => (
              <Chip 
                key={tag} 
                size="sm" 
                variant="flat" 
                color="default"
                className="bg-background border border-default-200 font-normal shadow-sm"
              >
                #{tag}
              </Chip>
            ))}
          </div> 
        </Card.Content>
      </Card>
    </div>
  );
}

export const talkPageRoute = { element: <TalkPage /> };