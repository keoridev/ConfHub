import { toast } from "sonner";
import { Check, X } from "lucide-react";
import {
  useAIResultQuery,
  useReviewTalkMutation,
  useTalksQuery,
} from "~entities/talk/api/queries";
import type { Talk } from "~entities/talk/model/types";
import { sections } from "~shared/mocks/demoServer";
import { Card, CardContent, CardHeader, CardTitle } from "~app/components/ui/card";
import { Badge } from "~app/components/ui/badge";
import { Skeleton } from "~app/components/ui/skeleton";
import { Progress } from "~app/components/ui/progress";
import { Button } from "~app/components/ui/button";

function JuryCard({ talk }: { talk: Talk }) {
  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk.id);
  const review = useReviewTalkMutation();
  const section = sections.find((s) => s.id === talk.sectionId);

  const handleReview = (status: "approved" | "rejected") =>
    review.mutate(
      { id: talk.id, status },
      {
        onSuccess: () =>
          toast.success(
            status === "approved" ? "Заявка одобрена" : "Заявка отклонена",
          ),
      },
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg leading-snug">{talk.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap text-sm">
          <span className="text-muted-foreground">{talk.speakerName}</span>
          {section && (
            <Badge
              variant="outline"
              style={{ borderColor: section.color, color: section.color }}
            >
              {section.title}
            </Badge>
          )}
        </div>
        <p className="text-sm">{talk.abstract}</p>

        {aiLoading && <Skeleton className="h-16 w-full" />}
        {ai && (
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Progress value={ai.matchScore} className="flex-1" />
            <span className="text-sm font-semibold w-12 text-right">
              {ai.matchScore}%
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="gap-1"
            disabled={review.isPending}
            onClick={() => handleReview("approved")}
          >
            <Check className="size-4" /> Одобрить
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1"
            disabled={review.isPending}
            onClick={() => handleReview("rejected")}
          >
            <X className="size-4" /> Отклонить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function JuryPage() {
  const { data: talks = [], isLoading } = useTalksQuery();
  const queue = talks.filter((t) => t.status === "pending_review");

  return (
    <div className="py-6 flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Очередь заявок жюри</h1>
      {isLoading && <Skeleton className="h-40 w-full" />}
      {!isLoading && queue.length === 0 && (
        <p className="text-muted-foreground text-center py-10">
          Новых заявок нет
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {queue.map((t) => (
          <JuryCard key={t.id} talk={t} />
        ))}
      </div>
    </div>
  );
}

export const juryPageRoute = { element: <JuryPage /> };
