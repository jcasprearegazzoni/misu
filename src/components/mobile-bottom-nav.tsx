"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  resolveActiveBottomNavIndex,
  type MobileBottomNavItem,
} from "@/lib/navigation/mobile-bottom-nav";

type MobileBottomNavProps = {
  items: MobileBottomNavItem[];
  ariaLabel: string;
};

export type { MobileBottomNavItem };

export function MobileBottomNav({ items, ariaLabel }: MobileBottomNavProps) {
  const pathname = usePathname();
  const activeIndex = resolveActiveBottomNavIndex(pathname, items);

  return (
    <nav
      aria-label={ariaLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      style={{
        background: "var(--nav-bg)",
        borderColor: "var(--border)",
        backdropFilter: "blur(16px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        className="mx-auto grid w-full max-w-6xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item, itemIndex) => {
          const isActive = itemIndex === activeIndex;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex flex-col items-center justify-center gap-0.5 py-2 transition-colors"
              style={{
                color: isActive ? "var(--misu)" : "var(--muted)",
                minHeight: "52px",
              }}
            >
              <span className="flex h-6 w-6 items-center justify-center" aria-hidden="true">
                {isActive ? item.iconActive : item.iconInactive}
              </span>
              <span
                className="leading-none"
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
