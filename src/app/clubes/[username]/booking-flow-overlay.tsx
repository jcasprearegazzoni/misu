"use client";

import { useEffect, useMemo, useState } from "react";
import { reservarCanchaFormAction } from "./actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DeporteVisible = "tenis" | "padel" | "futbol";

type SlotRow = {
  cancha_id: number;
  cancha_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  precio: number;
};

type SuccessState = {
  deporte?: string;
  fecha?: string;
  hora?: string;
  duracion?: string;
  canchaNombre?: string;
};

type CanchaInfo = {
  superficie: string;
  techada: boolean;
};

type Props = {
  clubId: number;
  clubUsername: string;
  clubNombre: string;
  nombrePrefill: string;
  emailPrefill: string;
  initialError: string | null;
  initialSuccess: SuccessState | null;
  canchasMap?: Record<number, CanchaInfo>;
};

type ConfirmandoState = {
  canchaId: number;
  canchaNombre: string;
  duracion: number;
  precio: number;
  horaFin: string;
} | null;

const DEPORTES_VISIBLES: DeporteVisible[] = ["tenis", "padel", "futbol"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function getSportTheme(deporte: DeporteVisible) {
  if (deporte === "tenis") return { active: "#16a34a", softBg: "rgba(22,163,74,0.12)", border: "rgba(34,197,94,0.45)" };
  if (deporte === "padel") return { active: "#d97706", softBg: "rgba(217,119,6,0.12)", border: "rgba(245,158,11,0.45)" };
  return { active: "#2563eb", softBg: "rgba(37,99,235,0.12)", border: "rgba(59,130,246,0.45)" };
}

function getDeporteLabel(deporte: DeporteVisible) {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  return "Futbol";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSuperficieCorta(value: string): string {
  const map: Record<string, string> = {
    polvo_ladrillo: "Polvo",
    sintetico: "Sintético",
    cemento: "Cemento",
    blindex: "Blindex",
    f5: "F5",
    f7: "F7",
    f8: "F8",
    f11: "F11",
  };
  return map[value] ?? value;
}

function getNowArgDate() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000);
}

function getTodayIsoArg() {
  return getNowArgDate().toISOString().slice(0, 10);
}

function getNowHourArg() {
  return getNowArgDate().toISOString().slice(11, 16);
}

function getWeekStartMonday(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date;
}

function getWeekDays(offset: number): { iso: string; label: string; num: string; isPast: boolean }[] {
  const todayIso = getTodayIsoArg();
  const monday = getWeekStartMonday(todayIso);
  monday.setUTCDate(monday.getUTCDate() + offset * 7);
  const labels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday.getTime());
    day.setUTCDate(monday.getUTCDate() + index);
    const iso = day.toISOString().slice(0, 10);
    return {
      iso,
      label: labels[index] ?? "",
      num: day.toISOString().slice(8, 10),
      isPast: iso < todayIso,
    };
  });
}

function formatWeekRange(offset: number): string {
  const days = getWeekDays(offset);
  const first = days[0]?.iso;
  const last = days[6]?.iso;
  if (!first || !last) return "";
  const d1 = new Date(`${first}T12:00:00.000Z`);
  const d2 = new Date(`${last}T12:00:00.000Z`);
  const m1 = d1.getUTCMonth();
  const m2 = d2.getUTCMonth();
  if (m1 === m2) {
    return `${d1.getUTCDate()} – ${d2.getUTCDate()} ${MESES_CORTOS[m2]}`;
  }
  return `${d1.getUTCDate()} ${MESES_CORTOS[m1]} – ${d2.getUTCDate()} ${MESES_CORTOS[m2]}`;
}

function formatFechaLarga(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = ((h ?? 0) * 60 + (m ?? 0) + minutes);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-4 text-sm" style={{ color: "var(--muted)" }}>
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"
        aria-hidden="true"
      />
      Cargando disponibilidad...
    </div>
  );
}

