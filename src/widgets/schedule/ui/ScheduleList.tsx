import { Skeleton } from "@heroui/react";
import type { Talk, Section } from "~entities/talk/model/types";
import { TalkCard } from "./TalkCard";

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
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (talks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-default-500 text-lg">Доклады не найдены</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
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
