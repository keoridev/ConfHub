import type { Talk } from "~entities/talk/model/types";
import type { AdminStats } from "../../model/types";
import { StatsGrid } from "./StatsGrid";
import { QuickNavGrid } from "./QuickNavGrid";
import { AllTalksTable } from "./AllTalksTable";

interface OverviewTabProps {
  stats: AdminStats;
  talks: Talk[];
  loading: boolean;
}

export function OverviewTab({ stats, talks, loading }: OverviewTabProps) {
  return (
    <>
      <StatsGrid stats={stats} />
      <QuickNavGrid />
      <AllTalksTable talks={talks} loading={loading} />
    </>
  );
}
