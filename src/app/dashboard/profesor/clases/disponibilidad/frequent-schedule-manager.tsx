"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
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
  defaultValue,
  clubs,
  disabled,
}: {
  defaultValue: number | null;
  clubs: Array<{ id: number; nombre: string }>;
  disabled: boolean;
}) {
  return (
    <select
      name="club_id"
      defaultValue={defaultValue ?? ""}
      className="select h-9 min-w-[120px] w-full !py-0 leading-none"
      disabled={disabled}
    >
      <option value="">Particulares</option>
      {clubs.map((club) => (
        <option key={club.id} value={club.id}>
          {club.nombre}
        </option>
      ))}
    </select>
  );
}

function FrequentRangeRow({ item, clubs }: RowFormProps) {
  const [state, formAction, isPending] = useActionState(saveAvailabilityAction, initialState);
  const [startTime, setStartTime] = useState(item.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(item.end_time.slice(0, 5));
  const [timeError, setTimeError] = useState<string | null>(null);

  function handleStartChange(value: string) {
    setStartTime(value);
    // Si el fin actual es igual o anterior al nuevo inicio, lo ajustamos a inicio + 1h.
    if (toMinutes(endTime) <= toMinutes(value)) {
      setEndTime(suggestEnd(value));
    }
    setTimeError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (toMinutes(endTime) <= toMinutes(startTime)) {
          event.preventDefault();
          setTimeError("La hora de fin debe ser mayor que la hora de inicio.");
          return;
        }
        setTimeError(null);
      }}
      className="grid gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2"
    >
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="day_of_week" value={item.day_of_week} />
      <div className="flex flex-wrap items-center gap-1.5">
        <ClubSelector defaultValue={item.club_id} clubs={clubs} disabled={isPending} />
        <select
          name="start_time"
          value={startTime}
          onChange={(e) => handleStartChange(e.target.value)}
          className="select h-9 w-[96px] !py-0 leading-none sm:w-[104px]"
          required
        >
          {timeOptions.map((option) => (
            <option key={`start-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-[var(--muted-2)]">a</span>
        <select
          name="end_time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="select h-9 w-[96px] !py-0 leading-none sm:w-[104px]"
          required
        >
          {timeOptions
            .filter((option) => toMinutes(option.value) > toMinutes(startTime))
            .map((option) => (
              <option key={`end-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
        </select>
        <button
          formAction={deleteAvailabilityAction}
          className="btn-ghost ml-auto h-9 w-9 leading-none"
          style={{ color: "var(--error)" }}
          title="Eliminar rango"
        >
          ×
        </button>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-[auto_80px_auto] sm:items-center">
        <span className="text-xs font-medium text-[var(--muted)]">Duración (min)</span>
        <input
          type="number"
          name="slot_duration_minutes"
          min={30}
          step={30}
          defaultValue={item.slot_duration_minutes}
          className="input h-9 w-20 !py-0 text-center leading-none"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="btn-secondary h-9 px-3 text-xs leading-none"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {timeError ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--error)" }}>{timeError}</p> : null}
      {state.error ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--error)" }}>{state.error}</p> : null}
      {state.success ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--success)" }}>{state.success}</p> : null}
    </form>
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

      {dayRanges.length === 0 ? (
        <p className="mt-2 rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Sin horarios cargados.
        </p>
      ) : (
        <div className="mt-2 grid gap-2">
          {dayRanges.map((item) => (
            <FrequentRangeRow key={item.id} item={item} clubs={clubs} />
          ))}
        </div>
      )}

      {!isAdding ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleOpen}
            className="mt-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--misu-light)" }}
          >
            <span>+</span>
            <span>Agregar horario</span>
          </button>
        </div>
      ) : (
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
          className="mt-2 grid gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] p-2"
        >
          <input type="hidden" name="day_of_week" value={day.value} />
          <div className="flex flex-wrap items-center gap-1.5">
            <ClubSelector defaultValue={null} clubs={clubs} disabled={isCreating} />
            <select
              name="start_time"
              value={newStart}
              onChange={(e) => handleNewStartChange(e.target.value)}
              className="select h-9 w-[96px] !py-0 leading-none sm:w-[104px]"
              required
            >
              {timeOptions.map((option) => (
                <option key={`new-start-${day.value}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-[var(--muted-2)]">a</span>
            <select
              name="end_time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="select h-9 w-[96px] !py-0 leading-none sm:w-[104px]"
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

          <div className="grid gap-1.5 sm:grid-cols-[auto_80px_auto_auto] sm:items-center">
            <span className="text-xs font-medium text-[var(--muted)]">Duración (min)</span>
            <input
              type="number"
              name="slot_duration_minutes"
              min={30}
              step={30}
              defaultValue={60}
              className="input h-9 w-20 !py-0 text-center leading-none"
              required
            />
            <button
              type="submit"
              disabled={isCreating}
              className="btn-primary h-9 px-3 text-xs leading-none"
            >
              {isCreating ? "Guardando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setCreateState(initialState);
                setTimeError(null);
              }}
              className="btn-ghost h-9 px-3 text-xs leading-none"
            >
              Cancelar
            </button>
          </div>

          {timeError ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--error)" }}>{timeError}</p> : null}
          {createState.error ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--error)" }}>{createState.error}</p> : null}
          {createState.success ? <p className="mt-1 text-xs font-medium" style={{ color: "var(--success)" }}>{createState.success}</p> : null}
        </form>
      )}
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

