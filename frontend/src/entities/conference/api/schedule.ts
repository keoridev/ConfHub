import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "~shared/lib/api/client";
import { DEFAULT_SCHEDULE, type ScheduleSettings } from "../model/schedule";

const scheduleKey = ["conferences", "current", "schedule"] as const;

/** Timetable of the current conference, falling back to the defaults until an admin saves one. */
export function useScheduleSettingsQuery() {
  const query = useQuery({
    queryKey: scheduleKey,
    queryFn: async () => {
      const res = await apiClient.get<{ id: number; schedule?: ScheduleSettings | null }>(
        "/conferences/current"
      );
      return { conferenceId: res.data.id, schedule: res.data.schedule ?? null };
    },
    staleTime: 1000 * 60 * 5,
  });
  return {
    ...query,
    settings: query.data?.schedule ?? DEFAULT_SCHEDULE,
    isCustom: Boolean(query.data?.schedule),
    conferenceId: query.data?.conferenceId,
  };
}

export function useSaveScheduleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conferenceId, settings }: { conferenceId: number; settings: ScheduleSettings }) =>
      apiClient
        .put<ScheduleSettings>(`/admin/conferences/${conferenceId}/schedule`, settings)
        .then((res) => res.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: scheduleKey }),
  });
}
