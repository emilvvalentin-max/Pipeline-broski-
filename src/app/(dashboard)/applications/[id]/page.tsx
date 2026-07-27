import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ApplicationDetail from "@/components/detail/ApplicationDetail";
import type { ApplicationDetailJSON } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await db.application.findUnique({
    where: { id },
    include: {
      interviewLogs: { orderBy: { date: "asc" } },
      companyNotes: true,
      networkingContacts: { orderBy: { createdAt: "asc" } },
      documentVersions: { orderBy: { versionNumber: "desc" } },
      offer: true,
    },
  });

  if (!application) notFound();

  const serialized: ApplicationDetailJSON = JSON.parse(JSON.stringify(application));

  return <ApplicationDetail application={serialized} />;
}
