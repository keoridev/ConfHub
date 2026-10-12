export interface User {
  id: number;
  login: string;
  fullName: string;
  groupName: string;
  role: 'student' | 'jury' | 'admin';
  mustChangePassword: boolean;
}

export interface Section {
  id: number;
  conferenceId: number;
  title: string;
  sortOrder: number;
  color?: string;
}

export interface Conference {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Document {
  id: number;
  originalName: string;
  mime: string;
  sizeBytes: number;
}

export interface AIValidationResult {
  id: number;
  attemptNo: number;
  result: {
    sectionFit: { score: number; verdict: string; comment: string };
    annotationMatch: { score: number; verdict: string; comment: string };
    issues: Array<{ type: string; severity: string; description: string }>;
    suggestions: string[];
    overallVerdict: string;
  };
}

export interface Room {
  id: number;
  conferenceId: number;
  name: string;
}

export interface Talk {
  id: number;
  conferenceId: number;
  sectionId: number;
  authorId: number;
  title: string;
  speakerName: string;
  gradeOrGroup?: string;
  supervisor?: string;
  abstract: string;
  tags: string[];
  coAuthors?: string[];
  keywords?: string[];
  authorEmail?: string;
  university?: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'needs_revision';
  juryComment?: string;
  section: Section;
  room?: Room;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  aiAttempts: number;
  aiResult?: {
    id: number;
    attemptNo: number;
    result: {
      sectionFit: { score: number; verdict: string; comment: string };
      annotationMatch: { score: number; verdict: string; comment: string };
      issues: Array<{ type: string; severity: string; description: string }>;
      suggestions: string[];
      overallVerdict: string;
    };
  };
  document?: {
    id: number;
    originalName: string;
    mime: string;
    sizeBytes: number;
  };
}