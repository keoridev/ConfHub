import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Upload,
  CheckCircle2,
  FileText,
  LogIn,
  GraduationCap,
  Sparkles,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  FileCheck,
  BookOpen,
  UserCheck,
  Laptop,
  Cpu,
  Leaf,
  Wand2,
  Send,
  Presentation,
  School,
  Mail,
  Users,
  Tag,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCreateTalkMutation,
  useUploadDocumentMutation,
  useValidateTalkMutation,
  useSectionsQuery,
  useTalkQuery,
  useCurrentUserQuery,
  useLoginMutation,
  queryKeys,
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";
import { Card, Button, Chip } from "@heroui/react";

const submissionSchema = z.object({
  title: z
    .string()
    .min(5, "Минимум 5 символов")
    .max(200, "Максимум 200 символов"),
  sectionId: z.string().min(1, "Выберите секцию"),
  university: z.string().optional().or(z.literal("")),
  gradeOrGroup: z.string().optional().or(z.literal("")),
  authorEmail: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Некорректный адрес электронной почты",
    }),
  coAuthors: z.string().optional().or(z.literal("")),
  keywords: z.string().optional().or(z.literal("")),
  supervisor: z.string().optional().or(z.literal("")),
  abstract: z
    .string()
    .min(50, "Минимум 50 символов (требование оргкомитета)")
    .max(3000, "Максимум 3000 символов"),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export function SubmissionPage() {
  const queryClient = useQueryClient();

  const { data: user } = useCurrentUserQuery();
  const loginMutation = useLoginMutation();

  const [authLogin, setAuthLogin] = useState("student1");
  const [authPassword, setAuthPassword] = useState("student123");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [createdTalkId, setCreatedTalkId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: sections = [] } = useSectionsQuery();
  const { data: talk } = useTalkQuery(createdTalkId!);

  const createTalk = useCreateTalkMutation();
  const uploadDoc = useUploadDocumentMutation();
  const validateTalk = useValidateTalkMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onChange",
    defaultValues: {
      university: "КазНУ им. аль-Фараби",
      gradeOrGroup: user?.groupName || "",
      authorEmail: "",
      coAuthors: "",
      keywords: "",
      supervisor: "",
      title: "",
      sectionId: "",
      abstract: "",
    },
  });

  const sectionId = watch("sectionId");
  const titleValue = watch("title") || "";
  const universityValue = watch("university") || "";
  const gradeOrGroupValue = watch("gradeOrGroup") || "";
  const authorEmailValue = watch("authorEmail") || "";
  const coAuthorsValue = watch("coAuthors") || "";
  const keywordsValue = watch("keywords") || "";
  const supervisorValue = watch("supervisor") || "";
  const abstractValue = watch("abstract") || "";

  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const data = await loginMutation.mutateAsync({
        login: authLogin,
        password: authPassword,
      });
      if (data.user?.groupName) {
        setValue("gradeOrGroup", data.user.groupName);
      }
      toast.success(`Вы вошли как ${data.user.fullName || data.user.login}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || "Неверный логин или пароль";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  const handleQuickLogin = async (quickLogin: string, quickPass: string) => {
    setAuthLogin(quickLogin);
    setAuthPassword(quickPass);
    setAuthError(null);
    try {
      const data = await loginMutation.mutateAsync({
        login: quickLogin,
        password: quickPass,
      });
      if (data.user?.groupName) {
        setValue("gradeOrGroup", data.user.groupName);
      }
      toast.success(`Вы вошли как ${data.user.fullName || data.user.login}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || "Неверный логин или пароль";
      setAuthError(msg);
      toast.error(msg);
    }
  };

  const onCreateTalk = async (values: SubmissionFormValues) => {
    try {
      const parsedCoAuthors = values.coAuthors
        ? values.coAuthors
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const parsedKeywords = values.keywords
        ? values.keywords
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const data = await createTalk.mutateAsync({
        sectionId: Number(values.sectionId),
        title: values.title,
        university: values.university?.trim() || "",
        gradeOrGroup: values.gradeOrGroup?.trim() || "",
        authorEmail: values.authorEmail?.trim() || "",
        coAuthors: parsedCoAuthors,
        keywords: parsedKeywords,
        supervisor: values.supervisor?.trim() || "",
        abstract: values.abstract,
        tags: parsedKeywords,
      });
      setCreatedTalkId(data.id);
      setIsSubmitted(false);
      toast.success("Заявка зарегистрирована! Вы можете прикрепить презентацию/отчёт или сразу отправить её жюри.");
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || "Ошибка создания заявки";
      toast.error(msg);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !createdTalkId) return;
    try {
      await uploadDoc.mutateAsync({ talkId: createdTalkId, file });
      queryClient.invalidateQueries({
        queryKey: queryKeys.talks.detail(createdTalkId),
      });
      toast.success("Материалы доклада успешно загружены!");
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        "Ошибка загрузки файла. Поддерживаются PDF, DOCX и PPTX до 10 МБ.";
      toast.error(msg);
    }
  };

  const handleValidate = async () => {
    if (!createdTalkId) return;
    try {
      await validateTalk.mutateAsync(createdTalkId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.talks.detail(createdTalkId),
      });
      toast.success("AI-проверка завершена");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error("Превышен лимит AI-проверок (макс. 3)");
      } else {
        toast.error("Ошибка AI-проверки");
      }
    }
  };

  const handleFinishSubmission = () => {
    setIsSubmitted(true);
    toast.success("Заявка успешно передана в очередь жюри на рассмотрение!");
  };

  const handleResetForm = () => {
    setCreatedTalkId(null);
    setFile(null);
    setIsSubmitted(false);
    reset({
      title: "",
      sectionId: "",
      university: "КазНУ им. аль-Фараби",
      gradeOrGroup: user?.groupName || "",
      authorEmail: "",
      coAuthors: "",
      keywords: "",
      supervisor: "",
      abstract: "",
    });
  };

  const aiResult = talk?.aiResult?.result;
  const currentSection = sections.find((s) => s.id === talk?.sectionId);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="space-y-3 pb-6 border-b border-[#1a4d3e]/10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1a4d3e]/10 text-[#1a4d3e] uppercase tracking-wider">
          <Sparkles className="size-3.5 text-[#d4a84b]" />
          Conf-Hub 2026 • Приём заявок
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a4d3e] tracking-tight">
          Подача заявки на доклад
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Заполните сведения о докладе, выберите секцию и прикрепите материалы (Word / PDF) для автоматического AI-анализа и рассмотрения жюри.
        </p>

        {user && (
          <div className="flex items-center gap-3 pt-3 flex-wrap">
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
                !createdTalkId
                  ? "bg-[#1a4d3e] text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">1</span>
              <span>Тема и секция</span>
            </div>
            <div className="w-4 h-px bg-[#1a4d3e]/20" />
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
                createdTalkId && !isSubmitted
                  ? "bg-[#1a4d3e] text-white shadow-xs"
                  : isSubmitted
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-white text-muted-foreground border border-[#1a4d3e]/15"
              }`}
            >
              <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
              <span>Материалы & AI</span>
            </div>
            <div className="w-4 h-px bg-[#1a4d3e]/20" />
            <div
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl ${
                isSubmitted
                  ? "bg-[#1a4d3e] text-white shadow-xs"
                  : "bg-white text-muted-foreground border border-[#1a4d3e]/15"
              }`}
            >
              <span className="size-5 rounded-full bg-black/10 flex items-center justify-center text-[10px]">3</span>
              <span>Готово</span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {!user ? (
          <div className="max-w-xl mx-auto">
            <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 shadow-md shadow-[#1a4d3e]/5 rounded-3xl">
              <div className="text-center space-y-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#1a4d3e] text-[#d4a84b] flex items-center justify-center mx-auto shadow-xs">
                  <LogIn className="size-6" />
                </div>
                <h2 className="text-2xl font-bold text-[#1a4d3e]">
                  Вход для подачи заявки
                </h2>
                <p className="text-sm text-[#1a4d3e]/70 leading-relaxed">
                  Подача тезисов и прикрепление файлов доклада доступны авторизованным участникам конференции.
                </p>
              </div>

              <div className="mb-6 p-4 rounded-2xl bg-[#f5f3ed] border border-[#1a4d3e]/15 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/70">
                  Быстрый вход для проверки:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student1", "student123")}
                    disabled={loginMutation.isPending}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e] hover:text-white transition-all group text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#1a4d3e] group-hover:text-white">
                      student1 (Студент)
                    </span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-white/80">
                      Алексей Смирнов
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("student2", "student123")}
                    disabled={loginMutation.isPending}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-[#1a4d3e]/20 bg-white hover:bg-[#1a4d3e] hover:text-white transition-all group text-left cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#1a4d3e] group-hover:text-white">
                      student2 (Студент)
                    </span>
                    <span className="text-[10px] text-muted-foreground group-hover:text-white/80">
                      Мария Иванова
                    </span>
                  </button>
                </div>
              </div>

              {authError && (
                <div className="mb-5 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex items-center gap-2.5">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleInlineLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                      Логин
                    </label>
                    {authLogin && (
                      <button
                        type="button"
                        onClick={() => setAuthLogin("")}
                        className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                      <UserIcon className="size-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={authLogin}
                      onChange={(e) => setAuthLogin(e.target.value)}
                      placeholder="student1"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/35 text-sm text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                    />
                    {authLogin && (
                      <button
                        type="button"
                        onClick={() => setAuthLogin("")}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                        title="Очистить"
                      >
                        <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                      Пароль
                    </label>
                    {authPassword && (
                      <button
                        type="button"
                        onClick={() => setAuthPassword("")}
                        className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                      >
                        Очистить
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                      <Lock className="size-4" />
                    </div>
                    <input
                      type={showAuthPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/35 text-sm text-[#1a4d3e] focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAuthPassword(!showAuthPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/50 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                      title={showAuthPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showAuthPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer mt-2"
                  isPending={loginMutation.isPending}
                >
                  <LogIn className="size-4 text-[#d4a84b] mr-1.5" />
                  Войти и продолжить подачу
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to={pathKeys.login}
                  className="text-xs font-semibold text-[#1a4d3e]/70 hover:text-[#1a4d3e] underline"
                >
                  Открыть полную страницу входа
                </Link>
              </div>
            </Card>
          </div>
        ) : !createdTalkId ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#1a4d3e]/20 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="size-11 rounded-xl bg-[#1a4d3e] text-[#f5f3ed] flex items-center justify-center font-bold text-base shadow-xs">
                  {user.fullName ? user.fullName[0].toUpperCase() : <GraduationCap className="size-5 text-[#d4a84b]" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-extrabold text-[#1a4d3e]">
                      {user.fullName || user.login}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#d4a84b]/20 text-[#1a4d3e] border border-[#d4a84b]/40">
                      {user.groupName ? `Группа ${user.groupName}` : "Студент"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Докладчик закреплён за аккаунтом <span className="font-mono text-[#1a4d3e]">@{user.login}</span>. Фамилию вводить не требуется.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Авторизован
              </div>
            </div>

            <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 rounded-3xl shadow-sm">
              <form onSubmit={handleSubmit(onCreateTalk)} className="space-y-7">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-[#1a4d3e]">
                      Название темы доклада <span className="text-danger">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      {titleValue && (
                        <button
                          type="button"
                          onClick={() => setValue("title", "", { shouldValidate: true })}
                          className="text-xs text-[#1a4d3e]/60 hover:text-danger font-medium transition-colors cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                      <span className="text-xs font-mono text-muted-foreground">
                        {titleValue.length}/200
                      </span>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                      <BookOpen className="size-4" />
                    </div>
                    <input
                      {...register("title")}
                      placeholder="Например: Разработка нейросетевой модели для классификации текстов..."
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                    />
                    {titleValue && (
                      <button
                        type="button"
                        onClick={() => setValue("title", "", { shouldValidate: true })}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                        title="Очистить"
                      >
                        <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-[#1a4d3e]/60">Быстрый пример:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "title",
                          "Применение больших языковых моделей для автоматического анализа научных текстов",
                          { shouldValidate: true }
                        )
                      }
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 text-[#1a4d3e] transition-colors font-medium cursor-pointer"
                    >
                      + Пример IT темы
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "title",
                          "Интеллектуальная система контроля микроклиматических параметров и качества воздуха",
                          { shouldValidate: true }
                        )
                      }
                      className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#1a4d3e]/5 hover:bg-[#1a4d3e]/15 text-[#1a4d3e] transition-colors font-medium cursor-pointer"
                    >
                      + Пример эко-темы
                    </button>
                  </div>

                  {errors.title && (
                    <p className="text-xs text-danger mt-1.5 font-medium">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="block text-sm font-bold text-[#1a4d3e]">
                      Секция конференции <span className="text-danger">*</span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      Нажмите на секцию для выбора
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sections.map((s) => {
                      const isSelected = sectionId === String(s.id);
                      const isIT = s.id === 1 || s.title.toLowerCase().includes("it");
                      const isEng = s.id === 2 || s.title.toLowerCase().includes("инжен");
                      const Icon = isIT ? Laptop : isEng ? Cpu : Leaf;

                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setValue("sectionId", String(s.id), { shouldValidate: true })}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${isSelected
                            ? "border-[#1a4d3e] bg-[#1a4d3e]/5 ring-2 ring-[#1a4d3e]/20 shadow-xs"
                            : "border-[#1a4d3e]/15 bg-[#f5f3ed]/40 hover:border-[#1a4d3e]/30 hover:bg-white"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div
                              className="size-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                              style={{ backgroundColor: s.color || "#1a4d3e" }}
                            >
                              <Icon className="size-4" />
                            </div>
                            {isSelected ? (
                              <span className="size-5 rounded-full bg-[#1a4d3e] text-white flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="size-5 rounded-full border border-[#1a4d3e]/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1a4d3e]">{s.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">

                              {isIT
                                ? "ИИ, разработка, алгоритмы"
                                : isEng
                                  ? "Робототехника, приборы"
                                  : "Экология и мониторинг"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {errors.sectionId && (
                    <p className="text-xs text-danger mt-1.5 font-medium">{errors.sectionId.message}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1a4d3e]/10 space-y-5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#d4a84b]" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#1a4d3e]">
                      Сведения об авторах и организации
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                          Учебное заведение / Организация
                        </label>
                        {universityValue && (
                          <button
                            type="button"
                            onClick={() => setValue("university", "")}
                            className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                          <School className="size-4" />
                        </div>
                        <input
                          {...register("university")}
                          placeholder="Например: КазНУ им. аль-Фараби"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                        />
                        {universityValue && (
                          <button
                            type="button"
                            onClick={() => setValue("university", "")}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                            title="Очистить"
                          >
                            <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                          Группа или курс
                        </label>
                        {gradeOrGroupValue && (
                          <button
                            type="button"
                            onClick={() => setValue("gradeOrGroup", "")}
                            className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                          <GraduationCap className="size-4" />
                        </div>
                        <input
                          {...register("gradeOrGroup")}
                          placeholder="Например: ИС-22-1 или 3 курс магистратуры"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                        />
                        {gradeOrGroupValue && (
                          <button
                            type="button"
                            onClick={() => setValue("gradeOrGroup", "")}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                            title="Очистить"
                          >
                            <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                          Почта авторов (Email для связи)
                        </label>
                        {authorEmailValue && (
                          <button
                            type="button"
                            onClick={() => setValue("authorEmail", "", { shouldValidate: true })}
                            className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                          <Mail className="size-4" />
                        </div>
                        <input
                          type="email"
                          {...register("authorEmail")}
                          placeholder="Например: student@example.com"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                        />
                        {authorEmailValue && (
                          <button
                            type="button"
                            onClick={() => setValue("authorEmail", "", { shouldValidate: true })}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                            title="Очистить"
                          >
                            <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                          </button>
                        )}
                      </div>
                      {errors.authorEmail && (
                        <p className="text-xs text-danger mt-1.5 font-medium">{errors.authorEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                          Научный руководитель
                        </label>
                        {supervisorValue && (
                          <button
                            type="button"
                            onClick={() => setValue("supervisor", "")}
                            className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                          >
                            Очистить
                          </button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                          <UserCheck className="size-4" />
                        </div>
                        <input
                          {...register("supervisor")}
                          placeholder="Например: проф. Касымов А.Т."
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                        />
                        {supervisorValue && (
                          <button
                            type="button"
                            onClick={() => setValue("supervisor", "")}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                            title="Очистить"
                          >
                            <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                        Соавторы (через запятую)
                      </label>
                      {coAuthorsValue && (
                        <button
                          type="button"
                          onClick={() => setValue("coAuthors", "")}
                          className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                        <Users className="size-4" />
                      </div>
                      <input
                        {...register("coAuthors")}
                        placeholder="Например: Смирнов А.П., Касымова Д.Е."
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                      />
                      {coAuthorsValue && (
                        <button
                          type="button"
                          onClick={() => setValue("coAuthors", "")}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                          title="Очистить"
                        >
                          <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Если работа выполнена в соавторстве, перечислите других авторов через запятую.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#1a4d3e]">
                        Ключевые слова (через запятую)
                      </label>
                      {keywordsValue && (
                        <button
                          type="button"
                          onClick={() => setValue("keywords", "")}
                          className="text-[11px] text-[#1a4d3e]/50 hover:text-danger font-medium transition-colors cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#1a4d3e]/40 group-focus-within:text-[#1a4d3e] transition-colors">
                        <Tag className="size-4" />
                      </div>
                      <input
                        {...register("keywords")}
                        placeholder="Например: искусственный интеллект, машинное обучение, NLP, классификация"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium"
                      />
                      {keywordsValue && (
                        <button
                          type="button"
                          onClick={() => setValue("keywords", "")}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#1a4d3e]/40 hover:text-[#1a4d3e] transition-colors cursor-pointer"
                          title="Очистить"
                        >
                          <span className="size-4 rounded-full bg-[#1a4d3e]/10 flex items-center justify-center text-xs">×</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Ключевые слова используются для каталогизации и AI-оценки релевантности секции.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <label className="block text-sm font-bold text-[#1a4d3e]">
                      Аннотация доклада <span className="text-danger">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setValue(
                            "abstract",
                            "В данной исследовательской работе рассматривается внедрение современных методов машинного обучения для автоматизации обработки научных текстов. Эксперименты показали повышение точности классификации на 18% по сравнению с базовыми методами на реальных тестовых наборах данных.",
                            { shouldValidate: true }
                          )
                        }
                        className="text-xs text-[#1a4d3e] font-semibold hover:text-[#d4a84b] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Wand2 className="size-3.5" />
                        Вставить готовый пример
                      </button>
                      {abstractValue && (
                        <button
                          type="button"
                          onClick={() => setValue("abstract", "", { shouldValidate: true })}
                          className="text-xs text-[#1a4d3e]/60 hover:text-danger font-medium transition-colors cursor-pointer"
                        >
                          Очистить
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="relative group">
                    <textarea
                      {...register("abstract")}
                      rows={5}
                      placeholder="Опишите цель исследования, основные методы и полученные результаты (минимум 50 символов)..."
                      className="w-full p-4 rounded-2xl bg-[#f5f3ed]/60 border-2 border-[#1a4d3e]/15 hover:border-[#1a4d3e]/30 text-sm text-[#1a4d3e] placeholder:text-[#1a4d3e]/40 focus:outline-none focus:border-[#1a4d3e] focus:ring-4 focus:ring-[#1a4d3e]/10 focus:bg-white transition-all font-medium leading-relaxed resize-y min-h-[130px]"
                    />
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold flex items-center gap-1.5 ${abstractValue.length >= 50
                          ? "text-emerald-700"
                          : "text-amber-700"
                          }`}
                      >
                        {abstractValue.length >= 50 ? (
                          <>
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            Требование оргкомитета выполнено ({abstractValue.length} симв.)
                          </>
                        ) : (
                          <>
                            <AlertCircle className="size-3.5 text-amber-600" />
                            Осталось ещё {50 - abstractValue.length} симв. до минимума
                          </>
                        )}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {abstractValue.length}/3000
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-[#1a4d3e]/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${abstractValue.length >= 50 ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                        style={{
                          width: `${Math.min(100, (abstractValue.length / 50) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {errors.abstract && (
                    <p className="text-xs text-danger mt-1.5 font-medium">
                      {errors.abstract.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-4 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-2xl shadow-sm transition-all cursor-pointer text-base"
                  isPending={createTalk.isPending}
                >
                  <FileCheck className="size-5 text-[#d4a84b] mr-2" />
                  Создать заявку и перейти к загрузке материалов
                </Button>
              </form>
            </Card>
          </div>
        ) : isSubmitted ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border border-emerald-600/30 bg-white p-7 sm:p-9 rounded-3xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1a4d3e]/10">
                <div className="flex items-center gap-3.5">
                  <div className="size-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Заявка №{createdTalkId} принята
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a4d3e] tracking-tight mt-1">
                      Заявка успешно отправлена!
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Материалы зарегистрированы и переданы экспертному жюри секции на рассмотрение.
                    </p>
                  </div>
                </div>
                <Chip color="success" variant="primary" className="font-bold self-start sm:self-auto">
                  В очереди жюри
                </Chip>
              </div>

              <div className="bg-[#f5f3ed]/70 rounded-2xl p-5 sm:p-6 border border-[#1a4d3e]/15 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1a4d3e]/10">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: currentSection?.color || "#1a4d3e" }}
                    >
                      {currentSection?.title || "Секция"}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">ID: #{createdTalkId}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#1a4d3e] bg-white px-3 py-1 rounded-full border border-[#1a4d3e]/15">
                    Статус: Ожидает рецензии
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#1a4d3e] leading-snug">
                    {talk?.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-[#1a4d3e]">
                      Докладчик: {talk?.speakerName || user?.fullName} {talk?.gradeOrGroup ? `(${talk.gradeOrGroup})` : ""}
                    </span>
                    {talk?.university && (
                      <span className="flex items-center gap-1">
                        <School className="size-3.5 text-muted-foreground" />
                        {talk.university}
                      </span>
                    )}
                    {talk?.authorEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3.5 text-muted-foreground" />
                        {talk.authorEmail}
                      </span>
                    )}
                    {talk?.supervisor && (
                      <span>
                        Руководитель: <strong className="text-[#1a4d3e]">{talk.supervisor}</strong>
                      </span>
                    )}
                  </div>

                  {talk?.coAuthors && talk.coAuthors.length > 0 && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-[#1a4d3e] flex items-center gap-1">
                        <Users className="size-3.5 text-muted-foreground" />
                        Соавторы:
                      </span>
                      <span>{talk.coAuthors.join(", ")}</span>
                    </div>
                  )}

                  {talk?.keywords && talk.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[11px] font-semibold text-[#1a4d3e]/70 flex items-center gap-1 mr-1">
                        <Tag className="size-3" /> Ключевые слова:
                      </span>
                      {talk.keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1a4d3e]/5 text-[#1a4d3e] border border-[#1a4d3e]/10"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-white rounded-xl p-3.5 border border-[#1a4d3e]/10 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3.5 text-[#1a4d3e]" />
                      Прикреплённые файлы:
                    </span>
                    {talk?.document ? (
                      <p className="text-xs font-bold text-[#1a4d3e] truncate">
                        {talk.document.originalName} ({(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Файл не прикреплён (поданы только тезисы)
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-[#1a4d3e]/10 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#d4a84b]" />
                      ИИ-экспресс-анализ:
                    </span>
                    {aiResult ? (
                      <p className="text-xs font-bold text-emerald-700">
                        Выполнен (соответствие: {aiResult.sectionFit.score}/100)
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Не проводился (прямая отправка жюри)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {aiResult && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#1a4d3e]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-4 text-[#d4a84b]" />
                      Предварительный отчёт Gemini AI:
                    </span>
                    <span className="text-muted-foreground font-normal">Попытка {talk?.aiResult?.attemptNo || 1}/3</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100">
                      <span className="font-semibold text-muted-foreground block mb-1">Соответствие секции:</span>
                      <p className="text-[#1a4d3e]">{aiResult.sectionFit.comment}</p>
                      <span className="text-base font-black text-emerald-700 block mt-1.5">{aiResult.sectionFit.score}/100</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100">
                      <span className="font-semibold text-muted-foreground block mb-1">Качество аннотации:</span>
                      <p className="text-[#1a4d3e]">{aiResult.annotationMatch.comment}</p>
                      <span className="text-base font-black text-emerald-700 block mt-1.5">{aiResult.annotationMatch.score}/100</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1a4d3e]/10">
                <Button
                  className="w-full sm:w-auto px-6 py-3 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl cursor-pointer"
                  onClick={handleResetForm}
                >
                  <FileCheck className="size-4 mr-2" />
                  Подать ещё одну заявку
                </Button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    to={pathKeys.conference.build("demo")}
                    className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl border border-[#1a4d3e]/20 hover:bg-[#1a4d3e]/10 text-xs font-bold text-[#1a4d3e] transition-colors"
                  >
                    К программе конференции
                  </Link>
                  {(user?.role === "jury" || user?.role === "admin") && (
                    <Link
                      to={pathKeys.jury}
                      className="flex-1 sm:flex-none text-center px-5 py-2.5 rounded-xl bg-[#d4a84b] hover:bg-[#c4983b] text-xs font-bold text-[#1a4d3e] transition-colors"
                    >
                      Кабинет жюри
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border border-[#1a4d3e]/20 bg-white p-7 sm:p-9 rounded-3xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1a4d3e]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#1a4d3e] text-white">
                      Шаг 2 из 2
                    </span>
                    <h2 className="text-2xl font-bold text-[#1a4d3e]">
                      Материалы доклада и завершение
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Заявка <strong>№{createdTalkId}</strong> зарегистрирована. Вы можете прикрепить файл презентации или отчёта и по желанию запустить AI-проверку.
                  </p>
                </div>
                <Chip color="success" variant="soft">
                  Заявка зарегистрирована
                </Chip>
              </div>

              {talk && (
                <div className="bg-[#f5f3ed]/60 rounded-2xl p-4 sm:p-5 border border-[#1a4d3e]/15 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-[#1a4d3e]/10">
                    <span className="font-bold text-[#1a4d3e] text-sm">
                      {talk.title}
                    </span>
                    <span className="font-mono text-xs">#{talk.id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-semibold text-[#1a4d3e]">
                      {talk.speakerName || user?.fullName}
                      {talk.gradeOrGroup ? ` • ${talk.gradeOrGroup}` : ""}
                    </span>
                    {talk.university && (
                      <span className="flex items-center gap-1">
                        <School className="size-3.5 text-muted-foreground" />
                        {talk.university}
                      </span>
                    )}
                    {talk.authorEmail && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3.5 text-muted-foreground" />
                        {talk.authorEmail}
                      </span>
                    )}
                    {talk.supervisor && (
                      <span>
                        Руководитель: <strong className="text-[#1a4d3e]">{talk.supervisor}</strong>
                      </span>
                    )}
                  </div>
                  {talk.coAuthors && talk.coAuthors.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                      <Users className="size-3.5 text-muted-foreground shrink-0" />
                      <span>Соавторы: <strong className="text-[#1a4d3e]">{talk.coAuthors.join(", ")}</strong></span>
                    </div>
                  )}
                  {talk.keywords && talk.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Tag className="size-3 text-muted-foreground" />
                      {talk.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-[#1a4d3e] border border-[#1a4d3e]/10">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#1a4d3e] flex items-center gap-2">
                    <Presentation className="size-4 text-[#d4a84b]" />
                    Прикрепить материалы (презентация или отчёт) — <span className="text-xs font-normal text-muted-foreground">необязательно</span>
                  </label>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    PDF, DOCX, PPTX до 10 МБ
                  </span>
                </div>

                {!talk?.document ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const dropped = e.dataTransfer.files?.[0];
                      if (dropped) setFile(dropped);
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${isDragging
                      ? "border-[#d4a84b] bg-[#d4a84b]/10"
                      : "border-[#1a4d3e]/20 hover:border-[#1a4d3e]/50 bg-[#f5f3ed]/40"
                      }`}
                  >
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf,.pptx,.ppt"
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#1a4d3e]/10 text-[#1a4d3e] flex items-center justify-center">
                        <Upload className="size-7" />
                      </div>
                      {file ? (
                        <div className="space-y-1">
                          <span className="font-bold text-[#1a4d3e] text-base block">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            {(file.size / 1024 / 1024).toFixed(2)} МБ •{" "}
                            {file.name.endsWith(".pptx") || file.name.endsWith(".ppt")
                              ? "Презентация (PPTX)"
                              : file.name.endsWith(".docx") || file.name.endsWith(".doc")
                                ? "Документ Word (DOCX)"
                                : "PDF документ / презентация"}
                          </span>
                          <span className="inline-block mt-2 text-xs font-semibold text-[#1a4d3e] underline">
                            Выбрать другой файл
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold text-[#1a4d3e] text-base block">
                            Перетащите презентацию (PDF, PPTX) или документ Word
                          </span>
                          <span className="text-xs text-muted-foreground block">
                            Поддерживаются PDF, DOCX и PPTX до 10 МБ. Если у вас только презентация — прикрепите её сюда.
                          </span>
                          <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 bg-white rounded-lg border border-[#1a4d3e]/20 text-[#1a4d3e]">
                            Обзор файлов
                          </span>
                        </div>
                      )}
                    </label>

                    {file && (
                      <div className="mt-4 pt-4 border-t border-[#1a4d3e]/10 flex justify-center">
                        <Button
                          className="px-6 py-2.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-bold rounded-xl shadow-xs"
                          isPending={uploadDoc.isPending}
                          onClick={handleFileUpload}
                        >
                          <Upload className="size-4 mr-2" />
                          Загрузить выбранный файл
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-[#f5f3ed] p-5 rounded-2xl border border-[#1a4d3e]/15">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-[#1a4d3e] text-[#f5f3ed] rounded-xl">
                        {talk.document.originalName.endsWith(".pptx") || talk.document.originalName.endsWith(".ppt") ? (
                          <Presentation className="size-6" />
                        ) : (
                          <FileText className="size-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[#1a4d3e]">{talk.document.originalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ • Материалы успешно прикреплены
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip color="success" variant="soft">
                        <CheckCircle2 className="size-4 mr-1" /> Прикреплено
                      </Chip>
                      <label htmlFor="file-reupload" className="text-xs font-semibold text-[#1a4d3e] hover:underline cursor-pointer ml-2">
                        Заменить
                        <input
                          type="file"
                          accept=".docx,.doc,.pdf,.pptx,.ppt"
                          className="hidden"
                          id="file-reupload"
                          onChange={async (e) => {
                            const newF = e.target.files?.[0];
                            if (newF) {
                              setFile(newF);
                              await uploadDoc.mutateAsync({ talkId: createdTalkId, file: newF });
                              queryClient.invalidateQueries({
                                queryKey: queryKeys.talks.detail(createdTalkId),
                              });
                              toast.success("Файл заменён");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#d4a84b]/40 bg-[#d4a84b]/5 p-5 sm:p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#d4a84b] text-[#1a4d3e]">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1a4d3e]">
                        ИИ-экспресс-анализ доклада (необязательно)
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Gemini AI проверяет соответствие теме секции и качество тезисов. Можно отправить заявку сразу без AI-анализа.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#1a4d3e] border border-[#d4a84b]/40 shrink-0">
                    Необязательно
                  </span>
                </div>

                {aiResult && (
                  <div className="space-y-4 animate-in fade-in pt-2">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div
                        className={`p-3.5 rounded-xl border ${aiResult.sectionFit.score >= 70
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-amber-50/60 border-amber-200"
                          }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">
                          Соответствие секции
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {aiResult.sectionFit.comment}
                        </p>
                        <p className="text-xl font-black mt-2 text-[#1a4d3e]">
                          {aiResult.sectionFit.score}/100
                        </p>
                      </div>

                      <div
                        className={`p-3.5 rounded-xl border ${aiResult.annotationMatch.score >= 70
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-amber-50/60 border-amber-200"
                          }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-[#1a4d3e]/80">
                          Качество тезисов
                        </p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {aiResult.annotationMatch.comment}
                        </p>
                        <p className="text-xl font-black mt-2 text-[#1a4d3e]">
                          {aiResult.annotationMatch.score}/100
                        </p>
                      </div>
                    </div>

                    {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                      <div className="bg-white p-4 rounded-xl border border-[#1a4d3e]/10 text-xs text-[#1a4d3e]/80 space-y-1">
                        <span className="font-bold text-[#1a4d3e] block mb-1">Рекомендации ИИ:</span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {aiResult.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    className="flex-1 py-3.5 bg-white hover:bg-white/80 text-[#1a4d3e] border border-[#d4a84b] font-bold rounded-xl shadow-2xs"
                    isPending={validateTalk.isPending}
                    isDisabled={talk?.aiAttempts ? talk.aiAttempts >= 3 : false}
                    onClick={handleValidate}
                  >
                    <Sparkles className="size-4 text-[#d4a84b] mr-2" />
                    {aiResult ? `Запустить AI-проверку заново (${talk?.aiAttempts || 1}/3)` : "Запустить AI-проверку (0/3)"}
                  </Button>

                  <Button
                    className="flex-1 py-3.5 bg-[#1a4d3e] hover:bg-[#143d31] text-white font-extrabold rounded-xl shadow-xs"
                    onClick={handleFinishSubmission}
                  >
                    <Send className="size-4 text-[#d4a84b] mr-2" />
                    {aiResult ? "Завершить и передать в жюри" : "Отправить на принятие (без AI-анализа)"}
                  </Button>
                </div>
              </div>

              {!talk?.document && !file && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleFinishSubmission}
                    className="text-xs font-semibold text-muted-foreground hover:text-[#1a4d3e] transition-colors underline cursor-pointer"
                  >
                    Отправить заявку только с тезисами (без прикрепления файла и без AI)
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };