import { useQuery } from "@tanstack/react-query";
import { listSections } from "~shared/mocks/demoServer";

export function useSectionsQuery() {
  return useQuery({ queryKey: ["sections"], queryFn: listSections });
}