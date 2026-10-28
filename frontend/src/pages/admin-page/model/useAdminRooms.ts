import { useState, useCallback } from "react";
import { apiClient } from "~shared/lib";
import type { Room } from "~entities/talk/model/types";
import type { RoomFormState } from "./types";

export function useAdminRooms(refetchRooms: () => Promise<unknown>) {
  const [roomForm, setRoomForm] = useState<RoomFormState>({
    open: false,
    mode: "create",
    name: "",
  });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomError, setRoomError] = useState("");

  const openRoomCreate = () => setRoomForm({ open: true, mode: "create", name: "" });
  const openRoomEdit = (r: Room) =>
    setRoomForm({ open: true, mode: "edit", id: r.id, name: r.name });
  const closeRoomForm = () => setRoomForm((f) => ({ ...f, open: false }));

  const saveRoom = useCallback(async () => {
    if (!roomForm.name.trim()) {
      setRoomError("Введите название аудитории");
      return;
    }
    setRoomSaving(true);
    setRoomError("");
    try {
      if (roomForm.mode === "create") {
        await apiClient.post("/admin/rooms", {
          conferenceId: 1,
          name: roomForm.name.trim(),
        });
      } else {
        await apiClient.patch(`/admin/rooms/${roomForm.id}`, {
          name: roomForm.name.trim(),
        });
      }
      await refetchRooms();
      closeRoomForm();
    } catch (e: any) {
      setRoomError(e?.response?.data?.error?.message || "Ошибка сохранения");
    } finally {
      setRoomSaving(false);
    }
  }, [roomForm, refetchRooms]);

  const deleteRoom = useCallback(
    async (id: number) => {
      if (!confirm("Вы действительно хотите удалить эту аудиторию?")) return;
      try {
        await apiClient.delete(`/admin/rooms/${id}`);
        await refetchRooms();
      } catch (e: any) {
        if (e?.response?.status === 409) {
          const force = confirm(
            "В этой аудитории есть запланированные доклады. Снять доклады с расписания и всё равно удалить аудиторию?"
          );
          if (force) {
            try {
              await apiClient.delete(`/admin/rooms/${id}?force=true`);
              await refetchRooms();
              return;
            } catch (err: any) {
              alert(err?.response?.data?.error?.message || "Не удалось принудительно удалить аудиторию");
              return;
            }
          }
        }
        alert(e?.response?.data?.error?.message || "Не удалось удалить аудиторию");
      }
    },
    [refetchRooms]
  );

  return {
    roomForm,
    setRoomForm,
    roomSaving,
    roomError,
    openRoomCreate,
    openRoomEdit,
    closeRoomForm,
    saveRoom,
    deleteRoom,
  };
}
