"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/", label: "Pipeline" },
  { href: "/analytics", label: "Analytics" },
  { href: "/offers", label: "Offers" },
  { href: "/profile", label: "Profile" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0a0912]/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg gradient-orb stage-interview" />
            <span className="font-semibold tracking-tight">Pipeline</span>
          </div>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? "bg-white/10 text-white" : "text-secondary hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={logout}
          className="text-sm text-secondary hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
