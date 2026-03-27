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
      <summary className="flex h-9 cursor-pointer list-none items-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100">
        {displayName}
      </summary>
      <div className="absolute right-0 top-12 z-30 w-44 rounded-lg border border-zinc-300 bg-white p-2 shadow-lg">
        <div className="grid gap-1">
          <Link
            href={profileHref}
            onClick={closeMenu}
            className="rounded-md px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Mi perfil
          </Link>
          <form action={signOutAction}>
            <button
              onClick={closeMenu}
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-100"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
