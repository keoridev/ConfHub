import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTalk,
  getAIResult,
  getConference,
  getTalk,
  listSections,
  listTalks,
  reviewTalk,
  runAIValidation,
} from "~shared/mocks/demoServer";
import type { AIValidationResult, Conference, Section, Talk } from "../model/types";

// === Query Keys ===
export const conferenceKeys = {
  all: ["conferences"] as const,
  detail: (id: string) => [...conferenceKeys.all, id] as const,
};

export const sectionKeys = {
  all: ["sections"] as const,
};

export const talkKeys = {
  all: ["talks"] as const,
  detail: (id: string) => [...talkKeys.all, "detail", id] as const,
  ai: (id: string) => [...talkKeys.all, "ai", id] as const,
};

// === Queries ===
export function useConferenceQuery(id: string) {
  return useQuery<Conference>({ 
    queryKey: conferenceKeys.detail(id), 
    queryFn: () => getConference(id) 
  });
}

export function useSectionsQuery() {
  return useQuery<Section[]>({ 
    queryKey: sectionKeys.all, 
    queryFn: listSections 
  });
}

export function useTalksQuery() {
  return useQuery<Talk[]>({ 
    queryKey: talkKeys.all, 
    queryFn: listTalks 
  });
}

export function useTalkQuery(id: string) {
  return useQuery<Talk>({
    queryKey: talkKeys.detail(id),
    queryFn: () => getTalk(id),
  });
}

export function useAIResultQuery(talkId: string) {
  return useQuery<AIValidationResult>({
    queryKey: talkKeys.ai(talkId),
    queryFn: () => getAIResult(talkId),
    // Опционально: enabled: !!talkId, если talkId может быть пустым
  });
}

// === Mutations ===
type SubmitTalkInput = Pick<Talk, "title" | "speakerName" | "sectionId" | "abstract" | "tags">;

export function useSubmitTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitTalkInput) => createTalk(input),
    onSuccess: () => {
      // Инвалидируем весь список, чтобы подтянуть новый доклад
      qc.invalidateQueries({ queryKey: talkKeys.all });
    },
  });
}

export function useReviewTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      updates,
    }: {
      id: string;
      status: "approved" | "rejected";
      updates?: Partial<Talk>;
    }) => reviewTalk(id, status, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: talkKeys.all });
      // Хорошая практика: инвалидировать и конкретный элемент, если он открыт
    },
  });
}

type ValidateMutationVariables = { talkId: string };

export function useValidateMutation() {
  const qc = useQueryClient();
  return useMutation<AIValidationResult, Error, ValidateMutationVariables>({
    mutationFn: runAIValidation,
    onSuccess: (result, variables) => {
      // Функциональное обновление безопаснее, чем прямая перезапись
      qc.setQueryData(talkKeys.ai(variables.talkId), result);
    },
  });
}