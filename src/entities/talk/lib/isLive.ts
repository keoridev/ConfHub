import type { Talk } from "../model/types";

export const isLiveNow = (talk: Talk): boolean => {
  if (!talk.startTime || !talk.endTime) return false;
  const now = Date.now();
  return now >= Date.parse(talk.startTime) && now <= Date.parse(talk.endTime);
};