// ScheduleList.tsx
import { Card, Skeleton } from "@heroui/react";
import { ScheduleCard } from "./ScheduleCard";

interface ScheduleListProps {
  talks: any[];
  sections: any[];
  isLoading: boolean;
  viewMode?: 'compact' | 'card';
}

export function ScheduleList({ 
  talks, 
  sections, 
  isLoading, 
  viewMode = 'compact' 
}: ScheduleListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-1/4 mb-3 rounded-lg" />
            <Skeleton className="h-6 w-3/4 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </Card>
        ))}
      </div>
    );
  }

  if (talks.length === 0) {
    return (
      <Card className="p-12 text-center bg-[#f5f3ed]">
        <div className="size-16 mx-auto mb-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center">
          <span className="text-3xl">🔍</span>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-[#1a4d3e]">Ничего не найдено</h3>
        <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${viewMode === 'compact' ? 'space-y-3' : 'space-y-4'}`}>
      {talks.map((talk, index) => {
        const section = sections.find((s) => s.id === talk.sectionId);
        return (
          <div 
            key={talk.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <ScheduleCard 
              talk={talk} 
              section={section} 
              isCompact={viewMode === 'compact'}
            />
          </div>
        );
      })}
    </div>
  );
}