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
      <summary
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg transition"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        }}
      >
        {menuIcon}
      </summary>

      {/* Backdrop mobile */}
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={closeMenu}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />

      {/* Menú desplegable */}
      <div
        className="absolute left-0 top-12 z-50 w-52 rounded-xl p-2 shadow-xl"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-hover)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        }}
      >
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={closeMenu}
            className="btn-ghost w-full justify-start rounded-lg text-sm"
            style={{ padding: "0.55rem 0.75rem" }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
