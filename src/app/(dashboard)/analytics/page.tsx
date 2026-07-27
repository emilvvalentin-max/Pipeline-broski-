import { computeAnalytics } from "@/lib/analytics";
import StatTile from "@/components/StatTile";
import StageBarChart from "@/components/StageBarChart";
import RejectionPatterns from "@/components/RejectionPatterns";

export const dynamic = "force-dynamic";

function pct(n: number | null) {
  return n == null ? "—" : `${Math.round(n * 100)}%`;
}

function days(n: number | null) {
  return n == null ? "—" : `${n.toFixed(1)}d`;
}

export default async function AnalyticsPage() {
  const summary = await computeAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-secondary mt-1">Based on {summary.totalApplications} applications tracked.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Response rate" value={pct(summary.responseRate)} sub="of applied" />
        <StatTile label="Interview conversion" value={pct(summary.interviewConversionRate)} sub="of applied" />
        <StatTile label="Avg. time to response" value={days(summary.avgResponseDays)} />
        <StatTile label="Rejected" value={String(summary.rejectedCount)} />
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Pipeline by stage</h2>
        <StageBarChart stageCounts={summary.stageCounts} />
      </div>

      <RejectionPatterns />
    </div>
  );
}
