import { useState } from "react";
import { toast } from "sonner";
import { Check, X, } from "lucide-react";

import {
  useAIResultQuery,
  useReviewTalkMutation,
  useTalksQuery,
} from "~entities/talk/api/queries";
import type { Talk } from "~entities/talk/model/types";
import { sections } from "~shared/mocks/demoServer";

// Импорты из HeroUI v3
import {
  Card,
  Chip,
  Skeleton,
  ProgressBar,
  Button,
  Modal,
  TextField,
  Input,
  Label,
} from "@heroui/react";

function JuryCard({ talk }: { talk: Talk }) {
  const { data: ai, isLoading: aiLoading } = useAIResultQuery(talk.id);
  const review = useReviewTalkMutation();
  const section = sections.find((s) => s.id === talk.sectionId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hallNumber, setHallNumber] = useState(talk.hallNumber || "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleReject = () => {
    review.mutate(
      { id: talk.id, status: "rejected" },
      { onSuccess: () => toast.error("Заявка отклонена") }
    );
  };

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hallNumber || !startTime || !endTime) {
      toast.error("Заполните время и аудиторию");
      return;
    }
    review.mutate(
      {
        id: talk.id,
        status: "approved",
        updates: {
          hallNumber,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        },
      },
      {
        onSuccess: () => {
          toast.success("Заявка одобрена и добавлена в расписание");
          setIsDialogOpen(false);
        },
      }
    );
  };

  return (
    <>
      <Card className="border border-default-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-lg leading-snug font-semibold text-foreground">
              {talk.title}
            </h3>
            <Chip
              size="sm"
              className="shrink-0"
              style={{ borderColor: section?.color, color: section?.color }}
            >
              {section?.title}
            </Chip>
          </div>
          
          <p className="text-base text-default-600 font-medium">
            {talk.speakerName}
          </p>

          <p className="text-sm text-default-500 line-clamp-3">
            {talk.abstract}
          </p>

          {aiLoading && <Skeleton className="h-16 w-full rounded-lg" />}

          {ai && (
            <div className="rounded-lg border border-default-200 bg-default-50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-default-500 uppercase tracking-wider">
                  AI Score
                </span>
                <span
                  className={`text-sm font-bold ${
                    ai.matchScore >= 80 ? "text-success" : "text-warning"
                  }`}
                >
                  {ai.matchScore}%
                </span>
              </div>
              <ProgressBar 
                value={ai.matchScore} 
                color={ai.matchScore >= 80 ? "success" : "warning"} 
                size="sm"
              >
                <ProgressBar.Track>
                  <ProgressBar.Fill />
                </ProgressBar.Track>
              </ProgressBar>
              <p className="text-xs text-default-500 line-clamp-2">
                {ai.sectionMatch.explanation}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="primary"
              className="flex-1 gap-2"
              isPending={review.isPending}
              isDisabled={review.isPending}
              onClick={() => setIsDialogOpen(true)}
            >
              <Check className="size-4" />
              Одобрить
            </Button>
            <Button
              size="sm"
              variant="danger"
              className="flex-1 gap-2"
              isPending={review.isPending}
              isDisabled={review.isPending}
              onClick={handleReject}
            >
              <X className="size-4" />
              Отклонить
            </Button>
          </div>
        </div>
      </Card>

      <Modal>
        <Modal.Backdrop isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Modal.Container placement="center">
            <Modal.Dialog>
              {({ close }) => (
                <form onSubmit={handleApproveSubmit}>
                  <Modal.Header>
                    <Modal.Heading>Назначение доклада</Modal.Heading>
                    <p className="text-sm text-default-500 font-normal mt-1">
                      Укажите аудиторию и время для утвержденного доклада «{talk.title}».
                    </p>
                  </Modal.Header>
                  
                  <Modal.Body className="px-6 py-2 space-y-4">
                    <TextField isRequired>
                      <Label>Аудитория</Label>
                      <Input
                        placeholder="Например: 302"
                        value={hallNumber}
                        onChange={(e) => setHallNumber(e.target.value)}
                      />
                    </TextField>
                    <div className="grid grid-cols-2 gap-4">
                      <TextField isRequired>
                        <Label>Начало</Label>
                        <Input
                          type="datetime-local"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </TextField>
                      <TextField isRequired>
                        <Label>Окончание</Label>
                        <Input
                          type="datetime-local"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </TextField>
                    </div>
                  </Modal.Body>

                  <Modal.Footer>
                    <Button 
                      variant="tertiary" 
                      onPress={close}
                      isDisabled={review.isPending}
                    >
                      Отмена
                    </Button>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      isPending={review.isPending}
                    >
                      {!review.isPending && <Check className="size-4" />}
                      Подтвердить и добавить
                    </Button>
                  </Modal.Footer>
                </form>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

export function JuryPage() {
  const { data: talks = [], isLoading } = useTalksQuery();
  const queue = talks.filter((t) => t.status === "pending_review");

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Очередь заявок жюри
        </h1>
        <p className="text-default-500">
          Проверьте AI-анализ и примите решение по новым докладам.
        </p>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && queue.length === 0 && (
        <Card className="border border-dashed border-default-300">
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Check className="size-12 text-default-300 mb-4" />
            <h3 className="text-lg font-semibold">Новых заявок нет</h3>
            <p className="text-sm text-default-500 mt-1">
              Все доклады были рассмотрены.
            </p>
          </div>
        </Card>
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