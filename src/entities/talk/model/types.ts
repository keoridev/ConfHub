export interface Conference {
  id: string;
  title: string;
  dateLabel: string;   
  location: string;
}

export interface Section {
  id: string;
  title: string;
  color: string;
}

export interface Talk {
  id: string;
  title: string;
  speakerName: string;
  sectionId: string;
  hallNumber: string;
  startTime: string; // ISO 8601, e.g., "2026-10-05T10:00:00+06:00"
  endTime: string;
  abstract: string;
  tags: string[];
  status: "draft" | "pending_review" | "approved" | "rejected";
}

export interface AIValidationResult {
  matchScore: number;
  sectionMatch: { isMatching: boolean; explanation: string };
  abstractMatch: { isMatching: boolean; explanation: string };
  extractedKeywords: string[];
  feedback: string[];
}