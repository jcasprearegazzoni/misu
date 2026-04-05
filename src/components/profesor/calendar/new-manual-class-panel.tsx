"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AvailabilityRange,
  buildEndOptionsForDateAndStart,
  buildStartOptionsForDate,
  getOneHourLaterOrNextAvailable,
} from "./time-options";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type NewManualClassPanelProps = {
  alumnos: AlumnoOption[];
  availabilityRanges: AvailabilityRange[];
};

function getTodayIsoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDateShort(dateIso: string) {
  const [year = "", month = "", day = ""] = dateIso.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}/${month}/${year.slice(-2)}`;
}

export function NewManualClassPanel({ alumnos: _alumnos, availabilityRanges }: NewManualClassPanelProps) {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [alumnoNombre, setAlumnoNombre] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayIsoDate());
  const [selectedType, setSelectedType] = useState<"individual" | "dobles" | "trio" | "grupal">("individual");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  const minDate = useMemo(() => getTodayIsoDate(), []);
  const startTimeOptions = useMemo(
    () => buildStartOptionsForDate(selectedDate, availabilityRanges),
    [selectedDate, availabilityRanges],
  );
  const endTimeOptions = useMemo(
    () => buildEndOptionsForDateAndStart(selectedDate, selectedStartTime, availabilityRanges),
    [selectedDate, selectedStartTime, availabilityRanges],
  );

  function applyDateWithDefaultTimes(nextDate: string) {
    setSelectedDate(nextDate);
    const nextStartOptions = buildStartOptionsForDate(nextDate, availabilityRanges);
    const startValue = nextStartOptions[0]?.value ?? "";
    setSelectedStartTime(startValue);
    const nextEndOptions = buildEndOptionsForDateAndStart(nextDate, startValue, availabilityRanges);
    setSelectedEndTime(getOneHourLaterOrNextAvailable(startValue, nextEndOptions));
  }

  function resetForm() {
    setAlumnoNombre("");
    setSelectedType("individual");
    applyDateWithDefaultTimes(getTodayIsoDate());
    setFeedback(null);
  }

  useEffect(() => {
    const onCreateSlot = (event: Event) => {
      const customEvent = event as CustomEvent<{
        date: string;
        startTime: string;
        endTime: string;
      }>;
      const payload = customEvent.detail;
      if (!payload) {
        return;
      }

      setIsOpen(true);
      setAlumnoNombre("");
      setSelectedType("individual");
      setSelectedDate(payload.date);
      setSelectedStartTime(payload.startTime);
      setSelectedEndTime(payload.endTime);
      setFeedback(null);
    };

    window.addEventListener("calendar:create-slot", onCreateSlot);
    return () => window.removeEventListener("calendar:create-slot", onCreateSlot);
  }, []);

  const canConfirm =
    alumnoNombre.trim().length > 1 &&
    selectedDate.length > 0 &&
    selectedStartTime.length > 0 &&
    selectedEndTime.length > 0 &&
    startTimeOptions.length > 0 &&
    endTimeOptions.length > 0;

  return (
    <section className="mt-4">
      <div className="card max-w-6xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Crear clase
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Para alumnos que no tienen cuenta creada
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setFeedback(null);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-opacity hover:opacity-90"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
            aria-label={isOpen ? "Plegar formulario" : "Desplegar formulario"}
            title={isOpen ? "Ocultar" : "Mostrar"}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12l5-5 5 5" />
            </svg>
          </button>
        </div>

      {isOpen ? (
          <>
          <form
            className="mt-3 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();

              if (!canConfirm) {
                setFeedback({
                  type: "error",
                  message: "Completá alumno, fecha y horario para confirmar.",
                });
                return;
              }

              setFeedback({
                type: "error",
                message:
                  "La creación para alumnos sin cuenta requiere habilitación backend (no disponible en este módulo aún).",
              });
            }}
          >
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
              <label className="col-span-2 grid min-w-0 gap-1.5 text-sm xl:col-span-1" style={{ color: "var(--muted)" }}>
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
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={formatDateShort(selectedDate)}
                    onClick={() => datePickerRef.current?.showPicker?.()}
                    className="input h-10 pr-10 text-sm"
                    style={{ background: "var(--surface-1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => datePickerRef.current?.showPicker?.()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
                    style={{ color: "var(--muted)" }}
                    aria-label="Seleccionar fecha"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </button>
                  <input
                    ref={datePickerRef}
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(event) => applyDateWithDefaultTimes(event.target.value)}
                    className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </label>

              <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                Hora inicio
                <select
                  value={selectedStartTime}
                  onChange={(event) => {
                    const nextStart = event.target.value;
                    setSelectedStartTime(nextStart);
                    if (selectedEndTime <= nextStart) {
                      const nextEndOptions = buildEndOptionsForDateAndStart(
                        selectedDate,
                        nextStart,
                        availabilityRanges,
                      );
                      setSelectedEndTime(getOneHourLaterOrNextAvailable(nextStart, nextEndOptions));
                    }
                  }}
                  className="select h-10 text-sm"
                  style={{ background: "var(--surface-1)" }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {startTimeOptions.map((option) => (
                    <option key={`manual-start-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid min-w-0 gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
                Hora fin
                <select
                  value={selectedEndTime}
                  onChange={(event) => setSelectedEndTime(event.target.value)}
                  className="select h-10 text-sm"
                  style={{ background: "var(--surface-1)" }}
                >
                  <option value="" disabled>
                    Seleccionar
                  </option>
                  {endTimeOptions.map((option) => (
                    <option key={`manual-end-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {startTimeOptions.length === 0 ? (
              <p
                className="rounded-md border px-3 py-2 text-sm"
                style={{
                  borderColor: "var(--warning-border, #f5c26b)",
                  background: "var(--warning-bg, #fff4db)",
                  color: "var(--warning, #8a5a00)",
                }}
              >
                No hay disponibilidad configurada para la fecha elegida.
              </p>
            ) : null}

            {feedback ? (
              <p
                className="rounded-md border px-3 py-2 text-sm"
                style={
                  feedback.type === "error"
                    ? {
                        borderColor: "var(--danger-border, #fecaca)",
                        background: "var(--danger-bg, #fef2f2)",
                        color: "var(--danger, #b91c1c)",
                      }
                    : {
                        borderColor: "var(--success-border)",
                        background: "var(--success-bg)",
                        color: "var(--success)",
                      }
                }
              >
                {feedback.message}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                className="btn-ghost h-9 px-3 text-sm"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary h-9 px-4 text-sm font-semibold" disabled={!canConfirm}>
                Confirmar
              </button>
            </div>
          </form>
          </>
      ) : null}
      </div>
    </section>
  );
}

