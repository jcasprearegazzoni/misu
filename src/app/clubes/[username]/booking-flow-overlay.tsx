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

type Props = {
  clubId: number;
  clubUsername: string;
  clubNombre: string;
  nombrePrefill: string;
  emailPrefill: string;
  initialError: string | null;
  initialSuccess: SuccessState | null;
};

type ConfirmandoState = {
  canchaId: number;
  canchaNombre: string;
  duracion: number;
  precio: number;
  horaFin: string;
} | null;

const DEPORTES_VISIBLES: DeporteVisible[] = ["tenis", "padel", "futbol"];

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

function formatWeekLabel(offset: number) {
  const days = getWeekDays(offset);
  const first = days[0]?.iso;
  if (!first) return "";

  const date = new Date(`${first}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
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

function Spinner() {
  return (
    <div className="flex items-center gap-2 py-2 text-sm" style={{ color: "var(--muted)" }}>
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
  clubNombre,
  nombrePrefill,
  emailPrefill,
  initialError,
  initialSuccess,
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

  useEffect(() => {
    // Si vuelve desde el server con éxito en query params, limpiamos la URL al hidratar.
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

    return () => {
      cancelled = true;
    };
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

    return () => {
      cancelled = true;
    };
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
    if (fechaActiva !== hoyIso) {
      return slots;
    }

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

    if (duracionActiva !== null && duracionesDisponibles.includes(duracionActiva)) {
      return;
    }

    setDuracionActiva(null);
  }, [duracionesDisponibles, duracionActiva]);

  const slotsFiltradosPorDuracion = useMemo(() => {
    if (duracionActiva === null) {
      return [];
    }

    return slotsVisibles
      .filter((slot) => slot.duracion_minutos === duracionActiva)
      .sort((a, b) => {
        const horaA = b.hora_inicio.slice(0, 5).localeCompare(a.hora_inicio.slice(0, 5));
        if (horaA !== 0) return horaA * -1;
        return a.cancha_nombre.localeCompare(b.cancha_nombre, "es-AR");
      });
  }, [slotsVisibles, duracionActiva]);

  useEffect(() => {
    if (!horaActiva) return;
    if (hourOptions.includes(horaActiva)) return;
    setHoraActiva(null);
  }, [hourOptions, horaActiva]);

  return (
    <section className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Reservar en {clubNombre}
        </p>
      </div>

      {successLocal ? (
        <div
          className="mt-3 rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: "var(--success-border)", background: "var(--surface-2)", color: "var(--success)" }}
        >
          Reserva confirmada. Tu turno quedó registrado correctamente.
        </div>
      ) : null}

      {errorLocal ? (
        <div
          className="mt-3 rounded-xl border px-3 py-2 text-sm"
          style={{ borderColor: "var(--error-border)", background: "var(--error-bg)", color: "var(--error)" }}
        >
          {errorLocal}
        </div>
      ) : null}

      <div className="mt-4" role="tablist" aria-label="Deportes disponibles">
        {loadingDeportes ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Cargando deportes...
          </p>
        ) : deportesError ? (
          <p className="text-sm" style={{ color: "var(--error)" }}>
            {deportesError}
          </p>
        ) : deportesDisponibles.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No hay deportes disponibles para reservas.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {deportesDisponibles.map((deporte) => {
              const isActive = deporteActivo === deporte;
              return (
                <button
                  key={deporte}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium"
                  style={{
                    borderColor: isActive ? "var(--misu)" : "var(--border)",
                    background: isActive ? "var(--misu)" : "var(--surface-2)",
                    color: isActive ? "#ffffff" : "var(--foreground)",
                  }}
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

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
          onClick={() => {
            setSemanaOffset((offset) => Math.max(0, offset - 1));
            setDuracionActiva(null);
            setHoraActiva(null);
            setConfirmando(null);
          }}
          disabled={semanaOffset === 0}
        >
          ?
        </button>

        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Semana del {formatWeekLabel(semanaOffset)}
        </span>

        <button
          type="button"
          className="rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
          onClick={() => {
            setSemanaOffset((offset) => Math.min(3, offset + 1));
            setDuracionActiva(null);
            setHoraActiva(null);
            setConfirmando(null);
          }}
          disabled={semanaOffset >= 3}
        >
          ?
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
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
              data-active={isActive}
              disabled={day.isPast}
              className="rounded-lg border px-1 py-2 text-center text-xs disabled:cursor-not-allowed disabled:opacity-45"
              style={{
                borderColor: isActive ? "var(--misu)" : "var(--border)",
                background: isActive ? "var(--misu)" : "var(--surface-2)",
                color: isActive ? "#ffffff" : "var(--foreground)",
              }}
            >
              <span className="block">{day.label}</span>
              <span className="mt-1 block font-semibold">{day.num}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {loadingSlots ? (
          <Spinner />
        ) : slotsError ? (
          <p className="text-sm" style={{ color: "var(--error)" }}>
            {slotsError}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {duracionesDisponibles.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Sin disponibilidad para este día.
              </p>
            ) : (
              duracionesDisponibles.map((duracion) => {
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
                    data-active={isActive}
                    className="rounded-full border px-4 py-1 text-sm font-medium"
                    style={{
                      borderColor: isActive ? "var(--misu)" : "var(--border)",
                      background: isActive ? "var(--misu)" : "var(--surface-2)",
                      color: isActive ? "#ffffff" : "var(--muted)",
                    }}
                  >
                    {duracion} min
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {duracionActiva !== null ? (
        <div className="mt-4 grid gap-3">
          {slotsFiltradosPorDuracion.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Sin disponibilidad para esta duración.
            </p>
          ) : (
            slotsFiltradosPorDuracion.map((slot) => (
              <div
                key={`${slot.cancha_id}-${slot.hora_inicio}-${slot.duracion_minutos}`}
                className="rounded-xl border p-3"
                style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {slot.hora_inicio.slice(0, 5)} · {slot.cancha_nombre}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: "var(--misu)" }}>
                    {formatMoney(Number(slot.precio))}
                  </p>
                </div>
                <button
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
                  className="mt-2 rounded-lg border px-3 py-1.5 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-1)",
                    color: "var(--foreground)",
                  }}
                >
                  Elegir horario
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      {confirmando && deporteActivo && fechaActiva && horaActiva ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            className="absolute inset-0 bg-black/55"
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
                className="rounded-lg border px-2 py-1 text-xs"
                style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                onClick={() => setConfirmando(null)}
              >
                Cerrar
              </button>
            </div>

            <div
              className="mt-3 rounded-xl border px-3 py-3 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
            >
              <p style={{ color: "var(--foreground)" }}>
                {getDeporteLabel(deporteActivo)} · {formatFechaLarga(fechaActiva)} · {horaActiva} - {confirmando.horaFin}
              </p>
              <p className="mt-1" style={{ color: "var(--muted)" }}>
                {confirmando.canchaNombre}
              </p>
              <p className="mt-1 font-semibold" style={{ color: "var(--misu)" }}>
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
    </section>
  );
}

export const BookingFlowOverlay = ClubBookingSection;
