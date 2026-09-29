import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTalk,
  getAIResult,
  getTalk,
  listTalks,
  reviewTalk,
  runAIValidation,
} from "~shared/mocks/demoServer";
import type { Talk } from "../model/types";

export const talkKeys = {
  all: ["talks"] as const,
  detail: (id: string) => ["talks", "detail", id] as const,
  ai: (id: string) => ["talks", "ai", id] as const,
};

export function useTalksQuery() {
  return useQuery({ queryKey: talkKeys.all, queryFn: listTalks });
}

export function useTalkQuery(id: string) {
  return useQuery({
    queryKey: talkKeys.detail(id),
    queryFn: () => getTalk(id),
  });
}

export function useAIResultQuery(talkId: string) {
  return useQuery({
    queryKey: talkKeys.ai(talkId),
    queryFn: () => getAIResult(talkId),
  });
}

type SubmitInput = Pick<
  Talk,
  "title" | "speakerName" | "sectionId" | "abstract" | "tags"
>;

export function useSubmitTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitInput) => createTalk(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: talkKeys.all }),
  });
}

export function useReviewTalkMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => reviewTalk(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: talkKeys.all }),
  });
}

export function useValidateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: runAIValidation,
    onSuccess: (result, vars) => {
      if (vars.talkId) qc.setQueryData(talkKeys.ai(vars.talkId), result);
    },
  });
}
