import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/server";

const EARLYCAREERS_API = "https://earlycareers.fabifont.dev/api";

interface EarlyCareersJob {
  link: string;
  title: string;
  location: string;
  company: string;
  description: string | null;
  employment_type: string | null;
  seniority_level: string | null;
  job_function: string | null;
  industries: string | null;
}

const ACCOMMODATION_KEYWORDS = [
  "accommodation",
  "housing provided",
  "housing allowance",
  "housing support",
  "housing assistance",
  "relocation package",
  "relocation assistance",
  "dormitory",
  "dorm room",
  "free housing",
  "provided housing",
];

const NEGATIVE_ACCOMMODATION_PHRASES = [
  "responsible for their own accommodation",
  "responsible for your own accommodation",
  "responsible for own accommodation",
  "arrange their own accommodation",
  "arrange your own accommodation",
  "arrange own accommodation",
  "own accommodation",
  "own housing",
];

const DEADLINE_MARKER = /(?:application deadline|apply by|closing date|applications close)[:\s]+([A-Za-z0-9,./\- ]{4,30})/i;
const NEGATION_RE = /\b(no|not|n't|without|excludes?|excluding)\b/;

function hintAccommodation(description: string | null): boolean | null {
  if (!description) return null;
  const text = description.toLowerCase();
  if (NEGATIVE_ACCOMMODATION_PHRASES.some((phrase) => text.includes(phrase))) return false;
  for (const kw of ACCOMMODATION_KEYWORDS) {
    const idx = text.indexOf(kw);
    if (idx === -1) continue;
    // Negation can precede ("does not offer housing") or follow ("housing not included") the keyword.
    const window = text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + kw.length + 20));
    return NEGATION_RE.test(window) ? false : true;
  }
  return null;
}

function hintDeadline(description: string | null): string | null {
  if (!description) return null;
  const match = description.match(DEADLINE_MARKER);
  return match ? match[1].trim().replace(/[.\s]+$/, "") : null;
}

const UPSTREAM_ATTEMPTS = 3;
const UPSTREAM_RETRY_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The upstream API (a third-party free-tier service) intermittently throws transient
// 500s under normal load — retrying a couple of times clears most of them up.
async function fetchUpstream(url: URL): Promise<EarlyCareersJob[]> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= UPSTREAM_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt < UPSTREAM_ATTEMPTS) await sleep(UPSTREAM_RETRY_DELAY_MS * attempt);
    }
  }
  throw lastError;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const title = params.get("title")?.trim() ?? "";
  const location = params.get("location")?.trim() ?? "";
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  const upstream = new URL(`${EARLYCAREERS_API}/jobs/advanced`);
  upstream.searchParams.set("page", String(page));
  upstream.searchParams.set("limit", "20");
  if (title) upstream.searchParams.set("title", title);
  if (location) upstream.searchParams.set("location", location);

  let jobs: EarlyCareersJob[];
  try {
    jobs = await fetchUpstream(upstream);
  } catch {
    return NextResponse.json({ error: "Could not reach the internships source right now" }, { status: 502 });
  }

  const results = jobs.map((job) => ({
    ...job,
    hintDeadline: hintDeadline(job.description),
    hintAccommodation: hintAccommodation(job.description),
  }));

  return NextResponse.json({ jobs: results, page });
}
