// Turns a pasted URL and/or raw text into the best available plain-text listing
// content for extraction. Job postings show up in very different shapes — LinkedIn,
// Finn.no, and ATS platforms (Greenhouse, Lever, Workday, etc.) all structure their
// pages differently — so this pulls out whatever structured signal is available
// (JSON-LD JobPosting data, OpenGraph/meta tags) ahead of the raw visible text,
// since those survive noisy/auth-walled pages better than freeform body text.

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "—",
  "&ndash;": "–",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
};

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&apos;|&nbsp;|&mdash;|&ndash;|&rsquo;|&lsquo;|&rdquo;|&ldquo;/g, (m) => HTML_ENTITIES[m] ?? m);
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();
}

function extractJobPostingJsonLd(html: string): string | null {
  const blocks: unknown[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const parsed = JSON.parse(match[1].trim());
      for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
        const candidates = Array.isArray(entry?.["@graph"]) ? entry["@graph"] : [entry];
        for (const c of candidates) {
          const type = c?.["@type"];
          const types = Array.isArray(type) ? type : [type];
          if (types.some((t: unknown) => typeof t === "string" && t.toLowerCase() === "jobposting")) {
            blocks.push(c);
          }
        }
      }
    } catch {
      // not valid/parseable JSON-LD — skip this block
    }
  }
  return blocks.length ? JSON.stringify(blocks, null, 2) : null;
}

function extractMetaTags(html: string): string | null {
  const wanted = ["og:title", "og:description", "og:site_name", "description"];
  const lines: string[] = [];
  const re = /<meta\s+[^>]*(?:property|name)=["']([^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const [, key, content] = match;
    if (wanted.includes(key.toLowerCase()) && content.trim()) {
      lines.push(`${key}: ${decodeEntities(content.trim())}`);
    }
  }
  return lines.length ? lines.join("\n") : null;
}

function stripNonContentTags(html: string): string {
  return html.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
}

const MAX_BODY_CHARS = 30000;

export async function buildPageContent(rawInput: string, sourceUrl?: string): Promise<string> {
  if (!sourceUrl) return rawInput;

  let html: string;
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    html = await res.text();
  } catch {
    return rawInput;
  }

  const sections = [rawInput];

  const jsonLd = extractJobPostingJsonLd(html);
  if (jsonLd) sections.push(`STRUCTURED JOB DATA (JSON-LD):\n${jsonLd.slice(0, 15000)}`);

  const meta = extractMetaTags(html);
  if (meta) sections.push(`PAGE META TAGS:\n${meta}`);

  const bodyText = stripTags(stripNonContentTags(html)).slice(0, MAX_BODY_CHARS);
  if (bodyText) sections.push(`PAGE TEXT:\n${bodyText}`);

  return sections.filter(Boolean).join("\n\n");
}
