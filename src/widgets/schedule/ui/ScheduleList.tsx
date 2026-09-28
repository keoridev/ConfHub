import type { Talk } from "~entities/talk/model/types";
import type { Section } from "~entities/talk/model/types";
import { TalkCard } from "./TalkCard";
import { Skeleton } from "~app/components/ui/skeleton";

interface ScheduleListProps {
  talks: Talk[];
  sections: Section[];
  isLoading?: boolean;
}

const isLiveNow = (talk: Talk) => {
  const now = Date.now();
  return now >= Date.parse(talk.startTime) && now <= Date.parse(talk.endTime);
};

export function ScheduleList({
  talks,
  sections,
  isLoading,
}: ScheduleListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  if (talks.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-10">
        Доклады не найдены
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {talks.map((talk) => (
        <TalkCard
          key={talk.id}
          talk={talk}
          section={sections.find((s) => s.id === talk.sectionId)}
          isLive={isLiveNow(talk)}
        />
      ))}
    </div>
  );
}