export function ClubBookingSection({
  clubId,
  clubUsername,
  nombrePrefill,
  emailPrefill,
  initialError,
  initialSuccess,
  canchasMap = {},
}: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [deportesDisponibles, setDeportesDisponibles] = useState<DeporteVisible[]>([]);
  const [deporteActivo, setDeporteActivo] = useState<DeporteVisible | null>(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [fechaActiva, setFechaActiva] = useState<string | null>(null);
  const [duracionActiva, setDuracionActiva] = useState<number | null>(null);
  const [horaActiva, setHoraActiva] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [confirmando, setConfirmando] = useState<ConfirmandoState>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadingDeportes, setLoadingDeportes] = useState(false);
  const [deportesError, setDeportesError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(initialError);
  const [successLocal, setSuccessLocal] = useState<SuccessState | null>(initialSuccess);

  const hoyIso = useMemo(() => getTodayIsoArg(), []);
  const daysOfWeek = useMemo(() => getWeekDays(semanaOffset), [semanaOffset]);
  const sportTheme = deporteActivo ? getSportTheme(deporteActivo) : null;

  useEffect(() => {
    if (!initialSuccess) return;
    window.history.replaceState(null, "", `/clubes/${clubUsername}`);
  }, [initialSuccess, clubUsername]);

  useEffect(() => {
    let cancelled = false;
    const loadDeportes = async () => {
      setLoadingDeportes(true);
      setDeportesError(null);
      const { data, error } = await supabase
        .from("club_disponibilidad")
        .select("deporte")
        .eq("club_id", clubId);
      if (cancelled) return;
      if (error) {
        setDeportesError("No se pudieron cargar los deportes.");
        setLoadingDeportes(false);
        return;
      }
      const list = Array.from(new Set((data ?? []).map((item) => item.deporte))).filter(
        (item): item is DeporteVisible => DEPORTES_VISIBLES.includes(item as DeporteVisible),
      );
      setDeportesDisponibles(list);
      setDeporteActivo((prev) => prev ?? list[0] ?? null);
      setLoadingDeportes(false);
    };
    void loadDeportes();
    return () => { cancelled = true; };
  }, [supabase, clubId]);

  useEffect(() => {
    if (!fechaActiva && daysOfWeek.length > 0) {
      const primerDiaDisponible = daysOfWeek.find((day) => !day.isPast);
      setFechaActiva(primerDiaDisponible?.iso ?? daysOfWeek[0]?.iso ?? null);
    }
  }, [daysOfWeek, fechaActiva]);

  useEffect(() => {
    if (!deporteActivo || !fechaActiva) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    const loadSlots = async () => {
      setLoadingSlots(true);
      setSlotsError(null);
      setConfirmando(null);
      const { data, error } = await supabase.rpc("get_club_slots_disponibles", {
        p_club_id: clubId,
        p_deporte: deporteActivo,
        p_fecha: fechaActiva,
      });
      if (cancelled) return;
      if (error) {
        setSlotsError("No se pudo cargar la disponibilidad.");
        setSlots([]);
        setLoadingSlots(false);
        return;
      }
      setSlots((data ?? []) as SlotRow[]);
      setLoadingSlots(false);
    };
    void loadSlots();
    return () => { cancelled = true; };
  }, [supabase, clubId, deporteActivo, fechaActiva]);

  const hourOptions = useMemo(() => {
    const unique = Array.from(new Set(slots.map((slot) => slot.hora_inicio.slice(0, 5)))).sort((a, b) =>
      a.localeCompare(b),
    );
    if (fechaActiva === hoyIso) {
      const horaActual = getNowHourArg();
      return unique.filter((hour) => hour > horaActual);
    }
    return unique;
  }, [slots, fechaActiva, hoyIso]);

  const slotsVisibles = useMemo(() => {
    if (fechaActiva !== hoyIso) return slots;
    const horaActual = getNowHourArg();
    return slots.filter((slot) => slot.hora_inicio.slice(0, 5) > horaActual);
  }, [slots, fechaActiva, hoyIso]);

  const duracionesDisponibles = useMemo(() => {
    return Array.from(new Set(slotsVisibles.map((slot) => slot.duracion_minutos))).sort((a, b) => a - b);
  }, [slotsVisibles]);

  useEffect(() => {
    if (duracionesDisponibles.length === 1) {
      setDuracionActiva(duracionesDisponibles[0] ?? null);
      return;
    }
    if (duracionActiva !== null && duracionesDisponibles.includes(duracionActiva)) return;
    setDuracionActiva(null);
  }, [duracionesDisponibles, duracionActiva]);

  const slotsFiltradosPorDuracion = useMemo(() => {
    if (duracionActiva === null) return [];
    return slotsVisibles
      .filter((slot) => slot.duracion_minutos === duracionActiva)
      .sort((a, b) => {
        const cmp = a.hora_inicio.slice(0, 5).localeCompare(b.hora_inicio.slice(0, 5));
        if (cmp !== 0) return cmp;
        return a.cancha_nombre.localeCompare(b.cancha_nombre, "es-AR");
      });
  }, [slotsVisibles, duracionActiva]);

  useEffect(() => {
    if (!horaActiva) return;
    if (hourOptions.includes(horaActiva)) return;
    setHoraActiva(null);
  }, [hourOptions, horaActiva]);

  return (
    <div>
      {/* Estado de éxito */}
      {successLocal ? (
        <div
          className="mb-4 rounded-xl border px-4 py-3"
          style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>
            ✓ Reserva confirmada
          </p>
          {successLocal.fecha && successLocal.hora && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--success)" }}>
              {successLocal.deporte
                ? `${successLocal.deporte.charAt(0).toUpperCase()}${successLocal.deporte.slice(1)} · `
                : ""}
              {formatFechaLarga(successLocal.fecha)} · {successLocal.hora}
              {successLocal.duracion
                ? ` – ${addMinutesToTime(successLocal.hora, Number(successLocal.duracion))}`
                : ""}
              {successLocal.canchaNombre ? ` · ${successLocal.canchaNombre}` : ""}
            </p>
          )}
        </div>
      ) : null}

      {/* Error */}
      {errorLocal ? (
        <div
          className="mb-4 rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error)" }}
        >
          {errorLocal}
        </div>
      ) : null}

      {/* Pills de deporte */}
      <div role="tablist" aria-label="Deportes disponibles">
        {loadingDeportes ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando deportes...</p>
        ) : deportesError ? (
          <p className="text-sm" style={{ color: "var(--error)" }}>{deportesError}</p>
        ) : deportesDisponibles.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No hay deportes disponibles para reservas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {deportesDisponibles.map((deporte) => {
              const isActive = deporteActivo === deporte;
              const theme = getSportTheme(deporte);
              return (
                <button
                  key={deporte}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className="rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                  style={
                    isActive
                      ? { background: theme.active, color: "#fff" }
                      : {
                          background: theme.softBg,
                          border: `1px solid ${theme.border}`,
                          color: "var(--muted)",
                        }
                  }
                  onClick={() => {
                    setDeporteActivo(deporte);
                    setDuracionActiva(null);
                    setHoraActiva(null);
                    setConfirmando(null);
                    setErrorLocal(null);
                    setSuccessLocal(null);
                  }}
                >
                  {getDeporteLabel(deporte)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Navegación de semana */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-80"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
          onClick={() => {
            setSemanaOffset((o) => Math.max(0, o - 1));
            setDuracionActiva(null);
            setHoraActiva(null);
            setConfirmando(null);
          }}
          disabled={semanaOffset === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {formatWeekRange(semanaOffset)}
        </span>

        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-80"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
          onClick={() => {
            setSemanaOffset((o) => Math.min(3, o + 1));
            setDuracionActiva(null);
            setHoraActiva(null);
            setConfirmando(null);
          }}
          disabled={semanaOffset >= 3}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Selector de días */}
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {daysOfWeek.map((day) => {
          const isActive = fechaActiva === day.iso;
          return (
            <button
              key={day.iso}
              type="button"
              onClick={() => {
                setFechaActiva(day.iso);
                setDuracionActiva(null);
                setHoraActiva(null);
                setConfirmando(null);
              }}
              disabled={day.isPast}
              className="rounded-lg border py-3 text-center text-xs transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: isActive ? (sportTheme?.active ?? "var(--misu)") : "var(--border)",
                background: isActive ? (sportTheme?.active ?? "var(--misu)") : "var(--surface-2)",
                color: isActive ? "#fff" : "var(--foreground)",
              }}
            >
              <span className="block font-medium">{day.label}</span>
              <span className="mt-0.5 block font-bold">{day.num}</span>
            </button>
          );
        })}
      </div>

      {/* Duraciones y slots */}
      <div className="mt-4">
        {loadingSlots ? (
          <Spinner />
        ) : slotsError ? (
          <p className="text-sm" style={{ color: "var(--error)" }}>{slotsError}</p>
        ) : duracionesDisponibles.length === 0 ? (
          <div
            className="rounded-xl border px-4 py-5 text-center"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Sin disponibilidad este día
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              Probá con otro día o deporte.
            </p>
          </div>
        ) : (
          <>
            {/* Pills de duración (solo si hay más de una) */}
            {duracionesDisponibles.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {duracionesDisponibles.map((duracion) => {
                  const isActive = duracionActiva === duracion;
                  return (
                    <button
                      key={duracion}
                      type="button"
                      onClick={() => {
                        setDuracionActiva(duracion);
                        setHoraActiva(null);
                        setConfirmando(null);
                      }}
                      className="rounded-full border px-4 py-1 text-sm font-medium transition-all"
                      style={{
                        borderColor: isActive ? (sportTheme?.active ?? "var(--misu)") : "var(--border)",
                        background: isActive ? (sportTheme?.active ?? "var(--misu)") : "var(--surface-2)",
                        color: isActive ? "#fff" : "var(--muted)",
                      }}
                    >
                      {duracion} min
                    </button>
                  );
                })}
              </div>
            )}

            {/* Cards de slots */}
            {duracionActiva !== null && (
              <div className="grid gap-2">
                {slotsFiltradosPorDuracion.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    Sin disponibilidad para esta duración.
                  </p>
                ) : (
                  slotsFiltradosPorDuracion.map((slot) => {
                    const canchaInfo = canchasMap[slot.cancha_id];
                    return (
                      <button
                        key={`${slot.cancha_id}-${slot.hora_inicio}-${slot.duracion_minutos}`}
                        type="button"
                        onClick={() => {
                          setHoraActiva(slot.hora_inicio.slice(0, 5));
                          setConfirmando({
                            canchaId: slot.cancha_id,
                            canchaNombre: slot.cancha_nombre,
                            duracion: slot.duracion_minutos,
                            precio: Number(slot.precio),
                            horaFin: slot.hora_fin.slice(0, 5),
                          });
                        }}
                        className="w-full cursor-pointer rounded-xl border p-3 text-left transition-opacity hover:opacity-80"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {slot.hora_inicio.slice(0, 5)} – {slot.hora_fin.slice(0, 5)} · {slot.cancha_nombre}
                            </p>
                            {canchaInfo && (
                              <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                                {formatSuperficieCorta(canchaInfo.superficie)}
                                {canchaInfo.techada ? " · Techada" : " · Al aire libre"}
                              </p>
                            )}
                          </div>
                          <p
                            className="shrink-0 text-sm font-bold"
                            style={{ color: sportTheme?.active ?? "var(--misu)" }}
                          >
                            {formatMoney(Number(slot.precio))}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom sheet de confirmación */}
      {confirmando && deporteActivo && fechaActiva && horaActiva ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setConfirmando(null)}
          />

          <section
            className="absolute bottom-0 left-0 right-0 rounded-t-2xl border p-4 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                Confirmar reserva
              </p>
              <button
                type="button"
                className="btn-ghost h-8 w-8 text-lg leading-none"
                style={{ color: "var(--muted)" }}
                onClick={() => setConfirmando(null)}
              >
                ×
              </button>
            </div>

            <button
              type="button"
              onClick={() => setConfirmando(null)}
              className="mt-1 flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--muted)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Cambiar horario
            </button>

            <div
              className="mt-3 rounded-xl border px-3 py-3"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {getDeporteLabel(deporteActivo)} · {formatFechaLarga(fechaActiva)} · {horaActiva} – {confirmando.horaFin}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                {confirmando.canchaNombre}
              </p>
              <p className="mt-1 text-base font-bold" style={{ color: sportTheme?.active ?? "var(--misu)" }}>
                {formatMoney(confirmando.precio)}
              </p>
            </div>

            <form
              action={reservarCanchaFormAction}
              className="mt-4 grid gap-3"
              onSubmit={() => {
                setSubmitting(true);
                setErrorLocal(null);
                setSuccessLocal(null);
              }}
            >
              <input type="hidden" name="club_username" value={clubUsername} />
              <input type="hidden" name="club_id" value={clubId} />
              <input type="hidden" name="cancha_id" value={confirmando.canchaId} />
              <input type="hidden" name="cancha_nombre" value={confirmando.canchaNombre} />
              <input type="hidden" name="deporte" value={deporteActivo} />
              <input type="hidden" name="fecha" value={fechaActiva} />
              <input type="hidden" name="hora_inicio" value={horaActiva} />
              <input type="hidden" name="duracion_minutos" value={confirmando.duracion} />

              <label className="label">
                <span>Nombre</span>
                <input name="nombre" className="input" defaultValue={nombrePrefill} required />
              </label>

              <label className="label">
                <span>Celular</span>
                <input name="telefono" type="tel" className="input" required />
              </label>

              <label className="label">
                <span>Email</span>
                <input name="email" type="email" className="input" defaultValue={emailPrefill} required />
              </label>

              <button type="submit" className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export const BookingFlowOverlay = ClubBookingSection;
