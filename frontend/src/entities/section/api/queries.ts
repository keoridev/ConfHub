import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~shared/lib/api/client";
import type { Section } from "../model/types";

export const sectionQueryKeys = {
  all: ["sections"] as const,
};

export function useSectionsQuery() {
  return useQuery({
    queryKey: sectionQueryKeys.all,
    queryFn: () => apiClient.get<Section[]>("/sections").then((res) => res.data),
  });
}