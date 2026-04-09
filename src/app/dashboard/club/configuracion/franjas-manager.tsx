"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  deleteFranjaPrecioAction,
  upsertFranjaPrecioAction,
  type ClubConfiguracionActionState,
} from "./actions";
import type { DeporteConfiguracion } from "./disponibilidad-manager";

type FranjaItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  desde: string;
  hasta: string;
  duracion_minutos: number;
  precio: number;
  cancha_id: number | null;
};

type DisponibilidadItem = {
  deporte: DeporteConfiguracion;
  day_of_week: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
};

type FranjasManagerProps = {
  items: FranjaItem[];
  disponibilidadItems: DisponibilidadItem[];
  selectedDeporte: DeporteConfiguracion;
  canchas: { id: number; nombre: string; deporte: string }[];
};

type FormMode = "hidden" | "add" | "edit";
type PriceMode = "single" | "ranges";
type DurationOption = 60 | 90 | 120;

const durationOptions: DurationOption[] = [60, 90, 120];

const initialState: ClubConfiguracionActionState = {
  error: null,
  success: null,
  submitted: {},
};

function getSportTheme(deporte: DeporteConfiguracion) {
  if (deporte === "tenis") return { border: "rgba(34, 197, 94, 0.4)" };
  if (deporte === "padel") return { border: "rgba(245, 158, 11, 0.4)" };
  return { border: "rgba(59, 130, 246, 0.4)" };
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((item) => Number(item));
  return hours * 60 + minutes;
}

function formatHourLabel(value: string) {
  const label = value.slice(0, 5);
  return label === "23:59" ? "24:00" : label;
}

function normalizeTimeValue(value: string) {
  return value.slice(0, 5);
}

function getJornadaOperativa(rows: DisponibilidadItem[]) {
  if (rows.length === 0) return null;

  const withoutMidnight = rows.filter((row) => row.apertura !== "00:00");
  const withMidnight = rows.filter((row) => row.apertura === "00:00");

  const baseOpenSource = withoutMidnight.length > 0 ? withoutMidnight : rows;
  const apertura = baseOpenSource
    .map((row) => row.apertura)
    .sort((a, b) => parseMinutes(a) - parseMinutes(b))[0];

  if (withMidnight.length > 0) {
    const cierre = withMidnight
      .map((row) => row.cierre)
      .sort((a, b) => parseMinutes(b) - parseMinutes(a))[0];
    return { desde: apertura, hasta: cierre };
  }

  const cierre = rows
    .map((row) => row.cierre)
    .sort((a, b) => parseMinutes(b) - parseMinutes(a))[0];
  return { desde: apertura, hasta: cierre };
}

