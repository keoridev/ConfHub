import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~shared/lib/api/client";
import type { Talk, Section, Room } from "../model/types";

export const queryKeys = {
  talks: {
    all: ["talks"] as const,
    byConference: (conferenceId: number, status?: string) =>
      ["talks", "conference", conferenceId, status] as const,
    detail: (id: number) => ["talks", "detail", id] as const,
  },
  sections: { all: ["sections"] as const },
  rooms: { all: ["rooms"] as const },
  auth: { user: ["auth", "user"] as const },
};

// === MUTATIONS ===

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { login: string; password: string }) =>
      apiClient
        .post<{ user: any; token?: string }>("/auth/login", data)
        .then((res) => res.data),
    onSuccess: (data) => {
      // Сохраняем данные пользователя в кэш
      qc.setQueryData(queryKeys.auth.user, data.user);
      // Сохраняем токен, если он приходит с бэкенда
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    },
  });
}

export function useCreateTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sectionId: number;
      title: string;
      supervisor: string;
      abstract: string;
      tags: string[];
    }) => apiClient.post<Talk>("/talks", data).then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["talks", "my"] }),
  });
}

export function useUploadDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ talkId, file }: { talkId: number; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient
        .post(`/talks/${talkId}/document`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data);
    },
    onSuccess: (_, { talkId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.talks.detail(talkId) }),
  });
}

export function useValidateTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (talkId: number) =>
      apiClient.post(`/talks/${talkId}/validate`).then((res) => res.data),
    onSuccess: (_, talkId) =>
      qc.invalidateQueries({ queryKey: queryKeys.talks.detail(talkId) }),
  });
}

export function useReviewTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiClient.patch(`/jury/talks/${id}/review`, data).then((res) => res.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.talks.detail(id) });
      // Инвалидируем список, чтобы карточка исчезла из очереди
      qc.invalidateQueries({ queryKey: ["talks", "jury-queue"] });
    },
  });
}

// === QUERIES ===

export function useTalkQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.talks.detail(id),
    queryFn: () =>
      apiClient.get<Talk>(`/my/talks/${id}`).then((res) => res.data),
    enabled: !!id, // Критично: не делать запрос, если id еще нет
  });
}

// НОВЫЙ: Получение списка докладов конференции (используется в ConferencePage)
export function useTalksQuery(conferenceId: number = 1, status?: string) {
  return useQuery({
    queryKey: queryKeys.talks.byConference(conferenceId, status),
    queryFn: () =>
      apiClient
        .get<Talk[]>(`/conferences/${conferenceId}/talks`, {
          params: status ? { status } : undefined,
        })
        .then((res) => res.data),
  });
}

// Жюри получает список через общий эндпоинт конференций с фильтром статуса
export function useJuryQueueQuery(conferenceId: number = 1) {
  return useQuery({
    queryKey: ["talks", "jury-queue", conferenceId],
    queryFn: () =>
      apiClient
        .get<Talk[]>(`/conferences/${conferenceId}/talks`, {
          params: { status: "pending_review" },
        })
        .then((res) => res.data),
  });
}

export function useSectionsQuery() {
  return useQuery({
    queryKey: queryKeys.sections.all,
    queryFn: () =>
      apiClient.get<Section[]>("/sections").then((res) => res.data),
  });
}

export function useRoomsQuery(conferenceId: number = 1) {
  return useQuery({
    queryKey: queryKeys.rooms.all,
    queryFn: () =>
      apiClient
        .get<Room[]>(`/rooms?conferenceId=${conferenceId}`)
        .then((res) => res.data),
  });
}
