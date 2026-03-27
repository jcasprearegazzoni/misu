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
}: WeekCalendarStripProps) {
  const resolvedMonthLabel = monthLabel ?? formatMonthLabel(weekDates[0]);
  const isBookingTone = tone === "booking";

  return (
    <section
      className={`mt-4 rounded-xl border p-3 sm:p-4 ${
        isBookingTone ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-300 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-zinc-900 sm:text-2xl">{resolvedMonthLabel}</p>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{subtitle}</p>
        </div>

        <div
          className={`flex items-center gap-2 border-l pl-3 ${
            isBookingTone ? "border-emerald-200" : "border-zinc-200"
          }`}
        >
          <Link
            href={prevHref}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold ${
              isBookingTone
                ? "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                : "border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
            }`}
            aria-label="Semana anterior"
          >
            ‹
          </Link>
          <Link
            href={nextHref}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-lg font-semibold ${
              isBookingTone
                ? "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                : "border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
            }`}
            aria-label="Semana siguiente"
          >
            ›
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
              className={`rounded-xl border px-1 py-1.5 text-center ${
                isActive
                  ? isBookingTone
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                    : "border-zinc-800 bg-zinc-800 text-white shadow-sm"
                  : isBookingTone
                    ? "border-emerald-200 bg-white text-zinc-800"
                    : "border-zinc-300 bg-white text-zinc-800"
              }`}
            >
              <p
                className={`text-[11px] font-medium leading-3 sm:text-xs ${
                  isActive ? "text-zinc-100" : "text-zinc-600"
                }`}
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
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium ${
              isBookingTone
                ? "border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50"
                : "border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Volver a semana actual
          </Link>
        </div>
      ) : null}
    </section>
  );
}
