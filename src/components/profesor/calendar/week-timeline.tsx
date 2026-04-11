"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CALENDAR_END_HOUR,
  CALENDAR_START_HOUR,
  formatHourLabel,
  getBookingPosition,
  getHourTicks,
  getTimelineStartMinute,
  parseTimeToMinutes,
  PIXELS_PER_MINUTE,
} from "./time-utils";
import {
  buildEndOptionsForDateAndStart,
  buildStartOptionsForDate,
  getOneHourLaterOrNextAvailable,
} from "./time-options";
import { CalendarBookingItem } from "./types";
import { BookingDetailContent } from "./booking-detail-content";
import { groupDayBookingsBySlot } from "./slot-groups";

type TimelineAvailabilityRange = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
};

type WeekTimelineProps = {
  deportes: Array<{
    key: "tenis" | "padel";
    label: string;
    href: string;
  }>;
  deporteActivo: "tenis" | "padel" | null;
  days: Array<{
    date: string;
    items: CalendarBookingItem[];
  }>;
  availability: TimelineAvailabilityRange[];
  blockedRanges: Array<{
    start_at: string;
    end_at: string;
  }>;
  view: "week" | "day";
  selectedDay: string;
  dayLinks: Array<{ date: string; href: string }>;
  weekPrevHref: string;
  weekTodayHref: string;
  weekNextHref: string;
  dayPrevHref: string;
  dayTodayHref: string;
  dayNextHref: string;
};

type CalendarCell = {
  key: string;
  date: string;
  start_time: string;
  end_time: string;
  top: number;
  height: number;
  state: "available" | "blocked" | "occupied";
  slot: ReturnType<typeof groupDayBookingsBySlot>[number] | null;
};

function getDayOfWeekFromIsoDate(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).getDay();
}

function hhmmToTimeValue(value: string) {
  return `${value.slice(0, 5)}:00`;
}

