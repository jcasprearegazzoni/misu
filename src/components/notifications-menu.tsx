"use client";

import { useRef } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatUserDate } from "@/lib/format/date";

type NotificationRow = {
  id: number;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

type NotificationsMenuProps = {
  unreadCount: number;
  notifications: NotificationRow[];
  bellIcon: ReactNode;
  markAllAction: () => Promise<void>;
  markOneAction: (formData: FormData) => Promise<void>;
};

export function NotificationsMenu({
  unreadCount,
  notifications,
  bellIcon,
  markAllAction,
  markOneAction,
}: NotificationsMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  return (
    <details ref={detailsRef} className="relative">
      {/* Botón campana */}
      <summary
        className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg transition"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        }}
      >
        {bellIcon}
        {unreadCount > 0 ? (
          <span
            className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ background: "var(--misu)" }}
          >
            {unreadCount}
          </span>
        ) : null}
      </summary>

      {/* Backdrop mobile */}
      <button
        type="button"
        aria-label="Cerrar notificaciones"
        onClick={closeMenu}
        className="fixed inset-0 z-40 md:hidden"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />

      {/* Panel notificaciones */}
      <div
        className="fixed inset-x-2 top-14 z-50 max-h-[75vh] overflow-y-auto rounded-xl p-3 shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-12 md:w-80"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border-hover)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
        }}
      >
        {/* Header del panel */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Notificaciones
          </p>
          {unreadCount > 0 ? (
            <form action={markAllAction} onSubmit={closeMenu}>
              <button
                className="text-xs font-medium transition"
                style={{ color: "var(--misu)" }}
              >
                Limpiar todas
              </button>
            </form>
          ) : null}
        </div>

        {/* Lista */}
        {notifications.length === 0 ? (
          <div
            className="rounded-lg px-3 py-4 text-center text-xs"
            style={{
              background: "var(--surface-3)",
              color: "var(--muted)",
            }}
          >
            Sin notificaciones nuevas
          </div>
        ) : (
          <ul className="grid gap-2">
            {notifications.map((notification) => {
              const isRead = Boolean(notification.read_at);

              if (!isRead) {
                return (
                  <li key={notification.id}>
                    <form action={markOneAction} onSubmit={closeMenu}>
                      <input type="hidden" name="notification_id" value={notification.id} />
                      <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2.5 text-left transition"
                        style={{
                          background: "var(--misu-subtle)",
                          border: "1px solid var(--border-misu)",
                        }}
                      >
                        <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                          {notification.title}
                        </p>
                        <p
                          className="mt-1 line-clamp-2 text-xs leading-relaxed"
                          style={{ color: "var(--muted)" }}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-1.5 text-[11px]" style={{ color: "var(--misu)" }}>
                          {formatUserDate(notification.created_at)} · No leída
                        </p>
                      </button>
                    </form>
                  </li>
                );
              }

              return (
                <li
                  key={notification.id}
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    background: "var(--surface-3)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                    {notification.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--muted-2)" }}>
                    {notification.message}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--muted-2)" }}>
                    {formatUserDate(notification.created_at)} · Leída
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/dashboard/notificaciones"
          onClick={closeMenu}
          className="mt-3 block rounded-lg px-3 py-2 text-center text-xs font-medium transition"
          style={{
            background: "var(--surface-3)",
            border: "1px solid var(--border)",
            color: "var(--muted)",
          }}
        >
          Ver todas
        </Link>
      </div>
    </details>
  );
}
