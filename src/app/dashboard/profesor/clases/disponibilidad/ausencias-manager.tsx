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

export function AusenciasManager({ blockedDates }: AusenciasManagerProps) {
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
    <div className="mx-auto grid w-full max-w-2xl gap-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600">Ausencias activas</p>
            <p className="text-2xl font-semibold text-zinc-900">{blockedDates.length}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetModalState();
              setIsModalOpen(true);
            }}
            className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Anadir ausencia
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-3">
        <h2 className="text-base font-semibold text-zinc-900">Ausencias activas</h2>
        {blockedDates.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No hay ausencias registradas.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {blockedDates.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-900">{item.reason?.trim() || "Ausencia"}</p>
                  <p className="text-sm text-zinc-700">
                    {formatUserDateTime(item.start_at)} a {formatUserDateTime(item.end_at)}
                  </p>
                </div>
                <form action={deleteBlockedDateAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    className="h-8 w-8 rounded-md border border-red-300 text-sm font-semibold text-red-700 hover:bg-red-50"
                    title="Eliminar ausencia"
                  >
                    X
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-zinc-900/35 p-0 sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-2xl border border-zinc-200 bg-white p-4 sm:max-w-2xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-zinc-900">Anadir nueva ausencia</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetModalState();
                }}
                className="h-8 w-8 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              >
                X
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
              <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm text-zinc-700">
                  Selecciona rango de fechas en un mismo calendario.
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  >
                    {"<"}
                  </button>
                  <p className="text-base font-semibold capitalize text-zinc-900">
                    {monthFormatter.format(calendarMonth)}
                  </p>
                  <button
                    type="button"
                    onClick={goToNextMonth}
                    className="h-8 w-8 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  >
                    {">"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-medium text-zinc-600">
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
                        className={`h-8 rounded-md text-sm ${
                          isStart || isEnd
                            ? "bg-emerald-700 font-semibold text-white"
                            : inRange
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-white text-zinc-800 hover:bg-zinc-100"
                        }`}
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

                <label className="grid gap-1 text-sm font-medium text-zinc-800">
                  <span>Titulo de la ausencia</span>
                  <input
                    type="text"
                    name="reason"
                    placeholder="Ej: vacaciones"
                    className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900"
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-sm font-medium text-zinc-800">
                    <span>Hora inicio</span>
                    <select
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="h-9 w-[104px] rounded-md border border-zinc-400 bg-white px-2 text-sm text-zinc-900"
                    >
                      {timeOptions.map((option) => (
                        <option key={`absence-start-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium text-zinc-800">
                    <span>Hora fin</span>
                    <select
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="h-9 w-[104px] rounded-md border border-zinc-400 bg-white px-2 text-sm text-zinc-900"
                    >
                      {timeOptions.map((option) => (
                        <option key={`absence-end-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="text-xs text-zinc-600">
                  Rango seleccionado:{" "}
                  {rangeStart
                    ? `${toIsoDate(rangeStart)}${rangeEnd ? ` a ${toIsoDate(rangeEnd)}` : ""}`
                    : "sin seleccionar"}
                </p>

                {localError ? (
                  <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
                    {localError}
                  </p>
                ) : null}

                {state.error ? (
                  <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
                    {state.error}
                  </p>
                ) : null}

                {state.success ? (
                  <p className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
                    {state.success}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-1 h-9 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-60"
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
