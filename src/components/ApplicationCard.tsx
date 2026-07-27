"use client";

import Link from "next/link";
import type { ApplicationJSON } from "@/lib/types";
import { STAGE_CLASS, SOURCE_LABEL } from "@/lib/stages";
import { formatDate, needsFollowUp } from "@/lib/dates";

export default function ApplicationCard({
  application,
  draggable,
  onDragStart,
}: {
  application: ApplicationJSON;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const flagged = needsFollowUp(application.stage, application.updatedAt);

  return (
    <Link
      href={`/applications/${application.id}`}
      draggable={draggable}
      onDragStart={onDragStart}
      className="glass-card glass-card-hover block p-4 space-y-3 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <div className={`h-8 w-8 shrink-0 rounded-lg gradient-orb ${STAGE_CLASS[application.stage]}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{application.role || application.title}</p>
          <p className="text-xs text-secondary truncate">{application.company}</p>
        </div>
        {application.urgent && (
          <span className="shrink-0 rounded-full bg-red-500/15 text-red-400 text-[10px] font-medium px-2 py-0.5">
            Urgent
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>{SOURCE_LABEL[application.source] ?? application.source}</span>
        <span>{application.deadline ? `Due ${formatDate(application.deadline)}` : ""}</span>
      </div>

      <div className="flex items-center justify-between">
        {application.fitScore != null ? (
          <span className="text-xs font-medium text-secondary">Fit {application.fitScore}%</span>
        ) : (
          <span />
        )}
        {flagged && (
          <span className="rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium px-2 py-0.5">
            Follow up
          </span>
        )}
      </div>
    </Link>
  );
}
