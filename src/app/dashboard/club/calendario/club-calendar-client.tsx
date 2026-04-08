"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClubWeekTimeline } from "@/components/club/calendar/club-week-timeline";
import type { CalendarEvent } from "./page";

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type ClubCalendarClientProps = {
  deporte: Deporte;
  fecha: string;
  view: CalendarView;
  deportesVisibles: Deporte[];
  days: string[];
  eventos: CalendarEvent[];
};

export function ClubCalendarClient({
  deporte,
  fecha,
  view,
  deportesVisibles,
  days,
  eventos,
}: ClubCalendarClientProps) {
  const router = useRouter();

  // En móviles, cambiar automáticamente a vista día
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (view !== "week") return;
    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const params = new URLSearchParams();
    params.set("deporte", deporte);
    params.set("fecha", fecha);
    params.set("view", "day");
    router.replace(`/dashboard/club/calendario?${params.toString()}`);
  }, [view, router, deporte, fecha]);

  const goTo = (next: { deporte?: Deporte; fecha?: string; view?: CalendarView }) => {
    const params = new URLSearchParams();
    params.set("deporte", next.deporte ?? deporte);
    params.set("fecha", next.fecha ?? fecha);
    params.set("view", next.view ?? view);
    router.push(`/dashboard/club/calendario?${params.toString()}`);
  };

  return (
    <ClubWeekTimeline
      events={eventos}
      days={days}
      view={view}
      deporte={deporte}
      deportesVisibles={deportesVisibles}
      fecha={fecha}
      onGoTo={goTo}
    />
  );
}
