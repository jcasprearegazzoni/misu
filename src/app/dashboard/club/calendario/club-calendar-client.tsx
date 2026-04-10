"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClubWeekTimeline } from "@/components/club/calendar/club-week-timeline";
import type { CalendarCourt, CalendarEvent } from "./page";

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type ClubCalendarClientProps = {
  deporte: Deporte;
  fecha: string;
  view: CalendarView;
  deportesVisibles: Deporte[];
  days: string[];
  eventos: CalendarEvent[];
  canchas: CalendarCourt[];
};

export function ClubCalendarClient({
  deporte,
  fecha,
  view,
  deportesVisibles,
  days,
  eventos,
  canchas,
}: ClubCalendarClientProps) {
  const router = useRouter();

  function isCompactViewport() {
    return typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
  }

  // En mobile/tablet se fuerza vista dia para evitar la semanal.
  useEffect(() => {
    if (view !== "week") return;
    if (!isCompactViewport()) return;

    const params = new URLSearchParams();
    params.set("deporte", deporte);
    params.set("fecha", fecha);
    params.set("view", "day");
    router.replace(`/dashboard/club/calendario?${params.toString()}`);
  }, [view, router, deporte, fecha]);

  const goTo = (next: { deporte?: Deporte; fecha?: string; view?: CalendarView }) => {
    const requestedView = next.view ?? view;
    const safeView: CalendarView =
      requestedView === "week" && isCompactViewport() ? "day" : requestedView;

    const params = new URLSearchParams();
    params.set("deporte", next.deporte ?? deporte);
    params.set("fecha", next.fecha ?? fecha);
    params.set("view", safeView);
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
      canchas={canchas}
    />
  );
}