function minutesToTimeValue(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function normalizeSlotKey(date: string, startTime: string, endTime: string) {
  return `${date}|${startTime.slice(0, 5)}|${endTime.slice(0, 5)}`;
}

function formatMonthLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getTodayIsoArg() {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function formatDayChip(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day,
  };
}

function formatDateShort(dateIso: string) {
  const [year = "", month = "", day = ""] = dateIso.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}/${month}/${year.slice(-2)}`;
}

function formatDateIsoFromDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getWeekOffsetFromToday(targetDateIso: string) {
  const todayIso = getTodayIsoArg();
  const today = new Date(`${todayIso}T00:00:00-03:00`);
  const target = new Date(`${targetDateIso}T00:00:00-03:00`);

  const getMonday = (date: Date) => {
    const base = new Date(date);
    const day = base.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    base.setDate(base.getDate() + mondayOffset);
    base.setHours(0, 0, 0, 0);
    return base;
  };

  const thisMonday = getMonday(today);
  const targetMonday = getMonday(target);
  const diffMs = targetMonday.getTime() - thisMonday.getTime();
  return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
}

function shiftMonth(monthIso: string, deltaMonths: number) {
  const base = new Date(`${monthIso}T00:00:00-03:00`);
  base.setDate(1);
  base.setMonth(base.getMonth() + deltaMonths);
  return formatDateIsoFromDate(base).slice(0, 7) + "-01";
}

function formatMonthTitle(monthIso: string) {
  const date = new Date(`${monthIso}T00:00:00-03:00`);
  const month = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  const year = new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
}

function buildMonthCells(monthIso: string) {
  const monthStart = new Date(`${monthIso}T00:00:00-03:00`);
  monthStart.setDate(1);

  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const jsDay = monthStart.getDay();
  const mondayIndex = (jsDay + 6) % 7;

  const cells: Array<string | null> = [];
  for (let i = 0; i < mondayIndex; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthStart);
    date.setDate(day);
    cells.push(formatDateIsoFromDate(date));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getOccupiedEventVisual(slot: NonNullable<CalendarCell["slot"]>) {
  if (slot.is_finalized) {
    if (slot.has_financial_pending) {
      return {
        background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
        color: "var(--warning)",
        borderLeftColor: "var(--warning)",
      };
    }

    return {
      background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
      color: "var(--success)",
      borderLeftColor: "var(--success)",
    };
  }

  if (slot.status === "pendiente") {
    return {
      background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
      color: "var(--warning)",
      borderLeftColor: "var(--warning)",
    };
  }

  if (slot.occupied_count >= slot.capacity) {
    return {
      background: "color-mix(in srgb, var(--success) 22%, var(--surface-1))",
      color: "var(--success)",
      borderLeftColor: "var(--success)",
    };
  }

  return {
    background: "color-mix(in srgb, var(--warning) 22%, var(--surface-1))",
    color: "var(--warning)",
    borderLeftColor: "var(--warning)",
  };
}

export function WeekTimeline({
  deportes,
  deporteActivo,
  days,
  availability,
  blockedRanges,
  view,
  selectedDay,
  dayLinks,
  weekPrevHref,
  weekTodayHref,
  weekNextHref,
  dayPrevHref,
  dayTodayHref,
  dayNextHref,
}: WeekTimelineProps) {
  const hourTicks = getHourTicks();
  const timelineHeight = (CALENDAR_END_HOUR * 60 - CALENDAR_START_HOUR * 60) * PIXELS_PER_MINUTE;
  const timelineStart = getTimelineStartMinute();
  const daySlots = useMemo(
    () =>
      days.map((day) => ({
        date: day.date,
        slots: groupDayBookingsBySlot(day.items),
      })),
    [days],
  );
  const flatSlots = useMemo(() => daySlots.flatMap((day) => day.slots), [daySlots]);
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null);
  const selectedSlot = flatSlots.find((slot) => slot.slot_key === selectedSlotKey) ?? null;
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedCreateSlot, setSelectedCreateSlot] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [selectedType, setSelectedType] = useState<"individual" | "dobles" | "trio" | "grupal">("individual");
  const [createDate, setCreateDate] = useState("");
  const [createStartTime, setCreateStartTime] = useState("");
  const [createEndTime, setCreateEndTime] = useState("");
  const [createFeedback, setCreateFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [isDayJumpMenuOpen, setIsDayJumpMenuOpen] = useState(false);
  const [dayJumpMonthIso, setDayJumpMonthIso] = useState(`${selectedDay.slice(0, 7)}-01`);

  const selectedItem =
    selectedSlot?.bookings.find((booking) => booking.id === selectedBookingId) ??
    selectedSlot?.bookings[0] ??
    null;
  const createStartTimeOptions = useMemo(
    () => buildStartOptionsForDate(createDate, availability),
    [createDate, availability],
  );
  const createEndTimeOptions = useMemo(
    () => buildEndOptionsForDateAndStart(createDate, createStartTime, availability),
    [createDate, createStartTime, availability],
  );
  const canConfirmCreate =
    alumnoNombre.trim().length > 1 &&
    createDate.length > 0 &&
    createStartTime.length > 0 &&
    createEndTime.length > 0 &&
    createStartTimeOptions.length > 0 &&
    createEndTimeOptions.length > 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsMobile(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const dayCells = useMemo(() => {
    return daySlots.map((day) => {
      const slotMap = new Map(
        day.slots.map((slot) => [normalizeSlotKey(day.date, slot.start_time, slot.end_time), slot]),
      );
      const dayOfWeek = getDayOfWeekFromIsoDate(day.date);
      const cells: CalendarCell[] = [];

      const dayAvailability = availability.filter((item) => item.day_of_week === dayOfWeek);
      for (const range of dayAvailability) {
        const startMinute = parseTimeToMinutes(range.start_time.slice(0, 5));
        const endMinute = parseTimeToMinutes(range.end_time.slice(0, 5));
        const slotDuration = Math.max(Number(range.slot_duration_minutes || 0), 30);

        for (
          let cursorMinute = startMinute;
          cursorMinute + slotDuration <= endMinute;
          cursorMinute += slotDuration
        ) {
          const slotStart = minutesToTimeValue(cursorMinute);
          const slotEnd = minutesToTimeValue(cursorMinute + slotDuration);
          const slotKey = normalizeSlotKey(day.date, slotStart, slotEnd);
          const slot = slotMap.get(slotKey) ?? null;
          const slotStartAt = new Date(`${day.date}T${slotStart}-03:00`);
          const slotEndAt = new Date(`${day.date}T${slotEnd}-03:00`);
          const isBlocked = blockedRanges.some((item) =>
            overlaps(slotStartAt, slotEndAt, new Date(item.start_at), new Date(item.end_at)),
          );

          const position = getBookingPosition(hhmmToTimeValue(slotStart), hhmmToTimeValue(slotEnd), {
            minHeight: 0,
          });

          cells.push({
            key: `${day.date}-${slotStart}-${slotEnd}`,
            date: day.date,
            start_time: slotStart,
            end_time: slotEnd,
            top: position.top,
            height: Math.max(position.height, 36),
            state: slot ? "occupied" : isBlocked ? "blocked" : "available",
            slot,
          });
        }
      }

      return {
        date: day.date,
        cells: cells.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      };
    });
  }, [availability, blockedRanges, daySlots]);

  const effectiveView: "week" | "day" = isMobile === null ? view : isMobile ? "day" : "week";
  const todayIso = getTodayIsoArg();
  const visibleDays = effectiveView === "day" ? [selectedDay] : days.map((day) => day.date);
  const monthLabel = formatMonthLabel(visibleDays[0] ?? new Date().toISOString().slice(0, 10));
  const navControlClass =
    "btn-ghost text-sm transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--misu)]";
  const segmentControlClass =
    "rounded-md px-2 py-1 text-xs font-medium transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--misu)]";
  const sportSegmentClass = segmentControlClass;
  const gridCols = effectiveView === "day" ? "grid-cols-[58px_minmax(0,1fr)]" : "grid-cols-[58px_repeat(7,minmax(0,1fr))]";
  const prevHref = effectiveView === "week" ? weekPrevHref : dayPrevHref;
  const todayHref = effectiveView === "week" ? weekTodayHref : dayTodayHref;
  const nextHref = effectiveView === "week" ? weekNextHref : dayNextHref;
  const showSidePanel = Boolean(selectedItem || selectedCreateSlot);
  const showMobileDetailSheet = isMobile === true && Boolean(selectedItem || selectedCreateSlot);
  const baseDayHref = dayLinks.find((link) => link.date === selectedDay)?.href ?? dayLinks[0]?.href ?? "";
  const [baseDayPath, baseDayQuery] = baseDayHref.split("?");
  const dayJumpMonthTitle = useMemo(() => formatMonthTitle(dayJumpMonthIso), [dayJumpMonthIso]);
  const dayJumpMonthCells = useMemo(() => buildMonthCells(dayJumpMonthIso), [dayJumpMonthIso]);
  const weekDayHeaders = ["L", "M", "X", "J", "V", "S", "D"] as const;

  function applyCreateDate(nextDate: string) {
    setCreateDate(nextDate);
    const nextStartOptions = buildStartOptionsForDate(nextDate, availability);
    const nextStart = nextStartOptions[0]?.value ?? "";
    setCreateStartTime(nextStart);
    const nextEndOptions = buildEndOptionsForDateAndStart(nextDate, nextStart, availability);
    setCreateEndTime(getOneHourLaterOrNextAvailable(nextStart, nextEndOptions));
  }

  function closeMobileDetailSheet() {
    setSelectedSlotKey(null);
    setSelectedBookingId(null);
    setSelectedCreateSlot(null);
    setCreateFeedback(null);
  }

  function buildDayJumpHref(nextDateIso: string) {
    const params = new URLSearchParams(baseDayQuery ?? "");
    params.set("view", "day");
    params.set("day", nextDateIso);
    params.set("weekOffset", String(getWeekOffsetFromToday(nextDateIso)));
    return `${baseDayPath || "/dashboard/profesor/calendario"}?${params.toString()}`;
  }

  return (
    <section className="mt-6">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 px-2.5 sm:px-3">
        {deportes.length > 1 ? (
          <div
            className="inline-flex items-center rounded-lg border p-1"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            {deportes.map((deporte) => (
              <Link
                key={deporte.key}
                href={deporte.href}
                className={sportSegmentClass}
                style={
                  deporte.key === deporteActivo
                    ? { background: "var(--misu)", color: "#fff" }
                    : { background: "transparent", color: "var(--muted)" }
                }
              >
                {deporte.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <p className="mr-1 text-2xl font-bold leading-none sm:text-3xl" style={{ color: "var(--foreground)" }}>
            {monthLabel}
          </p>
          <Link
            href={prevHref}
            className={navControlClass}
            aria-label="Semana anterior"
          >
            {"<"}
          </Link>
          <Link
            href={todayHref}
            className={navControlClass}
            aria-label="Ir al dia actual"
          >
            Hoy
          </Link>
          <Link
            href={nextHref}
            className={navControlClass}
            aria-label="Semana siguiente"
          >
            {">"}
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden p-2.5 pt-1 sm:p-3 sm:pt-1.5">
        <div className={`${showSidePanel ? "grid gap-3 lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
        <div>
          <div className={`grid ${gridCols} gap-2`}>
            <div />
            {visibleDays.map((day) => {
              const chip = formatDayChip(day);
              const isToday = day === todayIso;
              const shouldHighlightToday = effectiveView === "week" && isToday;
              return (
                  <div
                    key={`header-${day}`}
                    className="rounded-lg border px-2 py-0.5 text-center"
                    style={{
                      borderColor: shouldHighlightToday ? "var(--misu)" : "var(--border)",
                      background: shouldHighlightToday
                        ? "color-mix(in srgb, var(--misu) 12%, var(--surface-2))"
                        : "var(--surface-2)",
                      color: "var(--foreground)",
                    }}
                  >
                    {effectiveView === "day" ? (
                      <div className="relative mx-auto max-w-[280px]">
                        <button
                          type="button"
                          className="w-full rounded-md px-2 py-1 text-[16px] font-semibold leading-5"
                          style={{ color: "var(--foreground)", background: "transparent" }}
                          aria-expanded={isDayJumpMenuOpen}
                          aria-label="Abrir selector rapido de dia"
                          onClick={() => {
                            setDayJumpMonthIso(`${selectedDay.slice(0, 7)}-01`);
                            setIsDayJumpMenuOpen((prev) => !prev);
                          }}
                        >
                          {new Intl.DateTimeFormat("es-AR", {
                            weekday: "long",
                            day: "2-digit",
                            timeZone: "America/Argentina/Buenos_Aires",
                          })
                            .format(new Date(`${day}T00:00:00-03:00`))
                            .replace(".", "")}
                        </button>
                        {isDayJumpMenuOpen ? (
                          <div
                            className="absolute left-1/2 top-full z-30 mt-1 w-[260px] -translate-x-1/2 rounded-xl border p-2 text-left shadow-lg"
                            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <button
                                type="button"
                                className="rounded-md px-2 py-1 text-xs font-semibold"
                                style={{ color: "var(--muted)", background: "var(--surface-2)" }}
                                aria-label="Mes anterior"
                                onClick={() => setDayJumpMonthIso((prev) => shiftMonth(prev, -1))}
                              >
                                {"<"}
                              </button>
                              <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                                {dayJumpMonthTitle}
                              </p>
                              <button
                                type="button"
                                className="rounded-md px-2 py-1 text-xs font-semibold"
                                style={{ color: "var(--muted)", background: "var(--surface-2)" }}
                                aria-label="Mes siguiente"
                                onClick={() => setDayJumpMonthIso((prev) => shiftMonth(prev, 1))}
                              >
                                {">"}
                              </button>
                            </div>

                            <div className="mb-1 grid grid-cols-7 gap-1">
                              {weekDayHeaders.map((dayHeader) => (
                                <p
                                  key={`weekday-${dayHeader}`}
                                  className="text-center text-[10px] font-semibold"
                                  style={{ color: "var(--muted)" }}
                                >
                                  {dayHeader}
                                </p>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {dayJumpMonthCells.map((dateIso, index) =>
                                dateIso ? (
                                  <Link
                                    key={`jump-${dateIso}`}
                                    href={buildDayJumpHref(dateIso)}
                                    className="flex h-8 items-center justify-center rounded-md text-xs font-semibold"
                                    style={{
                                      background: dateIso === selectedDay ? "var(--misu)" : "var(--surface-2)",
                                      color: dateIso === selectedDay ? "#fff" : "var(--foreground)",
                                      border:
                                        dateIso !== selectedDay && dateIso === todayIso
                                          ? "1px solid var(--misu)"
                                          : "1px solid transparent",
                                    }}
                                    onClick={() => setIsDayJumpMenuOpen(false)}
                                  >
                                    {Number(dateIso.slice(-2))}
                                  </Link>
                                ) : (
                                  <span key={`jump-empty-${index}`} className="block h-8" />
                                ),
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] font-medium leading-3" style={{ color: "var(--muted)" }}>
                          {chip.weekday}
                        </p>
                        <p className="mt-0.5 text-[19px] font-semibold leading-4">{chip.day}</p>
                      </>
                    )}
                  </div>
              );
            })}
          </div>

          <div className={`mt-2 grid ${gridCols} gap-2`}>
            <div className="relative" style={{ height: `${timelineHeight}px` }}>
              {hourTicks.map((hour) => {
                const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
                return (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 -translate-y-1/2 text-[11px] leading-none"
                    style={{ top, color: "var(--muted)" }}
                  >
                    {formatHourLabel(hour)}
                  </div>
                );
              })}
            </div>

            {visibleDays.map((visibleDate) => {
              const day = dayCells.find((entry) => entry.date === visibleDate);
              if (!day) return null;

              return (
                <div
                  key={day.date}
                  className="relative rounded-md border"
                  style={{ height: `${timelineHeight}px`, borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  {hourTicks.map((hour) => {
                    const top = (hour * 60 - timelineStart) * PIXELS_PER_MINUTE;
                    return <div key={hour} className="absolute left-0 right-0 border-t" style={{ top, borderColor: "var(--border)" }} />;
                  })}
                  {day.cells.map((cell) => {
                  const occupiedSlot = cell.state === "occupied" ? cell.slot : null;
                  const occupiedEventVisual = occupiedSlot ? getOccupiedEventVisual(occupiedSlot) : null;

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      className="absolute left-0 right-0 z-10"
                      style={{
                        top: `${cell.top}px`,
                        height: `${cell.height}px`,
                      }}
                      onClick={() => {
                        if (occupiedSlot) {
                          if (selectedSlot?.slot_key === occupiedSlot.slot_key) {
                            setSelectedSlotKey(null);
                            setSelectedBookingId(null);
                            setSelectedCreateSlot(null);
                            return;
                          }
                          setSelectedSlotKey(occupiedSlot.slot_key);
                          setSelectedBookingId(occupiedSlot.bookings[0]?.id ?? null);
                          setSelectedCreateSlot(null);
                          return;
                        }

                        if (cell.state === "available") {
                          const isSameCreateSlot =
                            selectedCreateSlot?.date === cell.date &&
                            selectedCreateSlot?.startTime === cell.start_time.slice(0, 5) &&
                            selectedCreateSlot?.endTime === cell.end_time.slice(0, 5);

                          if (isSameCreateSlot) {
                            setSelectedCreateSlot(null);
                            setCreateFeedback(null);
                            return;
                          }

                          setSelectedSlotKey(null);
                          setSelectedBookingId(null);
                          setCreateDate(cell.date);
                          setCreateStartTime(cell.start_time.slice(0, 5));
                          setCreateEndTime(cell.end_time.slice(0, 5));
                          setAlumnoNombre("");
                          setSelectedType("individual");
                          setCreateFeedback(null);
                          setSelectedCreateSlot({
                            date: cell.date,
                            startTime: cell.start_time.slice(0, 5),
                            endTime: cell.end_time.slice(0, 5),
                          });
                        }
                      }}
                    >
                      <div
                        className={`h-full w-full overflow-hidden text-left ${
                          occupiedSlot || cell.state === "blocked"
                            ? "rounded border border-l-[3px] px-[6px] py-[3px]"
                            : "rounded-none border-none"
                        }`}
                        style={
                          occupiedSlot
                            ? {
                                background:
                                  occupiedSlot.slot_key === selectedSlot?.slot_key
                                    ? `color-mix(in srgb, ${occupiedEventVisual?.background ?? "var(--surface-2)"} 78%, var(--foreground) 22%)`
                                    : occupiedEventVisual?.background,
                                borderColor: `color-mix(in srgb, ${occupiedEventVisual?.color ?? "var(--border)"} 62%, var(--border))`,
                                borderLeftColor: `color-mix(in srgb, ${occupiedEventVisual?.color ?? "var(--border)"} 80%, var(--border) 20%)`,
                              }
                            : cell.state === "blocked"
                              ? {
                                  background: "color-mix(in srgb, var(--error) 20%, var(--surface-1))",
                                  borderColor: "color-mix(in srgb, var(--error) 62%, var(--border))",
                                  borderLeftColor: "color-mix(in srgb, var(--error) 80%, var(--border) 20%)",
                                }
                              : {
                                  background: "transparent",
                                }
                        }
                      >
                        {occupiedSlot ? (
                          <>
                            <p className="truncate text-[11px] font-bold leading-tight">
                              <span style={{ color: occupiedEventVisual?.color ?? "var(--foreground)" }}>
                              {occupiedSlot.type_label}
                              {occupiedSlot.type !== "individual"
                                ? ` (${occupiedSlot.occupied_count}/${occupiedSlot.capacity})`
                                : ""}
                              </span>
                            </p>
                            {cell.height >= 44 ? (
                              <p className="mt-[1px] truncate text-[14px] font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                                {occupiedSlot.type === "individual"
                                  ? occupiedSlot.bookings[0]?.alumno_name ?? "Alumno"
                                  : "Clase grupal"}
                              </p>
                            ) : null}
                          </>
                        ) : cell.state === "blocked" ? (
                          <p className="text-xs font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                            Ausencia
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {showSidePanel ? (
          <aside
            className="hidden rounded-xl border p-4 lg:block"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            {selectedItem ? (
              <BookingDetailContent
                item={selectedItem}
                availabilityRanges={availability}
                timeRange={{ start: selectedItem.start_time, end: selectedItem.end_time }}
                slotBookings={selectedSlot?.bookings}
                selectedBookingId={selectedBookingId}
                onSelectBooking={(bookingId) => setSelectedBookingId(bookingId)}
                compactMobile
              />
            ) : selectedCreateSlot ? (
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (!canConfirmCreate) {
                    setCreateFeedback({
                      type: "error",
                      message: "Completa alumno, fecha y horario para confirmar.",
                    });
                    return;
                  }

                  setCreateFeedback({
                    type: "error",
                    message:
                      "La creacion para alumnos sin cuenta requiere habilitacion backend (no disponible en este modulo aun).",
                  });
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                      Crear clase
                    </p>
                    <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                      {formatDateShort(createDate)} - {createStartTime} a {createEndTime}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost text-xs"
                    onClick={() => {
                      setSelectedCreateSlot(null);
                      setCreateFeedback(null);
                    }}
                  >
                    Cerrar
                  </button>
                </div>

                {deportes.length > 1 ? (
                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Deporte
                    <select
                      value={deporteActivo ?? ""}
                      disabled
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {deportes.map((deporte) => (
                        <option key={deporte.key} value={deporte.key}>
                          {deporte.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Alumno
                  <input
                    type="text"
                    value={alumnoNombre}
                    onChange={(event) => setAlumnoNombre(event.target.value)}
                    placeholder="Nombre del alumno"
                    className="input h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Modalidad
                  <select
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(event.target.value as "individual" | "dobles" | "trio" | "grupal")
                    }
                    className="select h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  >
                    <option value="individual">Individual</option>
                    <option value="dobles">Dobles</option>
                    <option value="trio">Trio</option>
                    <option value="grupal">Grupal</option>
                  </select>
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Fecha
                  <input
                    type="date"
                    value={createDate}
                    onChange={(event) => applyCreateDate(event.target.value)}
                    className="input h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Hora inicio
                    <select
                      value={createStartTime}
                      onChange={(event) => {
                        const nextStart = event.target.value;
                        setCreateStartTime(nextStart);
                        if (createEndTime <= nextStart) {
                          const nextEndOptions = buildEndOptionsForDateAndStart(
                            createDate,
                            nextStart,
                            availability,
                          );
                          setCreateEndTime(getOneHourLaterOrNextAvailable(nextStart, nextEndOptions));
                        }
                      }}
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {createStartTimeOptions.map((option) => (
                        <option key={`create-start-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Hora fin
                    <select
                      value={createEndTime}
                      onChange={(event) => setCreateEndTime(event.target.value)}
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {createEndTimeOptions.map((option) => (
                        <option key={`create-end-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {createStartTimeOptions.length === 0 ? (
                  <p
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--warning-border)",
                      background: "var(--warning-bg)",
                      color: "var(--warning)",
                    }}
                  >
                    No hay disponibilidad configurada para la fecha elegida.
                  </p>
                ) : null}

                {createFeedback ? (
                  <p
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--error-border)",
                      background: "var(--error-bg)",
                      color: "var(--error)",
                    }}
                  >
                    {createFeedback.message}
                  </p>
                ) : null}

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary h-9 px-4 text-sm font-semibold" disabled={!canConfirmCreate}>
                    Confirmar
                  </button>
                </div>
              </form>
            ) : null}
          </aside>
        ) : null}
        </div>
      </div>

      {showMobileDetailSheet ? (
        <div className="fixed inset-0 z-[60] lg:hidden" aria-modal="true" role="dialog">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={closeMobileDetailSheet}
            aria-label="Cerrar detalle"
          />
          <div
            className="absolute inset-x-0 bottom-0 z-10 max-h-[85vh] overflow-y-auto rounded-t-2xl border p-4 shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {selectedItem ? "Detalle de clase" : "Crear clase"}
              </p>
              <button
                type="button"
                className="rounded-md border px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
                onClick={closeMobileDetailSheet}
              >
                Cerrar
              </button>
            </div>

            {selectedItem ? (
              <BookingDetailContent
                item={selectedItem}
                availabilityRanges={availability}
                timeRange={{ start: selectedItem.start_time, end: selectedItem.end_time }}
                slotBookings={selectedSlot?.bookings}
                selectedBookingId={selectedBookingId}
                onSelectBooking={(bookingId) => setSelectedBookingId(bookingId)}
              />
            ) : selectedCreateSlot ? (
              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();

                  if (!canConfirmCreate) {
                    setCreateFeedback({
                      type: "error",
                      message: "Completa alumno, fecha y horario para confirmar.",
                    });
                    return;
                  }

                  setCreateFeedback({
                    type: "error",
                    message:
                      "La creacion para alumnos sin cuenta requiere habilitacion backend (no disponible en este modulo aun).",
                  });
                }}
              >
                <div className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {selectedCreateSlot.date} - {selectedCreateSlot.startTime} a {selectedCreateSlot.endTime}
                  </p>
                </div>

                {deportes.length > 1 ? (
                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Deporte
                    <select
                      value={deporteActivo ?? ""}
                      disabled
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {deportes.map((deporte) => (
                        <option key={deporte.key} value={deporte.key}>
                          {deporte.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Alumno
                  <input
                    type="text"
                    value={alumnoNombre}
                    onChange={(event) => setAlumnoNombre(event.target.value)}
                    placeholder="Nombre del alumno"
                    className="input h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  />
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Modalidad
                  <select
                    value={selectedType}
                    onChange={(event) =>
                      setSelectedType(event.target.value as "individual" | "dobles" | "trio" | "grupal")
                    }
                    className="select h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  >
                    <option value="individual">Individual</option>
                    <option value="dobles">Dobles</option>
                    <option value="trio">Trio</option>
                    <option value="grupal">Grupal</option>
                  </select>
                </label>

                <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                  Fecha
                  <input
                    type="date"
                    value={createDate}
                    onChange={(event) => applyCreateDate(event.target.value)}
                    className="input h-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Hora inicio
                    <select
                      value={createStartTime}
                      onChange={(event) => {
                        const nextStart = event.target.value;
                        setCreateStartTime(nextStart);
                        if (createEndTime <= nextStart) {
                          const nextEndOptions = buildEndOptionsForDateAndStart(
                            createDate,
                            nextStart,
                            availability,
                          );
                          setCreateEndTime(getOneHourLaterOrNextAvailable(nextStart, nextEndOptions));
                        }
                      }}
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {createStartTimeOptions.map((option) => (
                        <option key={`create-mobile-start-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                    Hora fin
                    <select
                      value={createEndTime}
                      onChange={(event) => setCreateEndTime(event.target.value)}
                      className="select h-10 text-sm"
                      style={{ background: "var(--surface-1)" }}
                    >
                      {createEndTimeOptions.map((option) => (
                        <option key={`create-mobile-end-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {createStartTimeOptions.length === 0 ? (
                  <p
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--warning-border)",
                      background: "var(--warning-bg)",
                      color: "var(--warning)",
                    }}
                  >
                    No hay disponibilidad configurada para la fecha elegida.
                  </p>
                ) : null}

                {createFeedback ? (
                  <p
                    className="rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: "var(--error-border)",
                      background: "var(--error-bg)",
                      color: "var(--error)",
                    }}
                  >
                    {createFeedback.message}
                  </p>
                ) : null}

                <button type="submit" className="btn-primary h-10 px-4 text-sm font-semibold" disabled={!canConfirmCreate}>
                  Confirmar
                </button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
