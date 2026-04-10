"use client";

import { useState, useTransition } from "react";
import { formatUserDateTime } from "@/lib/format/date";
import {
  addBlockedDateAction,
  deleteBlockedDateAction,
  type DisponibilidadActionState,
} from "@/app/dashboard/profesor/clases/disponibilidad/actions";

type BlockedDateRow = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type AusenciasManagerProps = {
  blockedDates: BlockedDateRow[];
  bare?: boolean;
};

const initialState: DisponibilidadActionState = {
  error: null,
  success: null,
};

const weekdays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
});
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  const value = `${hours}:${minutes}`;
  return { value, label: value };
});

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthMatrix(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AusenciasManager({ blockedDates, bare = false }: AusenciasManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DisponibilidadActionState>(initialState);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [localError, setLocalError] = useState<string | null>(null);

  const calendarCells = getMonthMatrix(calendarMonth);

  function handleDayClick(day: Date) {
    setLocalError(null);

    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day);
      setRangeEnd(null);
      return;
    }

    if (day < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(day);
      return;
    }

    setRangeEnd(day);
  }

  function goToPreviousMonth() {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  function goToNextMonth() {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  function isInSelectedRange(day: Date) {
    if (!rangeStart) {
      return false;
    }

    if (!rangeEnd) {
      return isSameDate(day, rangeStart);
    }

    return day >= rangeStart && day <= rangeEnd;
  }

  const computedStartAt = rangeStart ? `${toIsoDate(rangeStart)}T${startTime}` : "";
  const computedEndAt = (rangeEnd ?? rangeStart) ? `${toIsoDate(rangeEnd ?? rangeStart!)}T${endTime}` : "";

  function resetModalState() {
    setRangeStart(null);
    setRangeEnd(null);
    setStartTime("08:00");
    setEndTime("22:00");
    setLocalError(null);
    setState(initialState);
  }

  return (
    <div className={bare ? "w-full" : "mx-auto w-full max-w-2xl"}>
      <div
        className={bare ? "" : "rounded-lg border p-3"}
        style={bare ? undefined : { borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Ausencias
            </h2>
            {blockedDates.length > 0 && (
              <span className="pill text-xs" style={{ background: "var(--surface-3)", color: "var(--muted)" }}>
                {blockedDates.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { resetModalState(); setIsModalOpen(true); }}
            className="btn-primary h-9 px-3 text-sm leading-none"
          >
            Añadir
          </button>
        </div>

        <div className="mt-3">
          {blockedDates.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No hay ausencias registradas.</p>
          ) : (
            <ul className="grid gap-2">
              {blockedDates.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {item.reason?.trim() || "Ausencia"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatUserDateTime(item.start_at)} a {formatUserDateTime(item.end_at)}
                    </p>
                  </div>
                  <form action={deleteBlockedDateAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="btn-ghost h-9 w-9 self-end leading-none sm:self-auto"
                      style={{ color: "var(--error)" }}
                      title="Eliminar ausencia"
                    >
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end p-0 sm:items-center sm:justify-center sm:p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <div className="w-full rounded-t-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:max-w-2xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">Añadir nueva ausencia</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalState();
                }}
                className="btn-ghost h-8 w-8"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                if (!rangeStart) {
                  setLocalError("Selecciona una fecha de inicio y fin en el calendario.");
                  return;
                }

                const formData = new FormData(event.currentTarget);
                formData.set("start_at", computedStartAt);
                formData.set("end_at", computedEndAt);

                startTransition(async () => {
                  const result = await addBlockedDateAction(initialState, formData);
                  setState(result);

                  if (!result.error) {
                    setIsModalOpen(false);
                    resetModalState();
                  }
                });
              }}
              className="grid gap-3 md:grid-cols-[1.2fr_1fr]"
            >
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                <p className="text-sm text-[var(--muted)]">
                  Selecciona rango de fechas en un mismo calendario.
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
                  >
                    ‹
                  </button>
                  <p className="text-base font-semibold capitalize text-[var(--foreground)]">
                    {monthFormatter.format(calendarMonth)}
                  </p>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="h-8 w-8 rounded-md border border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-3)]"
                  >
                    ›
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-[var(--muted)]">
                  {weekdays.map((weekday) => (
                    <div key={weekday}>{weekday}</div>
                  ))}
                </div>

                <div className="mt-1 grid grid-cols-7 gap-1">
                  {calendarCells.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="h-9" />;
                    }

                    const inRange = isInSelectedRange(day);
                    const isStart = rangeStart ? isSameDate(day, rangeStart) : false;
                    const isEnd = rangeEnd ? isSameDate(day, rangeEnd) : false;

                    return (
                      <button
                        key={toIsoDate(day)}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={`h-8 rounded-md text-sm leading-none ${
                          isStart || isEnd
                            ? ""
                            : inRange
                              ? ""
                              : "bg-[var(--surface-1)] text-[var(--foreground)] hover:bg-[var(--surface-3)]"
                        }`}
                        style={
                          isStart || isEnd
                            ? { background: "var(--misu)", color: "#fff" }
                            : inRange
                              ? { background: "var(--misu-subtle)", color: "var(--misu-light)" }
                              : undefined
                        }
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-2.5">
                <input type="hidden" name="start_at" value={computedStartAt} />
                <input type="hidden" name="end_at" value={computedEndAt} />

                <label className="grid gap-1 text-sm font-medium text-[var(--foreground)]">
                  <span>Título de la ausencia</span>
                  <input
                    type="text"
                    name="reason"
                    placeholder="Ej: vacaciones"
                    className="input"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-sm font-medium text-[var(--foreground)]">
                    <span>Hora inicio</span>
                    <select
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="select h-9 w-full !py-0 leading-none sm:w-[104px]"
                    >
                      {timeOptions.map((option) => (
                        <option key={`absence-start-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-[var(--foreground)]">
                    <span>Hora fin</span>
                    <select
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="select h-9 w-full !py-0 leading-none sm:w-[104px]"
                    >
                      {timeOptions.map((option) => (
                        <option key={`absence-end-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Rango:{" "}
                  {rangeStart
                    ? `${rangeStart.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}${
                        rangeEnd ? ` → ${rangeEnd.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}` : ""
                      }`
                    : "sin seleccionar"}
                </p>

                {localError ? <p className="alert-error">{localError}</p> : null}
                {state.error ? <p className="alert-error">{state.error}</p> : null}
                {state.success ? <p className="alert-success">{state.success}</p> : null}

                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-primary w-full"
                >
                  {isPending ? "Guardando..." : "Guardar ausencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

