import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~shared/lib/api/client";
import type { Room } from "../model/types";

export const roomQueryKeys = {
  all: ["rooms"] as const,
  byConference: (conferenceId: number) => ["rooms", "conference", conferenceId] as const,
};

export function useRoomsQuery(conferenceId: number = 1) {
  return useQuery({
    queryKey: roomQueryKeys.byConference(conferenceId),
    queryFn: () =>
      apiClient
        .get<Room[]>(`/rooms?conferenceId=${conferenceId}`)
        .then((res) => res.data),
  });
}
