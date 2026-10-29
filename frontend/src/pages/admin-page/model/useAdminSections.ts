import { useState, useCallback } from "react";
import { apiClient } from "~shared/lib";
import type { Section } from "~entities/talk/model/types";
import type { SectionFormState } from "./types";

export function useAdminSections(sections: Section[], refetchSections: () => Promise<unknown>) {
  const [secForm, setSecForm] = useState<SectionFormState>({
    open: false,
    mode: "create",
    title: "",
    sortOrder: "1",
  });
  const [secSaving, setSecSaving] = useState(false);
  const [secError, setSecError] = useState("");

  const openSecCreate = () =>
    setSecForm({
      open: true,
      mode: "create",
      title: "",
      sortOrder: String(sections.length + 1),
      supervisor: "",
    });

  const openSecEdit = (s: Section) =>
    setSecForm({
      open: true,
      mode: "edit",
      id: s.id,
      title: s.title,
      sortOrder: String(s.sortOrder),
      supervisor: s.supervisor || "",
    });

  const closeSecForm = () => setSecForm((f) => ({ ...f, open: false }));

  const saveSection = useCallback(async () => {
    if (!secForm.title.trim()) {
      setSecError("Введите название секции");
      return;
    }
    setSecSaving(true);
    setSecError("");
    try {
      const payload = {
        title: secForm.title.trim(),
        sortOrder: Number(secForm.sortOrder) || 1,
        supervisor: secForm.supervisor?.trim() || undefined,
      };
      if (secForm.mode === "create") {
        await apiClient.post("/admin/sections", {
          conferenceId: 1,
          ...payload,
        });
      } else {
        await apiClient.patch(`/admin/sections/${secForm.id}`, payload);
      }
      await refetchSections();
      closeSecForm();
    } catch (e: any) {
      setSecError(e?.response?.data?.error?.message || "Ошибка сохранения");
    } finally {
      setSecSaving(false);
    }
  }, [secForm, refetchSections]);

  const deleteSection = useCallback(
    async (id: number) => {
      if (!confirm("Вы действительно хотите удалить эту секцию?")) return;
      try {
        await apiClient.delete(`/admin/sections/${id}`);
        await refetchSections();
      } catch (e: any) {
        if (e?.response?.status === 409) {
          const force = confirm(
            "В этой секции есть зарегистрированные доклады. Отвязать эти доклады и всё равно удалить секцию?"
          );
          if (force) {
            try {
              await apiClient.delete(`/admin/sections/${id}?force=true`);
              await refetchSections();
              return;
            } catch (err: any) {
              alert(err?.response?.data?.error?.message || "Не удалось принудительно удалить секцию");
              return;
            }
          }
        }
        alert(e?.response?.data?.error?.message || "Не удалось удалить секцию");
      }
    },
    [refetchSections]
  );

  return {
    secForm,
    setSecForm,
    secSaving,
    secError,
    openSecCreate,
    openSecEdit,
    closeSecForm,
    saveSection,
    deleteSection,
  };
}
