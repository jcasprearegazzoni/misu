"use client";

import { useRef } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
};

type MobileNavMenuProps = {
  links: NavItem[];
  menuIcon: ReactNode;
};

export function MobileNavMenu({ links, menuIcon }: MobileNavMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details ref={detailsRef} className="relative md:hidden">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100">
        {menuIcon}
      </summary>
      <div className="absolute left-0 top-12 z-30 w-52 rounded-lg border border-zinc-300 bg-white p-2 shadow-lg">
        <div className="grid gap-1">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMenu}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
