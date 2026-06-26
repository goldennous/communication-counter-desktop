"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/counter", label: "Счётчик" },
  { href: "/history", label: "История" },
];

export default function TabNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1.5">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-5 py-2 max-sm:px-3 max-[400px]:px-2 max-[300px]:px-1.5 max-[300px]:text-[10px] max-[400px]:py-1.5 max-[300px]:py-1 text-sm font-medium rounded-xl transition-all duration-200 ${
              active
                ? "bg-primary/15 text-primary shadow-sm"
                : "text-muted-foreground/70 hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
