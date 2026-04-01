"use client";

import { useRef } from "react";
import Link from "next/link";

type UserMenuProps = {
  displayName: string;
  profileHref: string;
  signOutAction: () => Promise<void>;
};

export function UserMenu({ displayName, profileHref, signOutAction }: UserMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details ref={detailsRef} className="relative">
      {/* Botón trigger */}
      <summary
        className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        }}
      >
        {/* Avatar inicial */}
        <span
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "var(--misu-subtle)",
            border: "1px solid var(--border-misu)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--misu)",
            flexShrink: 0,
          }}
        >
          {displayName[0]?.toUpperCase()}
        </span>
        {displayName}
      </summary>

      {/* Dropdown */}
      <div
        className="absolute right-0 top-12 z-30 w-48 rounded-xl p-1.5 shadow-xl"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-hover)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
        }}
      >
        <Link
          href={profileHref}
          onClick={closeMenu}
          className="btn-ghost w-full justify-start rounded-lg text-sm"
          style={{ padding: "0.5rem 0.75rem" }}
        >
          Mi perfil
        </Link>
        <form action={signOutAction}>
          <button
            onClick={closeMenu}
            className="btn-ghost w-full justify-start rounded-lg text-sm"
            style={{ padding: "0.5rem 0.75rem", color: "var(--error)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#fca5a5";
              (e.currentTarget as HTMLElement).style.background = "var(--error-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--error)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </details>
  );
}
