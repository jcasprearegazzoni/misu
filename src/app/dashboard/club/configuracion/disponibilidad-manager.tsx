"use client";

import { useActionState, useEffect, useMemo, useState, type Dispatch, type SetStateAction, type ReactNode } from "react";
import {
  deleteDisponibilidadAction,
  upsertDisponibilidadAction,
  type ClubConfiguracionActionState,
} from "./actions";

export type DeporteConfiguracion = "tenis" | "padel" | "futbol";

type DisponibilidadItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
};

type DisponibilidadManagerProps = {
  items: DisponibilidadItem[];
  selectedDeporte: DeporteConfiguracion;
};

type FormMode = "hidden" | "add" | "edit";

const initialState: ClubConfiguracionActionState = {
  error: null,
  success: null,
  submitted: {},
};

const orderedDays = [1, 2, 3, 4, 5, 6, 0];
const dayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

function dayOptions() {
  return orderedDays.map((day) => ({
    value: day,
    label: dayLabels[day],
  }));
}

function getSportTheme(deporte: DeporteConfiguracion) {
  if (deporte === "tenis") return { border: "rgba(34, 197, 94, 0.4)", activeBg: "#16a34a" };
  if (deporte === "padel") return { border: "rgba(245, 158, 11, 0.4)", activeBg: "#d97706" };
  return { border: "rgba(59, 130, 246, 0.4)", activeBg: "#2563eb" };
}

function formatHourLabel(value: string) {
  const label = value.slice(0, 5);
  return label === "23:59" ? "24:00" : label;
}

function IconButton({
  children,
  title,
  type = "button",
  onClick,
  danger = false,
}: {
  children: ReactNode;
  title: string;
  type?: "button" | "submit";
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      aria-label={title}
      title={title}
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
      style={{
        borderColor: "var(--border)",
        color: danger ? "var(--error)" : "var(--foreground)",
        background: danger ? "rgba(239, 68, 68, 0.12)" : "var(--surface-1)",
      }}
    >
      {children}
    </button>
  );
}

type FormProps = {
  mode: "add" | "edit";
  editingItem: DisponibilidadItem | null;
  selectedDeporte: DeporteConfiguracion;
  sportTheme: { border: string; activeBg: string };
  selectedDaysForAdd: number[];
  setSelectedDaysForAdd: Dispatch<SetStateAction<number[]>>;
  formKey: number;
  formAction: (payload: FormData) => void;
  state: ClubConfiguracionActionState;
  isPending: boolean;
  onCancel: () => void;
};

