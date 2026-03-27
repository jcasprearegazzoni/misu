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
      <summary className="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100">
        {bellIcon}
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </summary>
      <button
        type="button"
        aria-label="Cerrar notificaciones"
        onClick={closeMenu}
        className="fixed inset-0 z-40 bg-black/20 md:hidden"
      />
      <div className="fixed inset-x-2 top-14 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-zinc-300 bg-white p-3 shadow-lg md:absolute md:inset-x-auto md:right-0 md:top-12 md:z-40 md:w-80 md:max-w-[92vw] md:max-h-[75vh]">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-900">Notificaciones</p>
          {unreadCount > 0 ? (
            <form
              action={markAllAction}
              onSubmit={() => {
                closeMenu();
              }}
            >
              <button className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100">
                Limpiar todas
              </button>
            </form>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
            No tienes notificaciones.
          </p>
        ) : (
          <ul className="grid gap-2">
            {notifications.map((notification) => {
              const isRead = Boolean(notification.read_at);

              if (!isRead) {
                return (
                  <li key={notification.id}>
                    <form
                      action={markOneAction}
                      onSubmit={() => {
                        closeMenu();
                      }}
                    >
                      <input type="hidden" name="notification_id" value={notification.id} />
                      <button
                        type="submit"
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-left hover:bg-zinc-50"
                      >
                        <p className="text-xs font-semibold text-zinc-900">{notification.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-700">{notification.message}</p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {formatUserDate(notification.created_at)} - No leida
                        </p>
                      </button>
                    </form>
                  </li>
                );
              }

              return (
                <li key={notification.id} className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-900">{notification.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-700">{notification.message}</p>
                  <p className="mt-1 text-[11px] text-zinc-600">
                    {formatUserDate(notification.created_at)} - Leida
                  </p>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/dashboard/notificaciones"
          onClick={closeMenu}
          className="mt-3 inline-flex rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-100"
        >
          Ver todas
        </Link>
      </div>
    </details>
  );
}
