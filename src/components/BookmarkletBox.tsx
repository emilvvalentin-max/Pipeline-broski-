"use client";

import { useEffect, useState } from "react";

export default function BookmarkletBox() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const origin = window.location.origin;
    const code = `(function(){window.open('${origin}/new?url='+encodeURIComponent(location.href),'_blank');})();`;
    setHref(`javascript:${encodeURIComponent(code)}`);
  }, []);

  if (!href) return null;

  return (
    <div className="glass-card p-5 space-y-2">
      <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">Quick add from any site</h2>
      <p className="text-xs text-secondary">
        Drag this to your bookmarks bar. While viewing a job listing on Finn, LinkedIn, or anywhere else, click it to
        open this form pre-filled with that page&apos;s URL — no scraping, it just uses the page you&apos;re already
        on.
      </p>
      <a
        href={href}
        onClick={(e) => e.preventDefault()}
        draggable
        className="inline-block rounded-lg bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-medium cursor-grab active:cursor-grabbing"
      >
        + Add to Pipeline
      </a>
    </div>
  );
}
