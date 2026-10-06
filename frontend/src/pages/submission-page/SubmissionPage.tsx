import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, CheckCircle2, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCreateTalkMutation,
  useUploadDocumentMutation,
  useValidateTalkMutation,
  useSectionsQuery,
  useTalkQuery,
  queryKeys, // <-- 1. Импортируем объект с ключами запросов для точного обновления кэша
} from "~entities/talk/api/queries";
import { pathKeys } from "~shared/lib";

// <-- 2. ИСПРАВЛЕНО: Правильное название компонента TextArea (с большой 'A' на конце)
import { Card, Button, Input, TextArea, Select, ListBox, Chip } from "@heroui/react"; 

const submissionSchema = z.object({
  speakerName: z.string().min(3, "Минимум 3 символа"),
  title: z.string().min(5, "Минимум 5 символов"),
  sectionId: z.string().min(1, "Выберите секцию"),
  supervisor: z.string().min(3, "Укажите научного руководителя"),
  abstract: z.string().min(30, "Минимум 30 символов").max(1000, "Максимум 1000 символов"),
});

type SubmissionFormValues = z.infer<typeof submissionSchema>;

export function SubmissionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 

  const [createdTalkId, setCreatedTalkId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { data: sections = [] } = useSectionsQuery();
  const { data: talk } = useTalkQuery(createdTalkId!, { enabled: !!createdTalkId });
  
  const createTalk = useCreateTalkMutation();
  const uploadDoc = useUploadDocumentMutation();
  const validateTalk = useValidateTalkMutation();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onChange",
  });

  const sectionId = watch("sectionId");

  const onCreateTalk = async (values: SubmissionFormValues) => {
    try {
      const data = await createTalk.mutateAsync({
        sectionId: Number(values.sectionId),
        title: values.title,
        supervisor: values.supervisor,
        abstract: values.abstract,
        tags: [],
      });
      setCreatedTalkId(data.id);
      toast.success("Заявка создана! Теперь загрузите файл.");
    } catch (err) {
      toast.error("Ошибка создания заявки");
    }
  };

  const handleFileUpload = async () => {
    if (!file || !createdTalkId) return;
    try {
      await uploadDoc.mutateAsync({ talkId: createdTalkId, file });
      
      // <-- 3. ИСПРАВЛЕНО: используем точный queryKey из вашего queries.ts
      queryClient.invalidateQueries({ queryKey: queryKeys.talks.detail(createdTalkId) });
      
      toast.success("Файл успешно загружен");
    } catch (err) {
      toast.error("Ошибка загрузки файла. Проверьте формат (PDF/DOCX) и размер (до 10 МБ)");
    }
  };

  const handleValidate = async () => {
    if (!createdTalkId) return;
    try {
      await validateTalk.mutateAsync(createdTalkId);
      
      // <-- 4. ИСПРАВЛЕНО: используем точный queryKey из вашего queries.ts
      queryClient.invalidateQueries({ queryKey: queryKeys.talks.detail(createdTalkId) });
      
      toast.success("AI-проверка завершена");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error("Превышен лимит AI-проверок (макс. 3)");
      } else {
        toast.error("Ошибка AI-проверки");
      }
    }
  };

  const aiResult = talk?.aiResult?.result;

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <div className="bg-[#1a4d3e] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Подача заявки на доклад</h1>
          <p className="text-white/80">Заполните данные, загрузите работу и получите AI-рекомендации перед отправкой жюри.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {!createdTalkId ? (
          <Card className="border border-[#1a4d3e]/20 bg-white p-8">
            <form onSubmit={handleSubmit(onCreateTalk)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">ФИО докладчика</label>
                <Input {...register("speakerName")} className="bg-[#f5f3ed]" />
                {errors.speakerName && <p className="text-xs text-danger mt-1">{errors.speakerName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">Название темы</label>
                <Input {...register("title")} className="bg-[#f5f3ed]" />
                {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">Научный руководитель</label>
                <Input {...register("supervisor")} placeholder="Иванов И.И." className="bg-[#f5f3ed]" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">Секция</label>
                <Select
                  selectedKeys={sectionId ? [sectionId] : []}
                  onSelectionChange={(keys) => setValue("sectionId", Array.from(keys)[0] as string, { shouldValidate: true })}
                  className="bg-[#f5f3ed]"
                >
                  <Select.Trigger><Select.Value placeholder="Выберите секцию" /></Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {sections.map((s) => (
                        <ListBox.Item key={s.id} id={String(s.id)} textValue={s.title}>{s.title}</ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1a4d3e] mb-2">Аннотация</label>
                {/* <-- ИСПРАВЛЕНО: используем правильный компонент TextArea */}
                <TextArea {...register("abstract")} rows={4} className="bg-[#f5f3ed]" />
                {errors.abstract && <p className="text-xs text-danger mt-1">{errors.abstract.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-[#1a4d3e] text-white" isPending={createTalk.isPending}>
                Создать заявку и перейти к загрузке
              </Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border border-[#1a4d3e]/20 bg-white p-8">
              <h2 className="text-xl font-bold text-[#1a4d3e] mb-4">Материалы доклада</h2>
              
              {!talk?.document ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); setFile(e.dataTransfer.files?.[0] || null); }}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging ? "border-[#d4a84b] bg-[#d4a84b]/10" : "border-[#1a4d3e]/20"}`}
                >
                  <input type="file" accept=".pdf,.docx" className="hidden" id="file-upload" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <Upload className="size-10 text-[#1a4d3e]" />
                    <span className="font-semibold text-[#1a4d3e]">{file ? file.name : "Перетащите PDF или DOCX (до 10 МБ)"}</span>
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#f5f3ed] p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="size-8 text-[#1a4d3e]" />
                    <div>
                      <p className="font-semibold text-[#1a4d3e]">{talk.document.originalName}</p>
                      <p className="text-xs text-muted-foreground">{(talk.document.sizeBytes / 1024 / 1024).toFixed(2)} МБ</p>
                    </div>
                  </div>
                  <Chip color="success" variant="flat"><CheckCircle2 className="size-4 mr-1"/> Загружено</Chip>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                {!talk?.document && (
                  <Button className="flex-1 bg-[#1a4d3e] text-white" isPending={uploadDoc.isPending} isDisabled={!file} onClick={handleFileUpload}>
                    Загрузить файл
                  </Button>
                )}
                
                {talk?.document && (
                  <Button 
                    className="flex-1 bg-[#d4a84b] text-[#1a4d3e] font-bold" 
                    isPending={validateTalk.isPending} 
                    isDisabled={talk.aiAttempts >= 3}
                    onClick={handleValidate}
                  >
                    {aiResult ? "Проверить заново" : "Запустить AI-проверку"} ({talk.aiAttempts}/3)
                  </Button>
                )}
              </div>
            </Card>

            {aiResult && (
              <Card className="border border-[#1a4d3e]/20 bg-white p-8 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xl font-bold text-[#1a4d3e] mb-4 flex items-center gap-2">
                  <CheckCircle2 className="text-success" /> Результат AI-проверки
                </h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border ${aiResult.sectionFit.score >= 70 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}>
                    <p className="text-sm font-semibold">Соответствие секции</p>
                    <p className="text-xs mt-1 text-muted-foreground">{aiResult.sectionFit.comment}</p>
                    <p className="text-lg font-bold mt-2">{aiResult.sectionFit.score}/100</p>
                  </div>
                  <div className={`p-4 rounded-lg border ${aiResult.annotationMatch.score >= 70 ? "bg-success/5 border-success/20" : "bg-warning/5 border-warning/20"}`}>
                    <p className="text-sm font-semibold">Качество аннотации</p>
                    <p className="text-xs mt-1 text-muted-foreground">{aiResult.annotationMatch.comment}</p>
                    <p className="text-lg font-bold mt-2">{aiResult.annotationMatch.score}/100</p>
                  </div>
                </div>

                {aiResult.suggestions.length > 0 && (
                  <div className="bg-[#f5f3ed] p-4 rounded-lg">
                    <p className="text-sm font-semibold text-[#1a4d3e] mb-2">Рекомендации по улучшению:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {aiResult.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  {/* ИСПРАВЛЕНО: pathKeys.submission - это строка, скобки () убраны */}
                  <Button className="bg-[#1a4d3e] text-white" onClick={() => navigate(pathKeys.submission)}>
                    Перейти к моим заявкам
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const submissionPageRoute = { element: <SubmissionPage /> };