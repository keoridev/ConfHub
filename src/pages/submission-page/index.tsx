import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

import {
  useSubmitTalkMutation,
  useValidateMutation,
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~app/components/ui/card";
import { Label } from "~app/components/ui/label";
import { Input } from "~app/components/ui/input";

import { Textarea } from "~app/components/ui/textarea";
import { Button } from "~app/components/ui/button";
import { Progress } from "~app/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "~app/components/ui/alert";
import { sections } from "~shared/mocks/demoServer";
import { Badge } from "~app/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~app/components/ui/select";

export function SubmissionPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [speakerName, setSpeakerName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [abstract, setAbstract] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const validate = useValidateMutation();
  const submit = useSubmitTalkMutation();

  const ai = validate.data;
  const formReady =
    title.trim() && speakerName.trim() && sectionId && abstract.trim();

  const handleValidate = () => validate.mutate({ title, sectionId, abstract });

  const handleSubmit = () => {
    if (!formReady || !ai) return;
    submit.mutate(
      { title, speakerName, sectionId, abstract, tags: ai.extractedKeywords },
      {
        onSuccess: () => {
          toast.success("Заявка отправлена на рассмотрение жюри");
          navigate(pathKeys.conference.byId("demo"));
        },
      },
    );
  };

  return (
    <div className="py-6 flex flex-col gap-5 max-w-2xl">
      <h1 className="text-2xl font-semibold">Подать заявку на доклад</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Информация о докладе</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="speaker">ФИО докладчика</Label>
            <Input
              id="speaker"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="Иванова Анна Сергеевна"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Название темы</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Применение LLM для анализа научных текстов"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Секция</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите секцию" />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="abstract">Аннотация</Label>
            <Textarea
              id="abstract"
              rows={5}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Цель, метод, ожидаемый результат (30–50 слов)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Материалы</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-10 cursor-pointer hover:bg-accent transition-colors">
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Нажмите, чтобы загрузить PDF / DOCX"}
            </span>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            variant="outline"
            disabled={!formReady}
            onClick={handleValidate}
            className="self-start gap-2"
          >
            {validate.isPending && <Loader2 className="size-4 animate-spin" />}
            Запустить AI-проверку
          </Button>
        </CardContent>
      </Card>

      {ai && (
        <Card>
          <CardHeader>
            <CardTitle>3. Результат AI-проверки</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Progress value={ai.matchScore} className="flex-1" />
              <span className="font-semibold w-12 text-right">
                {ai.matchScore}%
              </span>
            </div>
            <Alert
              variant={ai.sectionMatch.isMatching ? "default" : "destructive"}
            >
              <CheckCircle2 className="size-4" />
              <AlertTitle>Соответствие секции</AlertTitle>
              <AlertDescription>{ai.sectionMatch.explanation}</AlertDescription>
            </Alert>
            <Alert
              variant={ai.abstractMatch.isMatching ? "default" : "destructive"}
            >
              <AlertCircle className="size-4" />
              <AlertTitle>Соответствие аннотации</AlertTitle>
              <AlertDescription>
                {ai.abstractMatch.explanation}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 flex-wrap">
              {ai.extractedKeywords.map((k) => (
                <Badge key={k} variant="secondary">
                  {k}
                </Badge>
              ))}
            </div>
            <ul className="text-sm text-muted-foreground list-disc pl-5 flex flex-col gap-1">
              {ai.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={!formReady || !ai || submit.isPending}
        >
          Отправить на рассмотрение жюри
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const submissionPageRoute = { element: <SubmissionPage /> };