function DisponibilidadForm({
  mode,
  editingItem,
  selectedDeporte,
  sportTheme,
  selectedDaysForAdd,
  setSelectedDaysForAdd,
  formKey,
  formAction,
  state,
  isPending,
  onCancel,
}: FormProps) {
  const toggleDayForAdd = (day: number) => {
    setSelectedDaysForAdd((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== day);
      }
      return [...prev, day].sort((a, b) => orderedDays.indexOf(a) - orderedDays.indexOf(b));
    });
  };

  return (
    <form
      key={`${selectedDeporte}-${mode}-${editingItem?.id ?? "new"}-${formKey}`}
      action={formAction}
      className="grid gap-4 rounded-xl border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
    >
      {mode === "edit" && editingItem ? <input type="hidden" name="id" value={editingItem.id} /> : null}
      <input type="hidden" name="deporte" value={selectedDeporte} />
      {mode === "add" ? (
        <>
          <input type="hidden" name="day_of_week_multi" value={selectedDaysForAdd.join(",")} />
          <input type="hidden" name="day_of_week" value={selectedDaysForAdd[0] ?? 1} />
        </>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="label md:col-span-3">
          <span>{mode === "edit" ? "Dia" : "Dias"}</span>
          {mode === "edit" ? (
            <>
              <input
                type="hidden"
                name="day_of_week"
                value={state.submitted.day_of_week ?? String(editingItem?.day_of_week ?? 1)}
              />
              <div
                className="rounded-md border px-3 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}
              >
                {dayLabels[Number(state.submitted.day_of_week ?? String(editingItem?.day_of_week ?? 1))] ?? "Lunes"}
              </div>
            </>
          ) : (
            <div className="flex flex-wrap gap-2 rounded-lg border p-2" style={{ borderColor: "var(--border)" }}>
              {dayOptions().map((day) => {
                const selected = selectedDaysForAdd.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayForAdd(day.value)}
                    className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                    style={
                      selected
                        ? { background: sportTheme.activeBg, color: "#fff" }
                        : { border: "1px solid var(--border)", color: "var(--muted)" }
                    }
                  >
                    {day.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          )}
        </label>

        <label className="label">
          <span>Apertura</span>
          <input
            type="time"
            name="apertura"
            className="input"
            defaultValue={(state.submitted.apertura ?? editingItem?.apertura ?? "09:00:00").slice(0, 5)}
          />
        </label>

        <label className="label">
          <span>Cierre</span>
          <input
            type="time"
            name="cierre"
            className="input"
            defaultValue={(state.submitted.cierre ?? editingItem?.cierre ?? "21:00:00").slice(0, 5)}
          />
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Si cerras pasada medianoche, segui usando la misma jornada operativa.
          </span>
        </label>

        <div className="grid gap-2 md:col-span-2">
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Duraciones
          </span>
          <div className="flex flex-wrap gap-2">
            {[60, 90, 120].map((value) => {
              const checked =
                state.submitted[`duracion_${value}`] === "on"
                  ? true
                  : editingItem
                    ? editingItem.duraciones.includes(value)
                    : value === 60;
              return (
                <label key={value} className="cursor-pointer">
                  <input type="checkbox" name={`duracion_${value}`} defaultChecked={checked} className="peer sr-only" />
                  <span className="inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-sm font-medium text-[var(--foreground)] transition-colors peer-checked:border-[var(--accent)] peer-checked:bg-[var(--accent)] peer-checked:text-white">
                    {value} min
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isPending}
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}

export function DisponibilidadManager({ items, selectedDeporte }: DisponibilidadManagerProps) {
  const [state, formAction, isPending] = useActionState(upsertDisponibilidadAction, initialState);
  const [formMode, setFormMode] = useState<FormMode>("hidden");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [selectedDaysForAdd, setSelectedDaysForAdd] = useState<number[]>([1]);

  const sportTheme = getSportTheme(selectedDeporte);

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => item.deporte === selectedDeporte)
        .sort((a, b) => {
          const dayOrder = orderedDays.indexOf(a.day_of_week) - orderedDays.indexOf(b.day_of_week);
          if (dayOrder !== 0) return dayOrder;
          return a.apertura.localeCompare(b.apertura);
        }),
    [items, selectedDeporte],
  );

  const groupedByDay = useMemo(() => {
    const map = new Map<number, DisponibilidadItem[]>();
    orderedDays.forEach((day) => map.set(day, []));
    filteredItems.forEach((item) => {
      const list = map.get(item.day_of_week) ?? [];
      list.push(item);
      map.set(item.day_of_week, list);
    });
    return map;
  }, [filteredItems]);

  const editingItem = useMemo(
    () => (editingId ? filteredItems.find((item) => item.id === editingId) ?? null : null),
    [editingId, filteredItems],
  );

  useEffect(() => {
    if (!state.success) return;
    setFormMode("hidden");
    setEditingId(null);
    setSelectedDaysForAdd([1]);
    setFormKey((prev) => prev + 1);
  }, [state.success]);

  useEffect(() => {
    setFormMode("hidden");
    setEditingId(null);
    setSelectedDaysForAdd([1]);
    setFormKey((prev) => prev + 1);
  }, [selectedDeporte]);

  useEffect(() => {
    if (!state.error || formMode !== "add") return;
    if (!state.submitted.day_of_week_multi) return;

    const parsed = state.submitted.day_of_week_multi
      .split(",")
      .map((item) => Number(item))
      .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);

    if (parsed.length > 0) {
      setSelectedDaysForAdd(Array.from(new Set(parsed)));
    }
  }, [formMode, state.error, state.submitted]);

  const closeForm = () => {
    setFormMode("hidden");
    setEditingId(null);
  };

  return (
    <section className="rounded-xl border p-4" style={{ borderColor: sportTheme.border, background: "var(--surface-2)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Disponibilidad horaria
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Defini los dias y horarios disponibles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormMode("add");
            setEditingId(null);
            setSelectedDaysForAdd([1]);
            setFormKey((prev) => prev + 1);
          }}
          aria-label="Agregar disponibilidad"
          title="Agregar disponibilidad"
          className="flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
          style={{ borderColor: "var(--accent)", color: "#fff", background: "var(--accent)" }}
        >
          <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 4.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4A.75.75 0 0 1 10 4.5Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {formMode === "add" ? (
          <DisponibilidadForm
            mode="add"
            editingItem={null}
            selectedDeporte={selectedDeporte}
            sportTheme={sportTheme}
            selectedDaysForAdd={selectedDaysForAdd}
            setSelectedDaysForAdd={setSelectedDaysForAdd}
            formKey={formKey}
            formAction={formAction}
            state={state}
            isPending={isPending}
            onCancel={closeForm}
          />
        ) : null}

        {filteredItems.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No hay disponibilidad cargada para este deporte.
          </p>
        ) : (
          orderedDays.map((day) => {
            const dayItems = groupedByDay.get(day) ?? [];
            if (dayItems.length === 0) return null;
            return (
              <div key={day} className="grid gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                    {dayLabels[day]}
                  </span>
                  <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
                </div>
                <div className="grid gap-2">
                  {dayItems.map((item) => (
                    <div key={item.id} className="grid gap-2">
                      <div
                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                      >
                        <div className="grid gap-1">
                          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                            {formatHourLabel(item.apertura)} - {formatHourLabel(item.cierre)}
                          </p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>
                            Duraciones: {item.duraciones.join(", ")} min
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <IconButton
                            title="Editar disponibilidad"
                            onClick={() => {
                              setFormMode("edit");
                              setEditingId(item.id);
                              setFormKey((prev) => prev + 1);
                            }}
                          >
                            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.26l-3 1a.75.75 0 0 1-.95-.95l1-3a1 1 0 0 1 .26-.44l8.5-8.5Z" />
                            </svg>
                          </IconButton>
                          <form
                            action={deleteDisponibilidadAction}
                            onSubmit={(event) => {
                              if (!window.confirm("¿Seguro que querés eliminar esta disponibilidad?")) {
                                event.preventDefault();
                              }
                            }}
                          >
                            <input type="hidden" name="id" value={item.id} />
                            <IconButton type="submit" title="Eliminar disponibilidad" danger>
                              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M7.5 2.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4h4a.75.75 0 0 1 0 1.5h-.764l-.7 9.1A2 2 0 0 1 13.04 16.5H6.96a2 2 0 0 1-1.996-1.9l-.7-9.1H3.5a.75.75 0 0 1 0-1.5h4V2.75Zm1.5 1.25h2V3.5H9V4Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </IconButton>
                          </form>
                        </div>
                      </div>

                      {formMode === "edit" && editingId === item.id ? (
                        <DisponibilidadForm
                          mode="edit"
                          editingItem={item}
                          selectedDeporte={selectedDeporte}
                          sportTheme={sportTheme}
                          selectedDaysForAdd={selectedDaysForAdd}
                          setSelectedDaysForAdd={setSelectedDaysForAdd}
                          formKey={formKey}
                          formAction={formAction}
                          state={state}
                          isPending={isPending}
                          onCancel={closeForm}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