function isFranjaCoveredByDisponibilidad(
  franja: FranjaItem,
  disponibilidadRows: DisponibilidadItem[],
) {
  const candidates = disponibilidadRows
    .filter((row) => row.duraciones.includes(franja.duracion_minutos))
    .map((row) => ({
      apertura: parseMinutes(row.apertura),
      cierre: parseMinutes(row.cierre),
    }))
    .sort((a, b) => a.apertura - b.apertura);

  if (candidates.length === 0) return false;

  const desde = parseMinutes(franja.desde);
  const hasta = parseMinutes(franja.hasta);

  let coveredUntil = desde;
  for (const candidate of candidates) {
    if (candidate.cierre <= coveredUntil) continue;
    if (candidate.apertura > coveredUntil) break;
    coveredUntil = Math.max(coveredUntil, candidate.cierre);
    if (coveredUntil >= hasta) return true;
  }

  return false;
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

export function FranjasManager({ items, disponibilidadItems, selectedDeporte, canchas }: FranjasManagerProps) {
  const [state, formAction, isPending] = useActionState(upsertFranjaPrecioAction, initialState);
  const [formMode, setFormMode] = useState<FormMode>("hidden");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDuration, setFormDuration] = useState<DurationOption | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [priceMode, setPriceMode] = useState<PriceMode>("ranges");
  const sportTheme = getSportTheme(selectedDeporte);

  const disponibilidadForSport = useMemo(
    () => disponibilidadItems.filter((item) => item.deporte === selectedDeporte),
    [disponibilidadItems, selectedDeporte],
  );

  const filteredItems = useMemo(
    () =>
      items
        .filter((item) => item.deporte === selectedDeporte)
        .sort((a, b) => {
          const durationOrder = a.duracion_minutos - b.duracion_minutos;
          if (durationOrder !== 0) return durationOrder;
          return a.desde.localeCompare(b.desde);
        }),
    [items, selectedDeporte],
  );

  const jornadaOperativa = useMemo(
    () => getJornadaOperativa(disponibilidadForSport),
    [disponibilidadForSport],
  );
  const canchasDeporte = useMemo(
    () => canchas.filter((c) => c.deporte === selectedDeporte),
    [canchas, selectedDeporte],
  );

  const invalidKeys = useMemo(() => {
    const set = new Set<string>();
    filteredItems.forEach((item) => {
      const key = `${item.desde}-${item.hasta}-${item.duracion_minutos}-${item.precio}-${item.cancha_id ?? "global"}`;
      if (!isFranjaCoveredByDisponibilidad(item, disponibilidadForSport)) {
        set.add(key);
      }
    });
    return set;
  }, [filteredItems, disponibilidadForSport]);

  const groupedByDuration = useMemo(() => {
    const grouped = new Map<DurationOption, Array<{ key: string; item: FranjaItem }>>();
    durationOptions.forEach((duration) => grouped.set(duration, []));

    const dedup = new Map<string, FranjaItem>();
    filteredItems.forEach((item) => {
      const key = `${item.desde}-${item.hasta}-${item.duracion_minutos}-${item.precio}-${item.cancha_id ?? "global"}`;
      if (!dedup.has(key)) dedup.set(key, item);
    });

    Array.from(dedup.values())
      .sort((a, b) => {
        const durationOrder = a.duracion_minutos - b.duracion_minutos;
        if (durationOrder !== 0) return durationOrder;
        return a.desde.localeCompare(b.desde);
      })
      .forEach((item) => {
        const duration = item.duracion_minutos as DurationOption;
        const list = grouped.get(duration);
        if (!list) return;
        list.push({
          key: `${item.desde}-${item.hasta}-${item.duracion_minutos}-${item.precio}-${item.cancha_id ?? "global"}`,
          item,
        });
      });

    return grouped;
  }, [filteredItems]);

  const editingItem = useMemo(
    () => (editingId ? filteredItems.find((item) => item.id === editingId) ?? null : null),
    [editingId, filteredItems],
  );

  useEffect(() => {
    if (state.success) {
      setFormMode("hidden");
      setEditingId(null);
      setFormDuration(null);
      setFormKey((prev) => prev + 1);
    }
  }, [state.success]);

  useEffect(() => {
    if (state.error) {
      setFormKey((prev) => prev + 1);
    }
  }, [state.error]);

  useEffect(() => {
    setFormMode("hidden");
    setEditingId(null);
    setFormDuration(null);
    setFormKey((prev) => prev + 1);
    setPriceMode("ranges");
  }, [selectedDeporte]);

  return (
    <section
      className="rounded-xl border p-4"
      style={{ borderColor: sportTheme.border, background: "var(--surface-2)" }}
    >
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Precios por franja
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Defini precio, horario y duracion para este deporte.
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPriceMode("single")}
            className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={
              priceMode === "single"
                ? { background: "var(--accent)", color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--muted)" }
            }
          >
            Precio unico
          </button>
          <button
            type="button"
            onClick={() => setPriceMode("ranges")}
            className="rounded-full px-3 py-1 text-sm font-medium transition-colors"
            style={
              priceMode === "ranges"
                ? { background: "var(--accent)", color: "#fff" }
                : { border: "1px solid var(--border)", color: "var(--muted)" }
            }
          >
            Precio por franja
          </button>
        </div>

        {priceMode === "single" ? (
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            {jornadaOperativa ? (
              <>
                <div
                  className="mb-3 rounded-md border px-3 py-2"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted-2)" }}
                  >
                    Jornada operativa
                  </p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {formatHourLabel(jornadaOperativa.desde)} - {formatHourLabel(jornadaOperativa.hasta)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    Este valor se aplica para todo el deporte seleccionado.
                  </p>
                </div>

                <form
                  key={`single-${selectedDeporte}-${formKey}`}
                  action={formAction}
                  className="mt-3 grid gap-4 md:grid-cols-2"
                >
                  <input type="hidden" name="deporte" value={selectedDeporte} />
                  <input type="hidden" name="desde" value={normalizeTimeValue(jornadaOperativa.desde)} />
                  <input type="hidden" name="hasta" value={normalizeTimeValue(jornadaOperativa.hasta)} />
                  {canchasDeporte.length > 0 ? (
                    <label className="label md:col-span-2">
                      <span>Cancha (opcional)</span>
                      <select name="cancha_id" className="select" defaultValue="">
                        <option value="">Todas las canchas (precio global)</option>
                        {canchasDeporte.map((c) => (
                          <option key={c.id} value={String(c.id)}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <label className="label">
                    <span>Duracion</span>
                    <select
                      name="duracion_minutos"
                      className="select"
                      defaultValue={state.submitted.duracion_minutos ?? "60"}
                    >
                      <option value="60">60 min</option>
                      <option value="90">90 min</option>
                      <option value="120">120 min</option>
                    </select>
                  </label>

                  <label className="label">
                    <span>Precio (ARS)</span>
                    <input
                      type="number"
                      name="precio"
                      className="input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      min="0"
                      step="0.01"
                      defaultValue={state.submitted.precio ?? "0"}
                      style={{ MozAppearance: "textfield" }}
                    />
                  </label>

                  <p className="text-xs md:col-span-2" style={{ color: "var(--muted)" }}>
                    Si despues queres valores distintos por horario, usa la opcion <strong>Precio por franja</strong>.
                  </p>

                  {state.error ? <p className="alert-error md:col-span-2">{state.error}</p> : null}
                  {state.success ? <p className="alert-success md:col-span-2">{state.success}</p> : null}

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="btn-primary transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      disabled={isPending}
                    >
                      {isPending ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <p className="alert-error">Primero carga la disponibilidad para definir la jornada operativa.</p>
            )}
          </div>
        ) : null}

        {priceMode === "ranges" ? (
          <>
            {invalidKeys.size > 0 ? (
              <p className="alert-error">
                Hay franjas fuera de la disponibilidad actual. Revisalas para que puedan generar turnos.
              </p>
            ) : null}

            {durationOptions.map((duration) => {
              const rows = groupedByDuration.get(duration) ?? [];
              const isFormVisible = formMode !== "hidden" && formDuration === duration;
              const hasSubmittedData = Object.keys(state.submitted).length > 0;
              const submittedMatchesThisBlock =
                hasSubmittedData &&
                Number(state.submitted.duracion_minutos ?? duration) === duration;

              return (
                <section
                  key={duration}
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Duracion {duration} min
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Carga o edita tramos de precio para esta duracion.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormMode("add");
                        setEditingId(null);
                        setFormDuration(duration);
                        setFormKey((prev) => prev + 1);
                      }}
                      className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                      style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}
                    >
                      + Agregar franja
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {rows.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        No hay franjas cargadas para {duration} min.
                      </p>
                    ) : (
                      rows.map(({ key, item }) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            borderColor: invalidKeys.has(key) ? "var(--error)" : "var(--border)",
                            background: "var(--surface-2)",
                          }}
                        >
                          <div className="grid gap-1">
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {formatHourLabel(item.desde)} - {formatHourLabel(item.hasta)}
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                              {arsFormatter.format(Number(item.precio))}
                            </p>
                            <p className="text-xs" style={{ color: "var(--muted)" }}>
                              {item.cancha_id
                                ? (canchasDeporte.find((c) => c.id === item.cancha_id)?.nombre ?? `Cancha ${item.cancha_id}`)
                                : "Todas las canchas"}
                            </p>
                            {invalidKeys.has(key) ? (
                              <p className="text-xs font-medium" style={{ color: "var(--error)" }}>
                                Fuera de disponibilidad.
                              </p>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2">
                            <IconButton
                              title="Editar franja"
                              onClick={() => {
                                setFormMode("edit");
                                setEditingId(item.id);
                                setFormDuration(duration);
                                setFormKey((prev) => prev + 1);
                              }}
                            >
                              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.26l-3 1a.75.75 0 0 1-.95-.95l1-3a1 1 0 0 1 .26-.44l8.5-8.5Z" />
                              </svg>
                            </IconButton>
                            <form
                              action={deleteFranjaPrecioAction}
                              onSubmit={(event) => {
                                if (!window.confirm("Seguro que queres eliminar esta franja de precio?")) {
                                  event.preventDefault();
                                }
                              }}
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <IconButton type="submit" title="Eliminar franja" danger>
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
                      ))
                    )}
                  </div>

                  {isFormVisible ? (
                    <form
                      key={`${selectedDeporte}-${duration}-${formMode}-${editingId ?? "new"}-${formKey}`}
                      action={formAction}
                      className="mt-4 grid gap-4 rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                    >
                      {formMode === "edit" && editingItem ? <input type="hidden" name="id" value={editingItem.id} /> : null}
                      <input type="hidden" name="deporte" value={selectedDeporte} />
                      <input type="hidden" name="duracion_minutos" value={String(duration)} />
                      {canchasDeporte.length > 0 ? (
                        <label className="label">
                          <span>Cancha (opcional)</span>
                          <select
                            name="cancha_id"
                            className="select"
                            defaultValue={
                              submittedMatchesThisBlock
                                ? (state.submitted.cancha_id ?? "")
                                : String(editingItem?.cancha_id ?? "")
                            }
                          >
                            <option value="">Todas las canchas (precio global)</option>
                            {canchasDeporte.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.nombre}
                              </option>
                            ))}
                          </select>
                        </label>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="label">
                          <span>Desde</span>
                          <input
                            type="time"
                            name="desde"
                            className="input"
                            defaultValue={
                              submittedMatchesThisBlock
                                ? (state.submitted.desde ?? "09:00")
                                : (editingItem?.desde ?? "09:00:00").slice(0, 5)
                            }
                          />
                        </label>

                        <label className="label">
                          <span>Hasta</span>
                          <input
                            type="time"
                            name="hasta"
                            className="input"
                            defaultValue={
                              submittedMatchesThisBlock
                                ? (state.submitted.hasta ?? "21:00")
                                : (editingItem?.hasta ?? "21:00:00").slice(0, 5)
                            }
                          />
                        </label>

                        <label className="label md:col-span-2">
                          <span>Precio (ARS)</span>
                          <input
                            type="number"
                            name="precio"
                            className="input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            min="0"
                            step="0.01"
                            defaultValue={
                              submittedMatchesThisBlock
                                ? (state.submitted.precio ?? "0")
                                : String(editingItem?.precio ?? 0)
                            }
                            style={{ MozAppearance: "textfield" }}
                          />
                        </label>
                      </div>

                      {state.error ? <p className="alert-error">{state.error}</p> : null}
                      {state.success ? <p className="alert-success">{state.success}</p> : null}

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setFormMode("hidden");
                            setEditingId(null);
                            setFormDuration(null);
                          }}
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
                  ) : null}
                </section>
              );
            })}
          </>
        ) : null}
      </div>
    </section>
  );
}
