import { useQuery } from "@tanstack/react-query";
import { mockTalks } from "~shared/mocks/schedule";
import type { Talk } from "../model/types";

const TALKS_KEY = ["talks"] as const;

async function fetchTalks(): Promise<Talk[]> {
  // TODO(Technical Debt): заменить на GET /api/conferences/:id/talks
  await new Promise((r) => setTimeout(r, 300)); // имитация сети
  return mockTalks;
}

export function useTalksQuery() {
  return useQuery({
    queryKey: TALKS_KEY,
    queryFn: fetchTalks,
    staleTime: 60_000,
  });
}
