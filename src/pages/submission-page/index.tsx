import { useState } from "react";
import { Upload, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

import { mockSections } from "~shared/mocks/schedule";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~app/components/ui/card";
import { Label } from "~app/components/ui/label";
import { Input } from "~app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~app/components/ui/select";
import { Textarea } from "~app/components/ui/textarea";
import { Progress } from "~app/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "~app/components/ui/alert";
import { Button } from "~app/components/ui/button";

export function SubmissionPage() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="py-6 flex flex-col gap-5 max-w-2xl">
      <h1 className="text-2xl font-semibold">Подать заявку на доклад</h1>

      <Card>
        <CardHeader>
          <CardTitle>1. Информация о докладе</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Название темы</Label>
            <Input
              id="title"
              placeholder="Например: Применение LLM для анализа научных текстов"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Секция</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Выберите секцию" />
              </SelectTrigger>
              <SelectContent>
                {mockSections.map((s) => (
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
              placeholder="Краткое описание доклада (3–5 предложений)"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Материалы</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Нативный input — для MVP хватает, react-dropzone не нужен */}
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
        </CardContent>
      </Card>

      {/* Заглушка AI Validation — заполним, когда будет backend */}
      <Card>
        <CardHeader>
          <CardTitle>3. AI-проверка</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Progress value={87} className="flex-1" />
            <span className="font-semibold">87%</span>
          </div>
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Соответствие секции</AlertTitle>
            <AlertDescription>
              Тема доклада соответствует секции «IT и ИИ».
            </AlertDescription>
          </Alert>
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>Соответствие аннотации</AlertTitle>
            <AlertDescription>
              Аннотация короткая — рекомендуем 150–250 слов.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button>Отправить на рассмотрение жюри</Button>
        <Button variant="outline" className="gap-2">
          <ExternalLink className="size-4" />
          Запросить печать бейджа
        </Button>
      </div>
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };
