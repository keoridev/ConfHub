import { apiClient } from './client';
import type {
  AuthResponse,
  Conference,
  Section,
  Room,
  Talk,
  AIValidationResult,
  Document,
  User,
} from '~entities/talk/model/types';

export const authService = {
  login: (login: string, password: string) =>
    apiClient.post<AuthResponse>('/auth/login', { login, password }),

  changePassword: (oldPassword: string, newPassword: string, consent: boolean) =>
    apiClient.post<AuthResponse>('/auth/change-password', {
      oldPassword,
      newPassword,
      consent,
    }),

  getMe: () => apiClient.get<User>('/auth/me'),
};

export const conferenceService = {
  list: () => apiClient.get<Conference[]>('/conferences'),
  getCurrent: () => apiClient.get<Conference>('/conferences/current'),
  getById: (id: number) => apiClient.get<Conference>(`/conferences/${id}`),
};

export const sectionService = {
  list: (conferenceId?: number) =>
    apiClient.get<Section[]>('/sections', {
      params: conferenceId ? { conferenceId } : undefined,
    }),
};

export const roomService = {
  list: (conferenceId?: number) =>
    apiClient.get<Room[]>('/rooms', {
      params: conferenceId ? { conferenceId } : undefined,
    }),
};

export const talkService = {
  listByConference: (
    conferenceId: number,
    filters?: { status?: string; sectionId?: number; q?: string; tag?: string }
  ) =>
    apiClient.get<Talk[]>(`/conferences/${conferenceId}/talks`, {
      params: filters,
    }),

  getById: (id: number) => apiClient.get<Talk>(`/talks/${id}`),

  getMyTalks: () => apiClient.get<Talk[]>('/my/talks'),
  getMyTalk: (id: number) => apiClient.get<Talk>(`/my/talks/${id}`),
  
  createTalk: (data: {
    sectionId: number;
    title: string;
    supervisor: string;
    abstract: string;
    tags: string[];
  }) => apiClient.post<Talk>('/talks', data),

  updateTalk: (
    id: number,
    data: {
      sectionId?: number;
      title?: string;
      supervisor?: string;
      abstract?: string;
      tags?: string[];
    }
  ) => apiClient.patch<Talk>(`/my/talks/${id}`, data),

  uploadDocument: (talkId: number, file: File, onProgress?: (p: number) => void) =>
    apiClient.upload<Document>(`/talks/${talkId}/document`, file, onProgress),

  validateTalk: (talkId: number) =>
    apiClient.post<AIValidationResult>(`/talks/${talkId}/validate`),

  getAIResult: (talkId: number) =>
    apiClient.get<AIValidationResult>(`/talks/${talkId}/ai-result`),

  getJuryTalk: (id: number) => apiClient.get<Talk>(`/jury/talks/${id}`),
  downloadDocument: (id: number) =>
    apiClient.get(`/jury/talks/${id}/document`, { responseType: 'blob' }),
  
  reviewTalk: (
    id: number,
    data: {
      status: 'approved' | 'rejected' | 'needs_revision';
      roomId?: number;
      startTime?: string;
      endTime?: string;
      juryComment?: string;
    }
  ) => apiClient.patch<Talk>(`/jury/talks/${id}/review`, data),
};