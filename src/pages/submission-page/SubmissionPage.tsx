import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle, FileText, X } from "lucide-react";

import {
  useSubmitTalkMutation,
  useValidateMutation,
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { sections } from "~shared/mocks/demoServer";

import {
  Card,
  Button,
  Input,
  TextArea,
  Chip,
  Select,
  ListBox,
} from "@heroui/react";

const MAX_FILE_SIZE_MB = 10;
const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

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

type FileError = { type: "type" | "size" } | null;

/* ---------- маленький хелпер: подпись под полем ---------- */
function FieldHint({
  message,
  counter,
}: {
  message?: string;
  counter?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 mt-1 min-h-4">
      <p
        role={message ? "alert" : undefined}
        className={`text-xs ${message ? "text-danger" : "text-transparent"}`}
      >
        {message ?? "·"}
      </p>
      {counter && (
        <p className="text-xs text-muted-foreground tabular-nums shrink-0">
          {counter}
        </p>
      )}
    </div>
  );
}

const inputClassNames = {
  input: "text-[#1a4d3e]",
  inputWrapper:
    "border-[#1a4d3e]/20 bg-white hover:border-[#d4a84b]/50 focus-within:border-[#d4a84b] data-[invalid=true]:border-danger",
};

export function SubmissionPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<FileError>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validate = useValidateMutation();
  const submit = useSubmitTalkMutation();

  const {
    register,
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

  const abstractValue = watch("abstract");
  const sectionId = watch("sectionId");

  const ai = validate.data;
  // Результат AI считается "протухшим", если форма изменилась после проверки
  const [aiSnapshot, setAiSnapshot] = useState<string | null>(null);
  const currentSnapshot = JSON.stringify(getValues());
  const isAiStale = !!ai && aiSnapshot !== currentSnapshot;
  const isFormValid = isValid && !!file && !fileError;

  /* ---------- загрузка файла с валидацией ---------- */
  const acceptFile = useCallback((candidate: File | null | undefined) => {
    if (!candidate) return;
    const ext = "." + candidate.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError({ type: "type" });
      setFile(null);
      return;
    }
    if (candidate.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setFileError({ type: "size" });
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(candidate);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleValidate = () => {
    if (!file) {
      toast.error("Сначала загрузите файл с материалами");
      return;
    }
    const values = getValues();
    setAiSnapshot(JSON.stringify(values));
    validate.mutate({ ...values, file });
  };

  const onSubmit = (values: SubmissionFormValues) => {
    if (!ai) {
      toast.error("Сначала запустите AI-проверку");
      return;
    }
    submit.mutate(
      { ...values, tags: ai.extractedKeywords },
      {
        onSuccess: () => {
          toast.success("Заявка успешно отправлена жюри!");
          navigate(pathKeys.conference.byId("demo"));
        },
        onError: () => toast.error("Не удалось отправить заявку. Попробуйте ещё раз."),
      },
    );
  };

  /* ---------- подсказка под кнопкой сабмита ---------- */
  const submitHint = !isValid
    ? "Заполните все поля формы"
    : !file
      ? "Загрузите файл с материалами"
      : !ai
        ? "Запустите AI-проверку перед отправкой"
        : isAiStale
          ? "Данные изменились — повторите AI-проверку"
          : null;

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      {/* Header */}
      <div className="bg-[#1a4d3e] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#d4a84b] text-sm font-semibold mb-2 uppercase tracking-wide">
            CALL FOR PAPERS · ДО 1 МАЯ
          </p>
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Подать заявку
            <br />
            на доклад
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            Заполните информацию и загрузите материал — мы проверим заявку перед
            отправкой жюри.
          </p>

          {/* Прогресс: 3 шага */}
          <ol className="flex items-center gap-2 mt-8 text-xs font-medium">
            {[
              { n: 1, label: "Информация", done: isValid },
              { n: 2, label: "Материалы", done: !!file },
              { n: 3, label: "AI-проверка", done: !!ai && !isAiStale },
            ].map((s, i) => (
              <li key={s.n} className="flex items-center gap-2">
                <span
                  className={`flex size-6 items-center justify-center rounded-full border transition-colors ${
                    s.done
                      ? "bg-[#d4a84b] border-[#d4a84b] text-[#1a4d3e]"
                      : "border-white/40 text-white/70"
                  }`}
                >
                  {s.done ? <CheckCircle2 className="size-4" /> : s.n}
                </span>
                <span className={s.done ? "text-white" : "text-white/60"}>
                  {s.label}
                </span>
                {i < 2 && <span className="w-6 h-px bg-white/30 mx-1" />}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
          {/* ===== Шаг 1: Информация ===== */}
          <Card className="border border-[#1a4d3e]/20 bg-[#f5f3ed] shadow-sm">
            <fieldset className="p-8 space-y-6">
              <legend className="flex items-start gap-4 float-left w-full mb-6">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4a84b] rounded-md flex items-center justify-center text-[#1a4d3e] font-bold text-sm">
                  1
                </span>
                <span>
                  <span className="block text-xl font-bold text-[#1a4d3e]">
                    Информация о докладе
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    Данные для программы конференции
                  </span>
                </span>
              </legend>

              <div className="space-y-5 pl-12">
                <div>
                  <label
                    htmlFor="speakerName"
                    className="block text-sm font-semibold text-[#1a4d3e] mb-2"
                  >
                    ФИО докладчика
                  </label>
                  <Input
                    id="speakerName"
                    placeholder="Иванова Анна Сергеевна"
                    aria-invalid={!!errors.speakerName}
                    {...register("speakerName")}
                    className="bg-white w-full"
                    classNames={inputClassNames}
                  />
                  <FieldHint message={errors.speakerName?.message} />
                </div>

                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-[#1a4d3e] mb-2"
                  >
                    Название темы
                  </label>
                  <Input
                    id="title"
                    placeholder="Например: Дизайн-токены в масштабе"
                    aria-invalid={!!errors.title}
                    {...register("title")}
                    className="bg-white w-full"
                    classNames={inputClassNames}
                  />
                  <FieldHint message={errors.title?.message} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">
                    Секция
                  </label>
                  <Select
                    aria-label="Секция"
                    placeholder="Выберите секцию"
                    selectedKeys={sectionId ? [sectionId] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string;
                      setValue("sectionId", val, { shouldValidate: true });
                    }}
                    className="bg-white w-full"
                    classNames={{
                      trigger:
                        "border-[#1a4d3e]/20 bg-white hover:border-[#d4a84b]/50 data-[hover=true]:border-[#d4a84b]",
                      value: "text-[#1a4d3e]",
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
                  <FieldHint message={errors.sectionId?.message} />
                </div>

                <div>
                  <label
                    htmlFor="abstract"
                    className="block text-sm font-semibold text-[#1a4d3e] mb-2"
                  >
                    Аннотация
                  </label>
                  <TextArea
                    id="abstract"
                    placeholder="Цель, метод, ожидаемый результат (30–50 слов)"
                    rows={4}
                    aria-invalid={!!errors.abstract}
                    {...register("abstract")}
                    className="bg-white w-full"
                    classNames={inputClassNames}
                  />
                  <FieldHint
                    message={errors.abstract?.message}
                    counter={`${abstractValue.length}/1000`}
                  />
                </div>
              </div>
            </fieldset>
          </Card>

          {/* ===== Шаг 2: Материалы ===== */}
          <Card className="border border-[#1a4d3e]/20 bg-[#f5f3ed] shadow-sm">
            <fieldset className="p-8 space-y-6">
              <legend className="flex items-start gap-4 float-left w-full mb-6">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4a84b] rounded-md flex items-center justify-center text-[#1a4d3e] font-bold text-sm">
                  2
                </span>
                <span>
                  <span className="block text-xl font-bold text-[#1a4d3e]">
                    Материалы
                  </span>
                  <span className="block text-sm text-muted-foreground mt-1">
                    PDF или DOCX с полным текстом доклада
                  </span>
                </span>
              </legend>

              <div className="pl-12 space-y-4">
                {/* Drag & Drop зона — кликабельна через label, доступна с клавиатуры */}
                <label
                  htmlFor="file-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    acceptFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`group relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d4a84b] focus-visible:ring-offset-2
                    ${
                      file
                        ? "border-[#1a4d3e]/40 bg-[#1a4d3e]/5"
                        : isDragging
                          ? "border-[#d4a84b] bg-[#d4a84b]/10 scale-[1.01]"
                          : "border-[#1a4d3e]/20 hover:border-[#d4a84b]/50 hover:bg-[#d4a84b]/5"
                    }`}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx"
                    className="sr-only"
                    onChange={(e) => acceptFile(e.target.files?.[0])}
                  />

                  {file ? (
                    <>
                      <FileText className="size-12 text-[#1a4d3e]" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#1a4d3e]">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} МБ
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="flat"
                        size="sm"
                        aria-label="Удалить файл"
                        className="bg-danger/10 text-danger hover:bg-danger/20"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearFile();
                        }}
                      >
                        <X className="size-4 mr-1" />
                        Удалить файл
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className={`flex size-16 items-center justify-center rounded-full transition-colors ${
                          isDragging
                            ? "bg-[#d4a84b]/30"
                            : "bg-[#1a4d3e]/10 group-hover:bg-[#d4a84b]/20"
                        }`}
                      >
                        <Upload
                          className={`size-7 transition-colors ${
                            isDragging
                              ? "text-[#1a4d3e]"
                              : "text-[#1a4d3e]/60 group-hover:text-[#1a4d3e]"
                          }`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-[#1a4d3e]">
                          {isDragging
                            ? "Отпустите файл здесь"
                            : "Перетащите файл или нажмите для выбора"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF или DOCX до {MAX_FILE_SIZE_MB} МБ
                        </p>
                      </div>
                    </>
                  )}
                </label>

                {fileError && (
                  <p role="alert" className="text-xs text-danger flex items-center gap-1.5">
                    <AlertCircle className="size-4 shrink-0" />
                    {fileError.type === "type"
                      ? "Неподдерживаемый формат. Загрузите PDF или DOCX."
                      : `Файл больше ${MAX_FILE_SIZE_MB} МБ. Сожмите его и попробуйте снова.`}
                  </p>
                )}

                <Button
                  type="button"
                  variant="flat"
                  className="w-full bg-[#1a4d3e] text-white hover:bg-[#1a4d3e]/90 font-semibold"
                  isPending={validate.isPending}
                  isDisabled={!isFormValid || validate.isPending}
                  onClick={handleValidate}
                >
                  {ai && !isAiStale ? "Проверить заново" : "Запустить AI-проверку"}
                </Button>
                {!file && isValid && (
                  <p className="text-xs text-muted-foreground text-center">
                    Для проверки нужен загруженный файл
                  </p>
                )}
              </div>
            </fieldset>
          </Card>

          {/* ===== Результат AI-проверки ===== */}
          {ai && (
            <Card
              className={`border bg-white shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                isAiStale
                  ? "border-warning/40 opacity-80"
                  : "border-[#1a4d3e]/20"
              }`}
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-3">
                  {isAiStale ? (
                    <AlertCircle className="size-6 text-warning" />
                  ) : (
                    <CheckCircle2 className="size-6 text-success" />
                  )}
                  <h2 className="text-xl font-bold text-[#1a4d3e]">
                    Результат AI-проверки
                  </h2>
                  {isAiStale && (
                    <Chip className="bg-warning/10 text-warning-800 border border-warning/30 text-xs">
                      Данные изменились — проверьте заново
                    </Chip>
                  )}
                </div>

                {/* Score */}
                <div className="flex items-center gap-4 p-4 bg-[#f5f3ed] rounded-lg">
                  <div className="flex-1">
                    <div className="h-3 bg-[#1a4d3e]/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          ai.matchScore >= 80
                            ? "bg-success"
                            : ai.matchScore >= 60
                              ? "bg-warning"
                              : "bg-danger"
                        }`}
                        style={{ width: `${ai.matchScore}%` }}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-2xl font-bold tabular-nums ${
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

                {/* Alerts */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {(
                    [
                      {
                        label: "Соответствие секции",
                        data: ai.sectionMatch,
                      },
                      { label: "Качество аннотации", data: ai.abstractMatch },
                    ] as const
                  ).map(({ label, data }) => (
                    <div
                      key={label}
                      className={`p-4 rounded-lg border flex gap-3 ${
                        data.isMatching
                          ? "bg-success/5 border-success/20 text-success-800"
                          : "bg-danger/5 border-danger/20 text-danger-800"
                      }`}
                    >
                      {data.isMatching ? (
                        <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-5 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs mt-1 opacity-80">
                          {data.explanation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Keywords */}
                <div className="space-y-3 p-4 rounded-lg bg-[#f5f3ed] border border-[#1a4d3e]/10">
                  <p className="text-sm font-semibold text-[#1a4d3e]">
                    Извлеченные ключевые слова:
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {ai.extractedKeywords.map((k) => (
                      <Chip
                        key={k}
                        className="bg-white border border-[#1a4d3e]/20 text-[#1a4d3e] text-xs"
                      >
                        {k}
                      </Chip>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#1a4d3e]">
                    Рекомендации:
                  </p>
                  <ul className="space-y-2">
                    {ai.feedback.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-muted-foreground bg-[#f5f3ed] p-3 rounded-md"
                      >
                        <span className="mt-1.5 size-1.5 rounded-full bg-[#d4a84b] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* ===== Submit ===== */}
          <div className="flex flex-col items-end gap-2 pt-4">
            <Button
              type="submit"
              size="lg"
              isDisabled={!isFormValid || !ai || isAiStale || submit.isPending}
              isPending={submit.isPending}
              className="bg-[#1a4d3e] text-white hover:bg-[#1a4d3e]/90 px-12 font-semibold text-base"
            >
              {submit.isPending ? "Отправка…" : "Отправить на рассмотрение жюри"}
            </Button>
            {submitHint && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="size-3.5" />
                {submitHint}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };