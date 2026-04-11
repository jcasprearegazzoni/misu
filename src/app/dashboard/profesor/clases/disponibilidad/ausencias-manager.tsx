"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deleteBlockedDateAction,
  saveBlockedDateAction,
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
  hideTitle?: boolean;
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

function getDateAndTimeParts(isoValue: string) {
  const date = new Date(isoValue);
  return {
    date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
  };
}

function formatAbsenceDateTime(value: string) {
  const date = new Date(value);
  const dateLabel = date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const timeLabel = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${dateLabel} ${timeLabel}`;
}

function getAbsenceTitle(item: BlockedDateRow) {
  return item.reason?.trim() || "Ausencia";
}

function getAbsenceRangeLabel(item: BlockedDateRow) {
  return `${formatAbsenceDateTime(item.start_at)} - ${formatAbsenceDateTime(item.end_at)}`;
}

export function AusenciasManager({ blockedDates, bare = false, hideTitle = false }: AusenciasManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DisponibilidadActionState>(initialState);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("22:00");
  const [reason, setReason] = useState("");
  const [editingItem, setEditingItem] = useState<BlockedDateRow | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const calendarCells = getMonthMatrix(calendarMonth);
  const isEditing = editingItem !== null;

  const rangeEndOrStart = rangeEnd ?? rangeStart;
  const computedStartAt = rangeStart ? `${toIsoDate(rangeStart)}T${startTime}` : "";
  const computedEndAt = rangeEndOrStart ? `${toIsoDate(rangeEndOrStart)}T${endTime}` : "";

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isModalOpen]);

  function resetModalState() {
    setRangeStart(null);
    setRangeEnd(null);
    setStartTime("08:00");
    setEndTime("22:00");
    setReason("");
    setEditingItem(null);
    setLocalError(null);
    setState(initialState);
  }

  function openCreateModal() {
    resetModalState();
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setIsModalOpen(true);
  }

  function openEditModal(item: BlockedDateRow) {
    resetModalState();

    const startParts = getDateAndTimeParts(item.start_at);
    const endParts = getDateAndTimeParts(item.end_at);

    setEditingItem(item);
    setRangeStart(startParts.date);
    setRangeEnd(endParts.date);
    setStartTime(startParts.time);
    setEndTime(endParts.time);
    setReason(item.reason ?? "");
    setCalendarMonth(new Date(startParts.date.getFullYear(), startParts.date.getMonth(), 1));
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    resetModalState();
  }

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

  function handleDelete(itemId: number) {
    const formData = new FormData();
    formData.set("id", String(itemId));
    startDeleteTransition(() => {
      deleteBlockedDateAction(formData);
      setConfirmDeleteId(null);
    });
  }

  return (
    <div className={bare ? "w-full" : "mx-auto w-full max-w-2xl"}>
      <div
        className={bare ? "" : "rounded-lg border p-3"}
        style={bare ? undefined : { borderColor: "var(--border)", background: "var(--surface-1)" }}
      >
        <div className="flex items-center justify-between gap-3">
          {hideTitle ? (
            <div />
          ) : (
            <div className="flex items-center">
              <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Ausencias
              </h2>
            </div>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--misu-light)" }}
          >
            <span>+</span>
            <span>Agregar ausencia</span>
          </button>
        </div>

        <div className="mt-3">
          {blockedDates.length === 0 ? (
            <p className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Sin ausencias cargadas.
            </p>
          ) : (
            <ul className="grid gap-2">
              {blockedDates.map((item) => (
                <li key={item.id} className="rounded-md border border-[var(--border)] px-3 py-2.5">
                  {confirmDeleteId === item.id ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-[var(--foreground)]">Eliminar ausencia</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="flex h-8 flex-1 items-center justify-center rounded-md border-none text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                          style={{ background: "var(--error-bg, rgba(239,68,68,0.12))", color: "var(--error)", cursor: "pointer" }}
                        >
                          {isDeleting ? "Eliminando..." : "Si"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex h-8 flex-1 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-xs font-medium transition-opacity hover:opacity-80"
                          style={{ color: "var(--muted)", cursor: "pointer" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">{getAbsenceTitle(item)}</p>
                          <p className="truncate text-xs text-[var(--muted)]">{getAbsenceRangeLabel(item)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="flex h-8 items-center rounded-md border-none bg-transparent px-2 text-xs font-medium leading-none opacity-60 transition-opacity hover:opacity-100"
                            style={{ color: "var(--foreground)", cursor: "pointer" }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent opacity-70 transition-opacity hover:opacity-100"
                            style={{ color: "var(--error)" }}
                            title="Eliminar ausencia"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M3 6h18" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M8 6V4h8v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
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
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full rounded-t-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4 sm:max-w-2xl sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {isEditing ? "Editar ausencia" : "Agregar ausencia"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
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

                const formData = new FormData();
                if (editingItem) {
                  formData.set("id", String(editingItem.id));
                }
                formData.set("start_at", computedStartAt);
                formData.set("end_at", computedEndAt);
                formData.set("reason", reason);

                startTransition(async () => {
                  const result = await saveBlockedDateAction(initialState, formData);
                  setState(result);

                  if (!result.error) {
                    closeModal();
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
                <label className="grid gap-1 text-sm font-medium text-[var(--foreground)]">
                  <span>Titulo de la ausencia</span>
                  <input
                    type="text"
                    name="reason"
                    placeholder="Ej: vacaciones"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
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
                        rangeEnd ? ` -> ${rangeEnd.toLocaleDateString("es-AR", { day: "numeric", month: "long" })}` : ""
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
                  {isPending ? "Guardando..." : isEditing ? "Guardar cambios" : "Guardar ausencia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

