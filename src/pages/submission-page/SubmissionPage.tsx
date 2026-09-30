import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
} from "lucide-react";

import {
  useSubmitTalkMutation,
  useValidateMutation,
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { sections } from "~shared/mocks/demoServer";

// Импорты из HeroUI v3
import {
  Card,
  Button,
  TextField,
  Input,
  TextArea,
  ProgressBar,
  Chip,
  Select,
  ListBox,
  Label,
  FieldError,
} from "@heroui/react";

const submissionSchema = z.object({
  speakerName: z.string().min(3, "Минимум 3 символа"),
  title: z.string().min(5, "Минимум 5 символов"),
  sectionId: z.string().min(1, "Выберите секцию"),
  abstract: z
    .string()
    .min(30, "Минимум 30 символов")
    .max(1000, "Максимум 1000 символов"),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

function AlertBox({
  variant,
  title,
  description,
  icon,
}: {
  variant: "default" | "destructive";
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  const isDestructive = variant === "destructive";
  return (
    <div
      className={`p-4 rounded-lg border flex gap-3 ${
        isDestructive
          ? "bg-danger-50 border-danger-200 text-danger-800"
          : "bg-default-50 border-default-200 text-default-800"
      }`}
    >
      <div
        className={`mt-0.5 ${isDestructive ? "text-danger" : "text-primary"}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs mt-1 opacity-80">{description}</p>
      </div>
    </div>
  );
}

export function SubmissionPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const validate = useValidateMutation();
  const submit = useSubmitTalkMutation();

  // 1. Добавляем register, watch и setValue в деструктуризацию useForm
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
    watch,
    setValue,
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { speakerName: "", title: "", sectionId: "", abstract: "" },
    mode: "onChange",
  });

  const ai = validate.data;
  const isFormValid = isValid && !!file;

  const handleValidate = () => {
    const values = getValues();
    validate.mutate({ ...values, file });
  };

  const onSubmit = (values: SubmissionFormValues) => {
    if (!ai) return;
    submit.mutate(
      { ...values, tags: ai.extractedKeywords },
      {
        onSuccess: () => {
          toast.success("Заявка успешно отправлена жюри!");
          navigate(pathKeys.conference.byId("demo"));
        },
      },
    );
  };

  return (
    <div className="py-10 max-w-2xl mx-auto space-y-8 bg-gradient-to-b from-background to-default-100/50 min-h-screen p-4">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Подать заявку на доклад
        </h1>
        <p className="text-default-500 text-lg">
          Заполните информацию и загрузите материал для AI-проверки.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Карточка 1: Информация */}
        <Card className="border border-default-200 bg-background/80 backdrop-blur-sm shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </span>
                Информация о докладе
              </h2>
              <p className="text-sm text-default-500">
                Основные метаданные для программы конференции
              </p>
            </div>

            <TextField isInvalid={!!errors.speakerName}>
              <Label>ФИО докладчика</Label>
              <Input
                placeholder="Иванова Анна Сергеевна"
                {...register("speakerName")}
              />
              {errors.speakerName?.message && (
                <FieldError>{errors.speakerName.message}</FieldError>
              )}
            </TextField>

            <TextField isInvalid={!!errors.title}>
              <Label>Название темы</Label>
              <Input
                placeholder="Например: Применение LLM для анализа научных текстов"
                {...register("title")} 
              />
              {errors.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </TextField>

            <TextField isInvalid={!!errors.sectionId}>
              <Label>Секция</Label>
              <Select
                placeholder="Выберите секцию"
                // 3. Используем watch напрямую
                selectedKeys={watch("sectionId") ? [watch("sectionId")] : []}
                onSelectionChange={(keys) => {
                  const val = Array.from(keys)[0] as string;
                  // 4. Используем setValue напрямую
                  setValue("sectionId", val, { shouldValidate: true });
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {sections.map((s) => (
                      <ListBox.Item key={s.id} id={s.id} textValue={s.title}>
                        {s.title}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              {errors.sectionId?.message && (
                <FieldError>{errors.sectionId.message}</FieldError>
              )}
            </TextField>

            <TextField isInvalid={!!errors.abstract}>
              <Label>Аннотация</Label>
              <TextArea
                placeholder="Цель, метод, ожидаемый результат (30–50 слов)"
                rows={4}
                {...register("abstract")}
              />
              {errors.abstract?.message && (
                <FieldError>{errors.abstract.message}</FieldError>
              )}
            </TextField>
          </div>
        </Card>

        {/* Карточка 2: Материалы */}
        <Card className="border border-default-200 bg-background/80 backdrop-blur-sm shadow-lg shadow-primary/5 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </span>
                Материалы
              </h2>
              <p className="text-sm text-default-500">
                Загрузите PDF или DOCX файл с полным текстом доклада
              </p>
            </div>

            <div
              className={`group relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer
                ${file ? "border-primary/40 bg-primary/5" : "border-default-300 hover:border-primary/50 hover:bg-primary/5"}`}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <FileText className="size-10 text-primary transition-transform group-hover:scale-110 duration-300" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="danger-soft"
                    size="sm"
                    className="h-7 text-xs mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Удалить файл
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-default-100 group-hover:bg-primary/10 transition-colors duration-300">
                    <Upload className="size-6 text-default-500 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      Нажмите для загрузки или перетащите файл
                    </p>
                    <p className="text-xs text-default-500 mt-1">
                      Поддерживаются форматы PDF, DOCX (до 10 МБ)
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary-600 shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
              isPending={validate.isPending}
              isDisabled={!isValid || validate.isPending}
              onClick={handleValidate}
            >
              {!validate.isPending && <Sparkles className="size-4" />}
              Запустить AI-проверку
            </Button>
          </div>
        </Card>

        {/* Карточка 3: Результат AI */}
        {ai && (
          <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg shadow-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 space-y-5">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
                <CheckCircle2 className="size-5" />
                Результат AI-проверки
              </h2>

              <div className="flex items-center gap-4">
                <ProgressBar
                  value={ai.matchScore}
                  color={
                    ai.matchScore >= 80
                      ? "success"
                      : ai.matchScore >= 60
                        ? "warning"
                        : "danger"
                  }
                  className="flex-1"
                  size="sm"
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <span
                  className={`text-xl font-bold w-16 text-right ${
                    ai.matchScore >= 80
                      ? "text-success"
                      : ai.matchScore >= 60
                        ? "text-warning"
                        : "text-danger"
                  }`}
                >
                  {ai.matchScore}%
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AlertBox
                  variant={
                    ai.sectionMatch.isMatching ? "default" : "destructive"
                  }
                  title="Соответствие секции"
                  description={ai.sectionMatch.explanation}
                  icon={<CheckCircle2 className="size-4" />}
                />
                <AlertBox
                  variant={
                    ai.abstractMatch.isMatching ? "default" : "destructive"
                  }
                  title="Качество аннотации"
                  description={ai.abstractMatch.explanation}
                  icon={<AlertCircle className="size-4" />}
                />
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-default-50 border border-default-200">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="size-4 text-primary" />
                  Извлеченные ключевые слова:
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ai.extractedKeywords.map((k) => (
                    <Chip
                      key={k}
                      className="bg-background border border-default-200 font-normal shadow-sm"
                    >
                      {k}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Рекомендации:</p>
                <ul className="text-sm text-default-600 space-y-2">
                  {ai.feedback.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-background/50 p-3 rounded-md border border-default-200"
                    >
                      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-end pt-4 pb-10">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isDisabled={!isFormValid || !ai || submit.isPending}
            isPending={submit.isPending}
            className="w-full sm:w-auto px-10 bg-gradient-to-r from-primary to-primary-600 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] text-base font-semibold"
          >
            Отправить на рассмотрение жюри
          </Button>
        </div>
      </form>
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };