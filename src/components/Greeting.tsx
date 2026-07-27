"use client";

import { useEffect, useState } from "react";
import { getGreeting } from "@/lib/greeting";

export default function Greeting() {
  const [greeting, setGreeting] = useState<string | null>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  if (!greeting) return null;

  return <p className="text-sm text-secondary mb-1">{greeting}</p>;
}
