"use client";

import { useMemo, useState } from "react";
import type { ApplicationJSON } from "@/lib/types";
import { STAGE_ORDER, STAGE_LABEL, STAGE_CLASS } from "@/lib/stages";
import ApplicationCard from "./ApplicationCard";
import type { Stage } from "@/generated/prisma/client";

export default function PipelineBoard({ initialApplications }: { initialApplications: ApplicationJSON[] }) {
  const [applications, setApplications] = useState(initialApplications);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);

  const columns = useMemo(() => {
    const grouped: Record<Stage, ApplicationJSON[]> = {
      researching: [],
      applied: [],
      interview: [],
      offer: [],
      rejected: [],
    };
    for (const app of applications) grouped[app.stage].push(app);
    return grouped;
  }, [applications]);

  async function moveApplication(id: string, stage: Stage) {
    const prev = applications;
    setApplications((cur) => cur.map((a) => (a.id === id ? { ...a, stage } : a)));
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) setApplications(prev);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {STAGE_ORDER.map((stage) => (
        <div
          key={stage}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStage(stage);
          }}
          onDragLeave={() => setDragOverStage((s) => (s === stage ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData("text/plain");
            if (id) moveApplication(id, stage);
            setDragOverStage(null);
          }}
          className={`rounded-2xl p-2 space-y-3 min-h-[200px] transition-colors ${
            dragOverStage === stage ? "bg-white/5" : ""
          }`}
        >
          <div className="flex items-center gap-2 px-2 py-1">
            <span className={`h-2 w-2 rounded-full gradient-orb ${STAGE_CLASS[stage]}`} />
            <h2 className="text-sm font-medium">{STAGE_LABEL[stage]}</h2>
            <span className="text-xs text-muted ml-auto">{columns[stage].length}</span>
          </div>
          <div className="space-y-3">
            {columns[stage].map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", app.id)}
              />
            ))}
            {columns[stage].length === 0 && (
              <div className="text-xs text-muted px-2 py-6 text-center border border-dashed border-white/10 rounded-xl">
                Nothing here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
