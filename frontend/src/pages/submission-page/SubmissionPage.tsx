import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCreateTalkMutation,
  useUploadDocumentMutation,
  useValidateTalkMutation,
  useSectionsQuery,
  useTalkQuery,
  useCurrentUserQuery,
  useLogout,
  queryKeys,
} from "~entities/talk/api/queries";
import { ConfirmLogoutModal } from "~shared/ui";

import {
  submissionSchema,
  parseKeywords,
  DRAFT_STORAGE_KEY,
  type CoAuthorItem,
  type SubmissionFormValues,
} from "./model/types";
import { SubmissionHeader } from "./ui/SubmissionHeader";
import { JuryWarningCard } from "./ui/JuryWarningCard";
import { GuestAuthCard } from "./ui/GuestAuthCard";
import { UserBar } from "./ui/UserBar";
import { SubmissionForm } from "./ui/SubmissionForm";
import { MaterialsAndAiStep } from "./ui/MaterialsAndAiStep";
import { SubmittedSuccessView } from "./ui/SubmittedSuccessView";

export function SubmissionPage() {
  const queryClient = useQueryClient();

  const { data: user } = useCurrentUserQuery();
  const logout = useLogout();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [createdTalkId, setCreatedTalkId] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [coAuthorsList, setCoAuthorsList] = useState<CoAuthorItem[]>([]);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  const { data: sections = [] } = useSectionsQuery();
  const { data: talk } = useTalkQuery(createdTalkId!);

  const createTalk = useCreateTalkMutation();
  const uploadDoc = useUploadDocumentMutation();
  const validateTalk = useValidateTalkMutation();

  const hasWordDocument = Boolean(
    talk?.document &&
      (talk.document.originalName.toLowerCase().endsWith(".docx") ||
        talk.document.originalName.toLowerCase().endsWith(".doc") ||
        talk.document.mime.includes("word") ||
        talk.document.mime.includes("officedocument.wordprocessingml"))
  );

  const isWordFileSelected = Boolean(
    file &&
      (file.name.toLowerCase().endsWith(".docx") ||
        file.name.toLowerCase().endsWith(".doc"))
  );

  const isNonWordDocumentAttached = Boolean(talk?.document && !hasWordDocument);
  const isNonWordFileSelected = Boolean(file && !isWordFileSelected && !talk?.document);

  const aiAttemptsCount = talk?.aiAttempts || (talk?.aiResult ? 1 : 0);
  const isAiUsed = aiAttemptsCount >= 1;

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
      speakerName: user?.fullName || "",
      university: user?.university || "",
      gradeOrGroup: user?.groupName || "",
      authorEmail: "",
      keywords: "",
      supervisor: "",
      title: "",
      sectionId: "",
      abstract: "",
    },
  });

  const sectionId = watch("sectionId");
  const titleValue = watch("title") || "";
  const speakerNameValue = watch("speakerName") || "";
  const universityValue = watch("university") || "";
  const gradeOrGroupValue = watch("gradeOrGroup") || "";
  const authorEmailValue = watch("authorEmail") || "";
  const keywordsValue = watch("keywords") || "";
  const supervisorValue = watch("supervisor") || "";
  const abstractValue = watch("abstract") || "";

  // Restore draft from localStorage on initial render
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.title) setValue("title", parsed.title);
      if (parsed.sectionId) setValue("sectionId", parsed.sectionId);
      if (parsed.speakerName) setValue("speakerName", parsed.speakerName);
      if (parsed.university) setValue("university", parsed.university);
      if (parsed.gradeOrGroup) setValue("gradeOrGroup", parsed.gradeOrGroup);
      if (parsed.authorEmail) setValue("authorEmail", parsed.authorEmail);
      if (parsed.supervisor) setValue("supervisor", parsed.supervisor);
      if (parsed.keywords) setValue("keywords", parsed.keywords);
      if (parsed.abstract) setValue("abstract", parsed.abstract);
      if (Array.isArray(parsed.coAuthorsList)) {
        setCoAuthorsList(parsed.coAuthorsList);
      }
      if (parsed.createdTalkId) {
        setCreatedTalkId(parsed.createdTalkId);
      }
      setHasRestoredDraft(true);
    } catch {}
  }, [setValue]);

  // Synchronize initial user fields if empty
  useEffect(() => {
    if (user) {
      if (user.fullName && !watch("speakerName")) {
        setValue("speakerName", user.fullName);
      }
      if (user.university && !watch("university")) {
        setValue("university", user.university);
      }
      if (user.groupName && !watch("gradeOrGroup")) {
        setValue("gradeOrGroup", user.groupName);
      }
    }
  }, [user, setValue, watch]);

  // Auto-save form draft to localStorage on any change
  useEffect(() => {
    if (isSubmitted) return;
    const hasAnyContent =
      titleValue ||
      sectionId ||
      speakerNameValue ||
      universityValue ||
      gradeOrGroupValue ||
      authorEmailValue ||
      keywordsValue ||
      supervisorValue ||
      abstractValue ||
      coAuthorsList.length > 0 ||
      createdTalkId;

    if (hasAnyContent) {
      const draft = {
        title: titleValue,
        sectionId,
        speakerName: speakerNameValue,
        university: universityValue,
        gradeOrGroup: gradeOrGroupValue,
        authorEmail: authorEmailValue,
        supervisor: supervisorValue,
        keywords: keywordsValue,
        abstract: abstractValue,
        coAuthorsList,
        createdTalkId,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [
    titleValue,
    sectionId,
    speakerNameValue,
    universityValue,
    gradeOrGroupValue,
    authorEmailValue,
    supervisorValue,
    keywordsValue,
    abstractValue,
    coAuthorsList,
    createdTalkId,
    isSubmitted,
  ]);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setCoAuthorsList([]);
    setHasRestoredDraft(false);
    reset({
      title: "",
      sectionId: "",
      speakerName: user?.fullName || "",
      university: "",
      gradeOrGroup: user?.groupName || "",
      authorEmail: "",
      keywords: "",
      supervisor: "",
      abstract: "",
    });
    toast.info("Черновик очищен");
  };

  const handleAddCoAuthor = () => {
    setCoAuthorsList((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        fullName: "",
        university: "",
        groupName: "",
      },
    ]);
  };

  const handleRemoveCoAuthor = (id: string) => {
    setCoAuthorsList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateCoAuthor = (
    id: string,
    field: keyof CoAuthorItem,
    value: string
  ) => {
    setCoAuthorsList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const onCreateTalk = async (values: SubmissionFormValues) => {
    try {
      const formattedCoAuthors = coAuthorsList
        .filter((c) => c.fullName.trim())
        .map((c) => {
          const parts = [c.university.trim(), c.groupName.trim()]
            .filter(Boolean)
            .join(", ");
          return parts ? `${c.fullName.trim()} (${parts})` : c.fullName.trim();
        });

      const parsedKw = parseKeywords(values.keywords);

      const data = await createTalk.mutateAsync({
        sectionId: Number(values.sectionId),
        title: values.title,
        speakerName: values.speakerName?.trim() || user?.fullName || "",
        university: values.university?.trim() || "",
        gradeOrGroup: values.gradeOrGroup?.trim() || "",
        authorEmail: values.authorEmail?.trim() || "",
        coAuthors: formattedCoAuthors,
        keywords: parsedKw,
        supervisor: values.supervisor?.trim() || "",
        abstract: values.abstract,
        tags: parsedKw,
      });

      setCreatedTalkId(data.id);
      setIsSubmitted(false);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasRestoredDraft(false);
      toast.success(
        "Заявка зарегистрирована! Вы можете прикрепить файл презентации или сразу отправить её жюри."
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message || "Ошибка создания заявки";
      toast.error(msg);
    }
  };

  const handleEditSubmission = () => {
    if (talk) {
      setValue("title", talk.title);
      if (talk.sectionId) setValue("sectionId", String(talk.sectionId));
      if (talk.speakerName) setValue("speakerName", talk.speakerName);
      if (talk.university) setValue("university", talk.university);
      if (talk.gradeOrGroup) setValue("gradeOrGroup", talk.gradeOrGroup);
      if (talk.authorEmail) setValue("authorEmail", talk.authorEmail);
      if (talk.supervisor) setValue("supervisor", talk.supervisor);
      if (talk.abstract) setValue("abstract", talk.abstract);
      if (talk.tags && talk.tags.length > 0) {
        setValue("keywords", talk.tags.join(", "));
      } else if (talk.keywords && talk.keywords.length > 0) {
        setValue("keywords", talk.keywords.join(", "));
      }
      if (talk.coAuthors && talk.coAuthors.length > 0) {
        const parsed: CoAuthorItem[] = talk.coAuthors.map((ca) => {
          const match = ca.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            const name = match[1].trim();
            const details = match[2].split(",").map((s) => s.trim());
            return {
              id: Math.random().toString(36).substring(2, 9),
              fullName: name,
              university: details[0] || "",
              groupName: details[1] || "",
            };
          }
          return {
            id: Math.random().toString(36).substring(2, 9),
            fullName: ca,
            university: "",
            groupName: "",
          };
        });
        setCoAuthorsList(parsed);
      }
    }
    setCreatedTalkId(null);
    setIsSubmitted(false);
    toast.info("Режим редактирования заявки включен. Все данные сохранены в форме.");
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.success("Вы успешно вышли из аккаунта");
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

  const handleReplaceFile = async (newF: File) => {
    if (!createdTalkId) return;
    try {
      setFile(newF);
      await uploadDoc.mutateAsync({ talkId: createdTalkId, file: newF });
      queryClient.invalidateQueries({
        queryKey: queryKeys.talks.detail(createdTalkId),
      });
      toast.success("Файл заменён");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Ошибка замены файла";
      toast.error(msg);
    }
  };

  const handleValidate = async () => {
    if (!createdTalkId) return;

    if (isAiUsed) {
      toast.error("AI-экспертизу доклада можно запустить только 1 раз. Попытка уже использована.");
      return;
    }

    // If file is selected in file input but not yet uploaded:
    if (!talk?.document && file) {
      if (!isWordFileSelected) {
        toast.error("Для AI-экспертизы требуется документ Word (.docx или .doc). Загрузите файл Word.");
        return;
      }
      try {
        toast.loading("Загрузка Word документа перед AI-анализом...", { id: "upload-before-ai" });
        await uploadDoc.mutateAsync({ talkId: createdTalkId, file });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.talks.detail(createdTalkId),
        });
        toast.dismiss("upload-before-ai");
      } catch {
        toast.dismiss("upload-before-ai");
        toast.error("Не удалось прикрепить Word документ перед анализом");
        return;
      }
    } else if (!hasWordDocument) {
      if (talk?.document) {
        toast.error(`Для AI-экспертизы требуется документ Word (.docx или .doc). Текущий файл: ${talk.document.originalName}`);
      } else {
        toast.error("Для запуска AI-экспертизы необходимо сначала прикрепить документ Word (.docx или .doc).");
      }
      return;
    }

    try {
      await validateTalk.mutateAsync(createdTalkId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.talks.detail(createdTalkId),
      });
      toast.success("AI-экспертиза успешно завершена!");
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Ошибка при выполнении AI-проверки";
      toast.error(msg);
    }
  };

  const handleFinishSubmission = async () => {
    // If a file was selected but not uploaded yet, upload it before finalizing
    if (file && createdTalkId && !talk?.document) {
      try {
        await uploadDoc.mutateAsync({ talkId: createdTalkId, file });
        queryClient.invalidateQueries({
          queryKey: queryKeys.talks.detail(createdTalkId),
        });
      } catch {
        toast.error("Не удалось прикрепить файл презентации");
      }
    }
    setIsSubmitted(true);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    toast.success("Заявка успешно передана в очередь жюри на рассмотрение!");
  };

  const handleResetForm = () => {
    setCreatedTalkId(null);
    setFile(null);
    setIsSubmitted(false);
    setCoAuthorsList([]);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasRestoredDraft(false);
    reset({
      title: "",
      sectionId: "",
      university: "",
      gradeOrGroup: user?.groupName || "",
      authorEmail: "",
      keywords: "",
      supervisor: "",
      abstract: "",
    });
  };

  const currentSection = sections.find((s) => s.id === talk?.sectionId);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-6 sm:space-y-8 overflow-hidden">
      <SubmissionHeader
        user={user}
        createdTalkId={createdTalkId}
        isSubmitted={isSubmitted}
      />

      <div className="space-y-8">
        {user && user.role === "jury" && (
          <JuryWarningCard
            user={user}
            onOpenLogout={() => setIsLogoutModalOpen(true)}
          />
        )}

        {!user ? (
          <GuestAuthCard />
        ) : !createdTalkId ? (
          <div className="space-y-6">
            <UserBar
              user={user}
              hasRestoredDraft={hasRestoredDraft}
              onClearDraft={handleClearDraft}
              onOpenLogout={() => setIsLogoutModalOpen(true)}
            />

            <SubmissionForm
              register={register}
              handleSubmit={handleSubmit}
              setValue={setValue}
              watch={watch}
              errors={errors}
              sections={sections}
              coAuthorsList={coAuthorsList}
              onAddCoAuthor={handleAddCoAuthor}
              onRemoveCoAuthor={handleRemoveCoAuthor}
              onUpdateCoAuthor={handleUpdateCoAuthor}
              onSubmit={onCreateTalk}
              isPending={createTalk.isPending}
            />
          </div>
        ) : isSubmitted ? (
          <SubmittedSuccessView
            createdTalkId={createdTalkId}
            talk={talk}
            currentSection={currentSection}
            user={user}
            onReset={handleResetForm}
            onEditSubmission={handleEditSubmission}
          />
        ) : (
          <MaterialsAndAiStep
            createdTalkId={createdTalkId}
            talk={talk}
            user={user}
            file={file}
            setFile={setFile}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            hasWordDocument={hasWordDocument}
            isWordFileSelected={isWordFileSelected}
            isNonWordDocumentAttached={isNonWordDocumentAttached}
            isNonWordFileSelected={isNonWordFileSelected}
            isAiUsed={isAiUsed}
            uploadDocPending={uploadDoc.isPending}
            validateTalkPending={validateTalk.isPending}
            onFileUpload={handleFileUpload}
            onValidate={handleValidate}
            onFinish={handleFinishSubmission}
            onEditSubmission={handleEditSubmission}
            onReplaceFile={handleReplaceFile}
          />
        )}
      </div>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        user={user}
      />
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };