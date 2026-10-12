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
    });

  const openSecEdit = (s: Section) =>
    setSecForm({
      open: true,
      mode: "edit",
      id: s.id,
      title: s.title,
      sortOrder: String(s.sortOrder),
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
      if (secForm.mode === "create") {
        await apiClient.post("/admin/sections", {
          conferenceId: 1,
          title: secForm.title.trim(),
          sortOrder: Number(secForm.sortOrder) || 1,
        });
      } else {
        await apiClient.patch(`/admin/sections/${secForm.id}`, {
          title: secForm.title.trim(),
          sortOrder: Number(secForm.sortOrder) || 1,
        });
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
      if (!confirm("Удалить секцию? Если есть связанные доклады — бэкенд вернёт ошибку.")) return;
      try {
        await apiClient.delete(`/admin/sections/${id}`);
        await refetchSections();
      } catch (e: any) {
        alert(e?.response?.data?.error?.message || "Не удалось удалить");
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
