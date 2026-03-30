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
};

type FrequentScheduleManagerProps = {
  availability: AvailabilityRow[];
};

const dayOptions = [
  { value: 1, short: "Lu", label: "Lunes" },
  { value: 2, short: "Ma", label: "Martes" },
  { value: 3, short: "Mi", label: "Miercoles" },
  { value: 4, short: "Ju", label: "Jueves" },
  { value: 5, short: "Vi", label: "Viernes" },
  { value: 6, short: "Sa", label: "Sabado" },
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
};

function FrequentRangeRow({ item }: RowFormProps) {
  const [state, formAction, isPending] = useActionState(saveAvailabilityAction, initialState);
  const [startTime, setStartTime] = useState(item.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(item.end_time.slice(0, 5));

  function handleStartChange(value: string) {
    setStartTime(value);
    // Si el fin actual es igual o anterior al nuevo inicio, lo ajustamos a inicio + 1h.
    if (toMinutes(endTime) <= toMinutes(value)) {
      setEndTime(suggestEnd(value));
    }
  }

  return (
    <form action={formAction} className="grid gap-1.5 rounded-md border border-zinc-200 bg-white p-2">
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="day_of_week" value={item.day_of_week} />
      <div className="flex flex-wrap items-center gap-1.5">
        <select
          name="start_time"
          value={startTime}
          onChange={(e) => handleStartChange(e.target.value)}
          className="h-9 w-[104px] rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
          required
        >
          {timeOptions.map((option) => (
            <option key={`start-${option.value}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-zinc-500">a</span>
        <select
          name="end_time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="h-9 w-[104px] rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
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
          className="h-9 w-9 rounded-md border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50"
          title="Eliminar rango"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-zinc-600">Duración (min)</span>
        <input
          type="number"
          name="slot_duration_minutes"
          min={30}
          step={30}
          defaultValue={item.slot_duration_minutes}
          className="h-9 w-20 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
          required
        />
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-md border border-zinc-300 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {state.error ? <p className="text-xs font-medium text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-xs font-medium text-emerald-700">{state.success}</p> : null}
    </form>
  );
}

type DaySectionProps = {
  day: (typeof dayOptions)[number];
  dayRanges: AvailabilityRow[];
};

function DayScheduleSection({ day, dayRanges }: DaySectionProps) {
  const [isCreating, startTransition] = useTransition();
  const [createState, setCreateState] = useState<DisponibilidadActionState>(initialState);
  const [isAdding, setIsAdding] = useState(false);

  // Hora de inicio sugerida: justo después del último rango existente, o 08:00 por defecto.
  const lastRange = dayRanges[dayRanges.length - 1];
  const defaultStart = lastRange ? toTimeValue(toMinutes(lastRange.end_time.slice(0, 5))) : "08:00";
  const defaultEnd = suggestEnd(defaultStart);

  const [newStart, setNewStart] = useState(defaultStart);
  const [newEnd, setNewEnd] = useState(defaultEnd);

  function handleNewStartChange(value: string) {
    setNewStart(value);
    if (toMinutes(newEnd) <= toMinutes(value)) {
      setNewEnd(suggestEnd(value));
    }
  }

  function handleOpen() {
    setNewStart(defaultStart);
    setNewEnd(suggestEnd(defaultStart));
    setIsAdding(true);
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
      <h3 className="text-base font-semibold text-zinc-900">{day.label}</h3>

      {dayRanges.length === 0 ? (
        <p className="mt-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
          Sin horarios cargados.
        </p>
      ) : (
        <div className="mt-2 grid gap-2">
          {dayRanges.map((item) => (
            <FrequentRangeRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {!isAdding ? (
        <div className="mt-2">
          <button
            type="button"
            onClick={handleOpen}
            className="h-9 rounded-md border border-emerald-500 bg-white px-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            + Agregar horario
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await saveAvailabilityAction(initialState, formData);
              setCreateState(result);

              if (!result.error) {
                setIsAdding(false);
                setCreateState(initialState);
              }
            });
          }}
          className="mt-2 grid gap-1.5 rounded-md border border-zinc-200 bg-white p-2"
        >
          <input type="hidden" name="day_of_week" value={day.value} />
          <div className="flex flex-wrap items-center gap-1.5">
            <select
              name="start_time"
              value={newStart}
              onChange={(e) => handleNewStartChange(e.target.value)}
              className="h-9 w-[104px] rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
              required
            >
              {timeOptions.map((option) => (
                <option key={`new-start-${day.value}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-zinc-500">a</span>
            <select
              name="end_time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="h-9 w-[104px] rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-zinc-600">Duración (min)</span>
            <input
              type="number"
              name="slot_duration_minutes"
              min={30}
              step={30}
              defaultValue={60}
              className="h-9 w-20 rounded-md border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
              required
            />
            <button
              type="submit"
              disabled={isCreating}
              className="h-9 rounded-md border border-zinc-300 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
            >
              {isCreating ? "Guardando..." : "Agregar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setCreateState(initialState);
              }}
              className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>

          {createState.error ? <p className="text-xs font-medium text-red-700">{createState.error}</p> : null}
          {createState.success ? <p className="text-xs font-medium text-emerald-700">{createState.success}</p> : null}
        </form>
      )}
    </section>
  );
}

export function FrequentScheduleManager({ availability }: FrequentScheduleManagerProps) {
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
    <div className="mx-auto w-full max-w-xl rounded-lg border border-zinc-200 bg-white p-3">
      <h2 className="text-base font-semibold text-zinc-900">Horario frecuente</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Marcá los días y cargá los rangos horarios que se repiten semana a semana.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {dayOptions.map((day) => {
          const isActive = selectedDays.includes(day.value);
          const hasRanges = (rangesByDay.get(day.value) ?? []).length > 0;
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`relative h-9 rounded-md border px-3 text-sm font-medium ${
                isActive
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              {day.short}
              {hasRanges && !isActive ? (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3">
        {dayOptions
          .filter((day) => selectedDays.includes(day.value))
          .map((day) => (
            <DayScheduleSection key={day.value} day={day} dayRanges={rangesByDay.get(day.value) ?? []} />
          ))}
      </div>
    </div>
  );
}
