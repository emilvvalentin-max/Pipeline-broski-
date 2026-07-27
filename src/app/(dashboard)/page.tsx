import Link from "next/link";
import { db } from "@/lib/db";
import PipelineBoard from "@/components/PipelineBoard";
import Greeting from "@/components/Greeting";
import type { ApplicationJSON } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const applications = await db.application.findMany({ orderBy: { updatedAt: "desc" } });
  const serialized: ApplicationJSON[] = JSON.parse(JSON.stringify(applications));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Greeting />
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-secondary mt-1">Drag a card between stages as your applications move.</p>
        </div>
        <Link
          href="/new"
          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium"
        >
          + Add application
        </Link>
      </div>
      <PipelineBoard initialApplications={serialized} />
    </div>
  );
}
