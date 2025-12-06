"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Flame, Info, Coffee } from "lucide-react";

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-timmys-white border-t-2 border-timmys-red/30 shadow-lg"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        paddingTop: "8px",
      }}
    >
      <div className="flex justify-around items-center max-w-[520px] mx-auto px-4">
        <Link
          href="/blazery"
          className={cn(
            "flex items-center justify-center p-3 transition-colors rounded-lg",
            pathname === "/blazery"
              ? "text-timmys-red bg-timmys-red/10"
              : "text-gray-700 hover:text-timmys-red hover:bg-timmys-red/5"
          )}
          aria-label="Blazery"
        >
          <Flame className="w-6 h-6" />
        </Link>

        <Link
          href="/"
          className={cn(
            "flex items-center justify-center p-3 transition-colors rounded-lg",
            pathname === "/"
              ? "text-timmys-red bg-timmys-red/10"
              : "text-gray-700 hover:text-timmys-red hover:bg-timmys-red/5"
          )}
          aria-label="Home"
        >
          <Coffee className="w-6 h-6" />
        </Link>

        <Link
          href="/about"
          className={cn(
            "flex items-center justify-center p-3 transition-colors rounded-lg",
            pathname === "/about"
              ? "text-timmys-red bg-timmys-red/10"
              : "text-gray-700 hover:text-timmys-red hover:bg-timmys-red/5"
          )}
          aria-label="About"
        >
          <Info className="w-6 h-6" />
        </Link>
      </div>
    </nav>
  );
}
