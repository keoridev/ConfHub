import type { ReactNode } from "react";

export type Tab = "overview" | "sections" | "rooms" | "schedule";

export interface TabConfig {
  key: Tab;
  label: string;
  icon: ReactNode;
}

export interface SectionFormState {
  open: boolean;
  mode: "create" | "edit";
  id?: number;
  title: string;
  sortOrder: string;
  supervisor?: string;
}

export interface RoomFormState {
  open: boolean;
  mode: "create" | "edit";
  id?: number;
  name: string;
}

export interface AdminStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  needsRevision: number;
  rate: string;
}
