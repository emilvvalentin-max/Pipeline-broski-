import type { Stage, Source, DocumentType } from "@/generated/prisma/client";

// Shape of an Application row after it has round-tripped through JSON (dates become strings).
export interface ApplicationJSON {
  id: string;
  title: string;
  company: string;
  role: string;
  sourceUrl: string | null;
  source: Source;
  stage: Stage;
  deadline: string | null;
  appliedAt: string | null;
  fitScore: number | null;
  urgent: boolean;
  rawListing: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewLogJSON {
  id: string;
  applicationId: string;
  date: string;
  round: string;
  interviewerNames: string | null;
  questionsAsked: string | null;
  howItWent: string | null;
  outcome: string | null;
  createdAt: string;
}

export interface CompanyNoteJSON {
  id: string;
  applicationId: string;
  culture: string | null;
  recentNews: string | null;
  whyThisCompany: string | null;
  updatedAt: string;
}

export interface NetworkingContactJSON {
  id: string;
  applicationId: string;
  contactName: string;
  relationship: string | null;
  warmOrCold: string;
  hasReachedOut: boolean;
  notes: string | null;
  createdAt: string;
}

export interface DocumentVersionJSON {
  id: string;
  applicationId: string;
  type: DocumentType;
  versionNumber: number;
  content: string;
  createdAt: string;
}

export interface OfferJSON {
  id: string;
  applicationId: string;
  compensation: string | null;
  benefits: string | null;
  location: string | null;
  growthNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationDetailJSON extends ApplicationJSON {
  interviewLogs: InterviewLogJSON[];
  companyNotes: CompanyNoteJSON | null;
  networkingContacts: NetworkingContactJSON[];
  documentVersions: DocumentVersionJSON[];
  offer: OfferJSON | null;
}
