"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  deleteAvailabilityAction,
  saveAvailabilityAction,
  type DisponibilidadActionState,
} from "@/app/dashboard/profesor/clases/disponibilidad/actions";

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id: number | null;
};

type FrequentScheduleManagerProps = {
  availability: AvailabilityRow[];
  clubs: Array<{ id: number; nombre: string }>;
  bare?: boolean;
};

const dayOptions = [
  { value: 1, short: "Lu", label: "Lunes" },
  { value: 2, short: "Ma", label: "Martes" },
  { value: 3, short: "Mi", label: "Miércoles" },
  { value: 4, short: "Ju", label: "Jueves" },
  { value: 5, short: "Vi", label: "Viernes" },
  { value: 6, short: "Sa", label: "Sábado" },
  { value: 0, short: "Do", label: "Domingo" },
];

const initialState: DisponibilidadActionState = {
  error: null,
  success: null,
};

// Opciones de hora cada 30 minutos entre 00:00 y 23:30.
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  const value = `${hours}:${minutes}`;
  return { value, label: value };
});

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeValue(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Calcula el fin sugerido: inicio + 60 min, redondeado al slot de 30 min más cercano.
function suggestEnd(startTime: string) {
  return toTimeValue(toMinutes(startTime) + 60);
}

type RowFormProps = {
  item: AvailabilityRow;
  clubs: Array<{ id: number; nombre: string }>;
};

function ClubSelector({
  value,
  clubs,
  disabled,
  onChange,
}: {
  value: string;
  clubs: Array<{ id: number; nombre: string }>;
  disabled: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <select
      name="club_id"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="select h-8 !w-full md:!w-[220px] lg:!w-[250px] !py-0 leading-none"
      disabled={disabled}
    >
      <option value="">Particulares</option>
      {clubs.map((club) => (
        <option key={club.id} value={String(club.id)}>
          {club.nombre}
        </option>
      ))}
    </select>
  );
}

type EditModalProps = {
  item: AvailabilityRow;
  clubs: Array<{ id: number; nombre: string }>;
  onClose: () => void;
};

function EditRangeModal({ item, clubs, onClose }: EditModalProps) {
  const [state, formAction, isPending] = useActionState(saveAvailabilityAction, initialState);
  const [startTime, setStartTime] = useState(item.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(item.end_time.slice(0, 5));
  const [clubId, setClubId] = useState(item.club_id != null ? String(item.club_id) : "");
  const [duration, setDuration] = useState(item.slot_duration_minutes);
  const [timeError, setTimeError] = useState<string | null>(null);

  // Cerrar automáticamente al guardar con éxito.
  useEffect(() => {
    if (state.success) onClose();
  }, [state.success, onClose]);

  // Cerrar con Escape.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleStartChange(value: string) {
    setStartTime(value);
    if (toMinutes(endTime) <= toMinutes(value)) {
      setEndTime(suggestEnd(value));
    }
    setTimeError(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full rounded-t-2xl border border-[var(--border)] bg-[var(--surface-1)] shadow-2xl sm:max-w-sm sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Editar horario</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-transparent text-lg leading-none transition-opacity opacity-50 hover:opacity-100"
            style={{ color: "var(--muted)", cursor: "pointer", border: "none" }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form
          action={formAction}
          onSubmit={(e) => {
            if (toMinutes(endTime) <= toMinutes(startTime)) {
              e.preventDefault();
              setTimeError("La hora de fin debe ser mayor que la de inicio.");
              return;
            }
            setTimeError(null);
          }}
          className="grid gap-4 p-5"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="day_of_week" value={item.day_of_week} />

          <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
            Club
            <ClubSelector value={clubId} clubs={clubs} disabled={isPending} onChange={setClubId} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              Hora inicio
              <select
                name="start_time"
                value={startTime}
                onChange={(e) => handleStartChange(e.target.value)}
                className="select h-10 !w-full !py-0 leading-none"
                required
              >
                {timeOptions.map((o) => (
                  <option key={`ms-${o.value}`} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
              Hora fin
              <select
                name="end_time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="select h-10 !w-full !py-0 leading-none"
                required
              >
                {timeOptions
                  .filter((o) => toMinutes(o.value) > toMinutes(startTime))
                  .map((o) => (
                    <option key={`me-${o.value}`} value={o.value}>{o.label}</option>
                  ))}
              </select>
            </label>
          </div>

          {/* Duración: campo chico centrado con label */}
          <label className="grid gap-1.5 text-xs font-medium text-[var(--muted)]">
            Duración de cada turno
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="slot_duration_minutes"
                min={30}
                step={30}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="input h-10 !w-[80px] !py-0 text-center leading-none"
                required
              />
              <span className="text-sm text-[var(--muted)]">min</span>
            </div>
          </label>

          {timeError ? <p className="text-xs font-medium" style={{ color: "var(--error)" }}>{timeError}</p> : null}
          {state.error ? <p className="text-xs font-medium" style={{ color: "var(--error)" }}>{state.error}</p> : null}

          {/* Footer con botones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-[var(--border)] bg-transparent text-sm font-medium text-[var(--muted)] transition-opacity hover:opacity-80"
              style={{ cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary flex h-10 flex-1 items-center justify-center text-sm leading-none"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FrequentRangeRow({ item, clubs }: RowFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const clubName = item.club_id
    ? (clubs.find((c) => c.id === item.club_id)?.nombre ?? "Club")
    : "Particulares";

  function handleDelete() {
    const fd = new FormData();
    fd.set("id", String(item.id));
    startDeleteTransition(() => deleteAvailabilityAction(fd));
  }

  return (
    <>
      <div className="rounded-md border border-[var(--border)] px-3 py-2.5">
        {confirmDelete ? (
          /* Modo confirmación: ocupa todo el card */
          <div className="flex flex-col gap-2">
            <p className="text-sm text-[var(--foreground)]">
              ¿Eliminar <span className="font-medium">{item.start_time.slice(0, 5)} – {item.end_time.slice(0, 5)}</span>?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex h-8 flex-1 items-center justify-center rounded-md border-none text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "var(--error-bg, rgba(239,68,68,0.12))", color: "var(--error)", cursor: "pointer" }}
              >
                {isDeleting ? "Eliminando..." : "Sí"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex h-8 flex-1 items-center justify-center rounded-md border border-[var(--border)] bg-transparent text-xs font-medium transition-opacity hover:opacity-80"
                style={{ color: "var(--muted)", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Línea 1: club + acciones */}
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">{clubName}</span>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex h-8 items-center rounded-md border-none bg-transparent px-2 text-xs font-medium leading-none opacity-60 transition-opacity hover:opacity-100"
                  style={{ color: "var(--foreground)", cursor: "pointer" }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-transparent opacity-70 transition-opacity hover:opacity-100"
                  style={{ color: "var(--error)" }}
                  title="Eliminar rango"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M8 6V4h8v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Línea 2: horario + duración */}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">{item.start_time.slice(0, 5)}</span>
              <span className="text-sm text-[var(--muted-2)]">–</span>
              <span className="text-sm font-medium text-[var(--foreground)]">{item.end_time.slice(0, 5)}</span>
              <span className="text-xs text-[var(--muted)]">· c/ {item.slot_duration_minutes} min</span>
            </div>
          </>
        )}
      </div>

      {isEditing ? (
        <EditRangeModal item={item} clubs={clubs} onClose={() => setIsEditing(false)} />
      ) : null}
    </>
  );
}

type DaySectionProps = {
  day: (typeof dayOptions)[number];
  dayRanges: AvailabilityRow[];
  clubs: Array<{ id: number; nombre: string }>;
};

function DayScheduleSection({ day, dayRanges, clubs }: DaySectionProps) {
  const [isCreating, startTransition] = useTransition();
  const [createState, setCreateState] = useState<DisponibilidadActionState>(initialState);
  const [isAdding, setIsAdding] = useState(false);

  // Hora de inicio sugerida: justo después del último rango existente, o 08:00 por defecto.
  const lastRange = dayRanges[dayRanges.length - 1];
  const defaultStart = lastRange ? toTimeValue(toMinutes(lastRange.end_time.slice(0, 5))) : "08:00";
  const defaultEnd = suggestEnd(defaultStart);

  const [newStart, setNewStart] = useState(defaultStart);
  const [newEnd, setNewEnd] = useState(defaultEnd);
  const [timeError, setTimeError] = useState<string | null>(null);

  function handleNewStartChange(value: string) {
    setNewStart(value);
    if (toMinutes(newEnd) <= toMinutes(value)) {
      setNewEnd(suggestEnd(value));
    }
    setTimeError(null);
  }

  function handleOpen() {
    setNewStart(defaultStart);
    setNewEnd(suggestEnd(defaultStart));
    setTimeError(null);
    setIsAdding(true);
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
      <h3 className="text-base font-semibold text-[var(--foreground)]">{day.label}</h3>

      {dayRanges.length === 0 && !isAdding ? (
        <p className="mt-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Sin horarios cargados.
        </p>
      ) : null}

      <div className="mt-2 grid gap-2">
        {dayRanges.map((item) => (
          <FrequentRangeRow key={item.id} item={item} clubs={clubs} />
        ))}

        {isAdding ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              if (toMinutes(newEnd) <= toMinutes(newStart)) {
                setTimeError("La hora de fin debe ser mayor que la hora de inicio.");
                return;
              }
              setTimeError(null);

              startTransition(async () => {
                const result = await saveAvailabilityAction(initialState, formData);
                setCreateState(result);

                if (!result.error) {
                  setIsAdding(false);
                  setCreateState(initialState);
                }
              });
            }}
            className="flex items-start gap-2 rounded-md border border-[var(--border-misu)] px-3 py-2"
          >
            <input type="hidden" name="day_of_week" value={day.value} />

            {/* Campos: club + horario + duración */}
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2">
              <ClubSelector defaultValue={null} clubs={clubs} disabled={isCreating} />

              <div className="flex items-center gap-1.5">
                <select
                  name="start_time"
                  value={newStart}
                  onChange={(e) => handleNewStartChange(e.target.value)}
                  className="select h-8 !w-[90px] !py-0 leading-none"
                  required
                >
                  {timeOptions.map((option) => (
                    <option key={`new-start-${day.value}-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <span className="text-sm text-[var(--muted-2)]">–</span>

                <select
                  name="end_time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="select h-8 !w-[90px] !py-0 leading-none"
                  required
                >
                  {timeOptions
                    .filter((option) => toMinutes(option.value) > toMinutes(newStart))
                    .map((option) => (
                      <option key={`new-end-${day.value}-${option.value}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  name="slot_duration_minutes"
                  min={30}
                  step={30}
                  defaultValue={60}
                  className="input h-8 !w-[60px] !py-0 text-center leading-none"
                  required
                />
                <span className="text-xs text-[var(--muted)]">min</span>
              </div>

              {timeError ? <p className="w-full text-xs font-medium" style={{ color: "var(--error)" }}>{timeError}</p> : null}
              {createState.error ? <p className="w-full text-xs font-medium" style={{ color: "var(--error)" }}>{createState.error}</p> : null}
            </div>

            {/* Botones apilados a la derecha */}
            <div className="flex shrink-0 flex-col gap-1">
              <button
                type="submit"
                disabled={isCreating}
                className="btn-primary h-8 px-3 text-xs leading-none"
              >
                {isCreating ? "..." : "Agregar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setCreateState(initialState);
                  setTimeError(null);
                }}
                className="btn-ghost h-8 px-3 text-xs leading-none"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : null}
      </div>

      <div className="mt-2">
        {!isAdding ? (
          <button
            type="button"
            onClick={handleOpen}
            className="mt-1 flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--misu-light)" }}
          >
            <span>+</span>
            <span>Agregar horario</span>
          </button>
        ) : null}
      </div>

      
    </section>
  );
}

export function FrequentScheduleManager({ availability, clubs, bare = false }: FrequentScheduleManagerProps) {
  const initialSelectedDays = useMemo(() => {
    const fromAvailability = Array.from(new Set(availability.map((item) => item.day_of_week)));
    if (fromAvailability.length > 0) {
      return fromAvailability;
    }
    return [1];
  }, [availability]);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialSelectedDays);

  const rangesByDay = useMemo(() => {
    const map = new Map<number, AvailabilityRow[]>();
    dayOptions.forEach((day) => map.set(day.value, []));
    availability.forEach((item) => {
      const list = map.get(item.day_of_week) ?? [];
      list.push(item);
      map.set(item.day_of_week, list);
    });
    for (const [key, list] of map.entries()) {
      map.set(
        key,
        list.sort((a, b) => a.start_time.localeCompare(b.start_time)),
      );
    }
    return map;
  }, [availability]);

  function toggleDay(dayValue: number) {
    setSelectedDays((current) => {
      if (current.includes(dayValue)) {
        if (current.length === 1) return current;
        return current.filter((value) => value !== dayValue);
      }
      return [...current, dayValue];
    });
  }

  return (
    <div
      className={bare ? "w-full" : "mx-auto w-full max-w-xl rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"}
    >
      {!bare ? (
        <>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Horario frecuente</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Marcá los días y cargá los rangos horarios que se repiten semana a semana.
          </p>
        </>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {dayOptions.map((day) => {
          const isActive = selectedDays.includes(day.value);
          const hasRanges = (rangesByDay.get(day.value) ?? []).length > 0;
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className="relative h-9 rounded-md border px-3 text-sm font-medium leading-none transition-colors"
              style={
                isActive
                  ? { background: "var(--misu-subtle)", borderColor: "var(--border-misu)", color: "var(--misu-light)" }
                  : { background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--foreground)" }
              }
            >
              {day.short}
              {hasRanges && !isActive ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full" style={{ background: "var(--misu)" }} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3">
        {dayOptions
          .filter((day) => selectedDays.includes(day.value))
          .map((day) => (
            <DayScheduleSection
              key={day.value}
              day={day}
              dayRanges={rangesByDay.get(day.value) ?? []}
              clubs={clubs}
            />
          ))}
      </div>
    </div>
  );
}

