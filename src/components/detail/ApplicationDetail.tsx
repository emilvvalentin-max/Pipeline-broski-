"use client";

import Link from "next/link";
import type { ApplicationDetailJSON } from "@/lib/types";
import HeaderPanel from "./HeaderPanel";
import DocumentsPanel from "./DocumentsPanel";
import InterviewsPanel from "./InterviewsPanel";
import CompanyNetworkPanel from "./CompanyNetworkPanel";
import OfferPanel from "./OfferPanel";

export default function ApplicationDetail({ application }: { application: ApplicationDetailJSON }) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/" className="text-xs text-secondary hover:text-white">
        ← Back to pipeline
      </Link>
      <HeaderPanel application={application} />
      <DocumentsPanel applicationId={application.id} documentVersions={application.documentVersions} />
      <InterviewsPanel applicationId={application.id} interviewLogs={application.interviewLogs} />
      <CompanyNetworkPanel
        applicationId={application.id}
        companyNotes={application.companyNotes}
        networkingContacts={application.networkingContacts}
      />
      {(application.stage === "offer" || application.offer) && (
        <OfferPanel applicationId={application.id} offer={application.offer} />
      )}
    </div>
  );
}
