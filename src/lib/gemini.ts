import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

export interface ExtractedListing {
  title: string;
  company: string;
  role: string;
  deadline: string | null;
  description: string;
  location: string | null;
  accommodationProvided: boolean | null;
}

export async function extractListing(rawInput: string): Promise<ExtractedListing> {
  const ai = client();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Extract the job listing fields from the following content. It may come in several formats — pasted freeform text, a "STRUCTURED JOB DATA (JSON-LD)" block, "PAGE META TAGS", and/or raw page text — mixed in any combination depending on the source site. When a structured block and the raw page text disagree, trust the structured block. If a field truly cannot be determined from any of them, use null (or an empty string for description).\n\n---\n${rawInput.slice(0, 40000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Full role/listing title, e.g. 'SEB Norway - Corporate Finance Internship 2027'" },
          company: { type: Type.STRING, description: "Short company name, e.g. 'SEB'" },
          role: { type: Type.STRING, description: "Short role name, e.g. 'Corporate Finance Intern'" },
          deadline: { type: Type.STRING, nullable: true, description: "Application deadline as an ISO date (YYYY-MM-DD) if a specific date is stated, otherwise null" },
          description: { type: Type.STRING, description: "Concise summary of the role and requirements, a few sentences" },
          location: { type: Type.STRING, nullable: true, description: "City/country the role is based in, e.g. 'Oslo, Norway', otherwise null" },
          accommodationProvided: { type: Type.BOOLEAN, nullable: true, description: "True if the listing states housing/accommodation/relocation support is provided, false if it explicitly says it is not, null if unmentioned" },
        },
        required: ["title", "company", "role", "description"],
      },
    },
  });
  return JSON.parse(res.text ?? "{}");
}

export interface FitResult {
  fitScore: number;
  rationale: string;
}

export async function computeFitScore(resumeText: string, listingDescription: string): Promise<FitResult> {
  const ai = client();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Given this candidate's background and this job listing, score how strong a fit the candidate is on a 0-100 scale, and give a short rationale (2-3 sentences).\n\nCANDIDATE BACKGROUND:\n${resumeText.slice(0, 10000)}\n\nJOB LISTING:\n${listingDescription.slice(0, 8000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          fitScore: { type: Type.INTEGER, description: "0-100 fit score" },
          rationale: { type: Type.STRING },
        },
        required: ["fitScore", "rationale"],
      },
    },
  });
  return JSON.parse(res.text ?? "{}");
}

export interface DraftDocuments {
  cv: string;
  coverLetter: string;
}

export async function draftDocuments(
  resumeText: string,
  listingDescription: string,
  companyName: string
): Promise<DraftDocuments> {
  const ai = client();
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Using the candidate's base resume below, produce two tailored documents in Markdown for this specific job listing at ${companyName}:\n1. A tailored CV/resume (reorganize and emphasize the most relevant experience for this role, do not fabricate experience that isn't in the base resume).\n2. A concise, specific cover letter (3-4 short paragraphs) explaining why this candidate is a good fit for this role at this company.\n\nBASE RESUME:\n${resumeText.slice(0, 10000)}\n\nJOB LISTING:\n${listingDescription.slice(0, 8000)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cv: { type: Type.STRING, description: "Tailored CV in Markdown" },
          coverLetter: { type: Type.STRING, description: "Tailored cover letter in Markdown" },
        },
        required: ["cv", "coverLetter"],
      },
    },
  });
  return JSON.parse(res.text ?? "{}");
}

export async function summarizeRejectionPatterns(
  entries: { company: string; howItWent: string | null; outcome: string | null }[]
): Promise<string> {
  const ai = client();
  const listText = entries
    .map((e, i) => `${i + 1}. ${e.company} — outcome: ${e.outcome ?? "unknown"} — notes: ${e.howItWent ?? "none"}`)
    .join("\n");
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: `Here are interview notes/outcomes from rejected job applications. Identify any recurring patterns in why the candidate was rejected (e.g. a specific interview stage, skill gap, or theme that keeps coming up). If there isn't enough data to see a pattern, say so plainly. Keep it to 3-5 sentences.\n\n${listText}`,
    config: {},
  });
  return res.text ?? "";
}
