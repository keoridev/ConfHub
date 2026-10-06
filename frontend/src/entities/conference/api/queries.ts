import { useQuery } from "@tanstack/react-query";
import { getConference } from "~shared/mocks/demoServer";

export function useConferenceQuery(id: string) {
  return useQuery({ queryKey: ["conferences", id], queryFn: () => getConference(id) });
}