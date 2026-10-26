import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~shared/lib/api/client";
import type { Talk, Section, Room, User } from "../model/types";

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

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { login: string; password: string }) =>
      apiClient
        .post<{ user: User; token?: string }>("/auth/login", data)
        .then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.auth.user, data.user);
      if (data.token) {
        apiClient.setToken(data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    },
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      fullName: string;
      login: string;
      password: string;
      groupName?: string;
      university?: string;
      email?: string;
    }) =>
      apiClient
        .post<{ user: User; token?: string }>("/auth/register", data)
        .then((res) => res.data),
    onSuccess: (data) => {
      qc.setQueryData(queryKeys.auth.user, data.user);
      if (data.token) {
        apiClient.setToken(data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    },
  });
}

export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: async (): Promise<User | null> => {
      const token = apiClient.getToken();
      if (!token) {
        const saved = localStorage.getItem("user");
        if (saved) {
          try {
            return JSON.parse(saved) as User;
          } catch {}
        }
        return null;
      }
      try {
        const res = await apiClient.get<User>("/auth/me");
        if (res.data) {
          localStorage.setItem("user", JSON.stringify(res.data));
          return res.data;
        }
      } catch {
        const saved = localStorage.getItem("user");
        if (saved) {
          try {
            return JSON.parse(saved) as User;
          } catch {}
        }
      }
      return null;
    },
    initialData: () => {
      const saved = localStorage.getItem("user");
      if (saved) {
        try {
          return JSON.parse(saved) as User;
        } catch {}
      }
      return null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return () => {
    apiClient.logout();
    qc.setQueryData(queryKeys.auth.user, null);
    qc.removeQueries({ queryKey: queryKeys.auth.user });
  };
}

export function useCreateTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      sectionId: number;
      title: string;
      abstract: string;
      speakerName?: string;
      supervisor?: string;
      tags?: string[];
      coAuthors?: string[];
      keywords?: string[];
      authorEmail?: string;
      university?: string;
      gradeOrGroup?: string;
    }) => apiClient.post<Talk>("/talks", data).then((res) => res.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["talks", "my"] });
      qc.invalidateQueries({ queryKey: queryKeys.talks.all });
    },
  });
}

export function useUpdateTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        sectionId?: number;
        title?: string;
        speakerName?: string;
        gradeOrGroup?: string;
        university?: string;
        authorEmail?: string;
        supervisor?: string;
        abstract?: string;
        tags?: string[];
        keywords?: string[];
        coAuthors?: string[];
      };
    }) =>
      apiClient
        .patch<Talk>(`/my/talks/${id}`, data)
        .then((res) => res.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.talks.detail(id) });
      qc.invalidateQueries({ queryKey: ["talks", "my"] });
      qc.invalidateQueries({ queryKey: queryKeys.talks.all });
    },
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
      qc.invalidateQueries({ queryKey: ["talks", "jury-queue"] });
      qc.invalidateQueries({ queryKey: queryKeys.talks.all });
    },
  });
}

export function useSetKeynoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ talkId, isKeynote }: { talkId: number; isKeynote: boolean }) =>
      apiClient.patch<Talk>(`/admin/talks/${talkId}/keynote`, { isKeynote }).then((res) => res.data),
    onSuccess: (_, { talkId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.talks.detail(talkId) });
      qc.invalidateQueries({ queryKey: queryKeys.talks.all });
      qc.invalidateQueries({ queryKey: queryKeys.sections.all });
      qc.invalidateQueries({ queryKey: ["talks", "jury-queue"] });
    },
  });
}

export function useTalkQuery(id: number) {
  return useQuery({
    queryKey: queryKeys.talks.detail(id),
    queryFn: async () => {
      try {
        const res = await apiClient.get<Talk>(`/talks/${id}`);
        return res.data;
      } catch {
        const res = await apiClient.get<Talk>(`/my/talks/${id}`);
        return res.data;
      }
    },
    enabled: !!id,
  });
}

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

export function useJuryQueueQuery(conferenceId: number = 1, status: string = "pending_review") {
  return useQuery({
    queryKey: ["talks", "jury-queue", conferenceId, status],
    queryFn: () =>
      apiClient
        .get<Talk[]>(`/conferences/${conferenceId}/talks`, {
          params: { status },
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

export function useAIResultQuery(talkId: number) {
  return useQuery({
    queryKey: ["talks", "ai-result", talkId] as const,
    queryFn: () =>
      apiClient
        .get(`/talks/${talkId}/ai-result`)
        .then((res) => res.data),
    enabled: !!talkId,
    retry: false,
  });
}

export function useJuryTalkQuery(talkId: number) {
  return useQuery({
    queryKey: ["talks", "jury-detail", talkId] as const,
    queryFn: () =>
      apiClient
        .get<Talk>(`/jury/talks/${talkId}`)
        .then((res) => res.data),
    enabled: !!talkId,
  });
}
