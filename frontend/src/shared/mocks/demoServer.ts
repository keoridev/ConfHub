import type { AIValidationResult, Conference, Section, Talk } from "~entities/talk/model/types";
import { mockTalks, mockSections, initialAIResults } from "./mockData";

let talks: Talk[] = [...mockTalks];
const aiResults = new Map(initialAIResults);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getConference(id: number | string): Promise<Conference | undefined> {
  await delay(100);
  return {
    id: Number(id),
    title: "Международная научно-практическая конференция 2026",
    description: "Ежегодная конференция",
    startDate: "2026-10-05T00:00:00Z",
    endDate: "2026-10-07T00:00:00Z",
  };
}

export async function listSections(): Promise<Section[]> {
  await delay(100);
  return mockSections;
}

export async function listTalks(): Promise<Talk[]> {
  await delay(250);
  return [...talks];
}

export async function getTalk(id: number): Promise<Talk | undefined> {
  await delay(150);
  return talks.find((t) => t.id === id);
}

export async function createTalk(
  input: Omit<Talk, "id" | "status" | "room" | "startTime" | "endTime">
): Promise<Talk> {
  await delay(400);
  const newTalk: Talk = {
    ...input,
    id: Date.now(),
    status: "pending_review",
    startTime: "",
    endTime: "",
  };
  talks = [...talks, newTalk];
  return newTalk;
}

export async function reviewTalk(
  id: number,
  status: "approved" | "rejected",
  updates?: Partial<Talk>
): Promise<void> {
  await delay(300);
  talks = talks.map((t) => (t.id === id ? { ...t, status, ...updates } : t));
}

export async function setTalkKeynote(
  id: number,
  isKeynote: boolean
): Promise<Talk | undefined> {
  await delay(200);
  talks = talks.map((t) => (t.id === id ? { ...t, isKeynote } : t));
  return talks.find((t) => t.id === id);
}

export async function getAIResult(talkId: number): Promise<AIValidationResult | undefined> {
  await delay(100);
  return aiResults.get(talkId);
}

export async function runAIValidation(input: {
  talkId?: number;
  title: string;
  sectionId: number;
  abstract: string;
  file?: File | null;
}): Promise<AIValidationResult> {
  await delay(2000);

  const wordCount = input.abstract.trim().split(/\s+/).filter(Boolean).length;
  const section = mockSections.find((s) => s.id === input.sectionId);
  const baseScore = input.file ? 85 : 70;
  const score = Math.min(98, Math.round(baseScore + Math.min(wordCount, 35) * 0.5));
  const abstractOk = wordCount >= 30;

  const result: AIValidationResult = {
    id: Date.now(),
    attemptNo: 1,
    result: {
      sectionFit: { score, verdict: score > 75 ? "ok" : "attention", comment: `Тематика доклада соответствует секции «${section?.title}».` },
      annotationMatch: { score: abstractOk ? 90 : 50, verdict: abstractOk ? "ok" : "attention", comment: abstractOk ? "Аннотация соответствует требованиям." : "Дополните аннотацию." },
      issues: [],
      suggestions: [],
      overallVerdict: "ok",
    }
  };

  if (input.talkId) aiResults.set(input.talkId, result);
  return result;
}