import Link from "next/link";

type WeekCalendarStripProps = {
  weekDates: string[];
  selectedDay: string;
  monthLabel?: string;
  subtitle?: string;
  tone?: "neutral" | "booking";
  prevHref: string;
  nextHref: string;
  dayHrefBuilder: (dateIso: string) => string;
  resetHref?: string;
  resetLabel?: string;
};

function formatMonthLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDayChip(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  })
    .format(date)
    .replace(".", "")
    .slice(0, 2);
  const day = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day,
  };
}

export function WeekCalendarStrip({
  weekDates,
  selectedDay,
  monthLabel,
  subtitle = "Semana de clases",
  tone = "neutral",
  prevHref,
  nextHref,
  dayHrefBuilder,
  resetHref,
  resetLabel = "Volver a hoy",
}: WeekCalendarStripProps) {
  const resolvedMonthLabel = monthLabel ?? formatMonthLabel(weekDates[0]);
  const isBookingTone = tone === "booking";

  return (
    <section
      className="mt-4 rounded-xl border p-3 sm:p-4"
      style={{
        borderColor: isBookingTone ? "var(--success-border)" : "var(--border)",
        background: isBookingTone ? "var(--success-bg)" : "var(--surface-1)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
            {resolvedMonthLabel}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: "var(--muted)" }}>
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 border-l pl-3" style={{ borderColor: "var(--border)" }}>
          <Link
            href={prevHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold transition"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
            aria-label="Semana anterior"
          >
            {"<"}
          </Link>
          <Link
            href={nextHref}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold transition"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
            aria-label="Semana siguiente"
          >
            {">"}
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDates.map((date) => {
          const day = formatDayChip(date);
          const isActive = date === selectedDay;
          return (
            <Link
              key={date}
              href={dayHrefBuilder(date)}
              className="rounded-xl border px-1 py-1.5 text-center"
              style={
                isActive
                  ? {
                      borderColor: isBookingTone ? "var(--success)" : "var(--misu)",
                      background: isBookingTone ? "var(--success)" : "var(--misu)",
                      color: "#fff",
                    }
                  : {
                      borderColor: "var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--foreground)",
                    }
              }
            >
              <p
                className="text-[11px] font-medium leading-3 sm:text-xs"
                style={{ color: isActive ? "rgba(255,255,255,0.9)" : "var(--muted)" }}
              >
                {day.weekday}
              </p>
              <p className="mt-1 text-xl font-semibold leading-4 sm:text-lg">{day.day}</p>
            </Link>
          );
        })}
      </div>

      {resetHref ? (
        <div className="mt-3">
          <Link
            href={resetHref}
            className="inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
          >
            {resetLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
