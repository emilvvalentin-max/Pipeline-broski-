import { STAGE_ORDER, STAGE_LABEL, STAGE_CHART_COLOR } from "@/lib/stages";
import type { Stage } from "@/generated/prisma/client";

export default function StageBarChart({ stageCounts }: { stageCounts: Record<Stage, number> }) {
  const max = Math.max(1, ...STAGE_ORDER.map((s) => stageCounts[s]));

  return (
    <div className="space-y-3">
      {STAGE_ORDER.map((stage) => {
        const count = stageCounts[stage];
        const widthPct = (count / max) * 100;
        return (
          <div key={stage} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-secondary">{STAGE_LABEL[stage]}</span>
            <div className="flex-1 h-4 flex items-center">
              <div
                className="h-[10px] rounded-r-[4px]"
                style={{
                  width: `${Math.max(widthPct, count > 0 ? 3 : 0)}%`,
                  backgroundColor: STAGE_CHART_COLOR[stage],
                }}
              />
            </div>
            <span className="w-6 shrink-0 text-xs text-secondary text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
