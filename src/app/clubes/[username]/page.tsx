import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reservarCanchaFormAction } from "./actions";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{
    deporte?: string;
    fecha?: string;
    reservar?: string;
    reserva_ok?: string;
    error?: string;
  }>;
};

type PublicClubRow = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  telefono: string | null;
  email_contacto: string | null;
  website: string | null;
  tiene_bar: boolean;
  tiene_estacionamiento: boolean;
  alquila_paletas: boolean;
  alquila_raquetas: boolean;
  tiene_vestuario: boolean;
  tiene_parrilla: boolean;
};

type CanchaRow = {
  id: number;
  nombre: string;
  deporte: "tenis" | "padel" | "futbol" | "otro";
  superficie: string;
  techada: boolean;
  iluminacion: boolean;
};

type ProfesorJoinRow = {
  profesor_id: string;
  profiles:
    | {
        name: string;
        username: string | null;
        sport: "tenis" | "padel" | "ambos" | null;
        bio: string | null;
      }
    | Array<{
        name: string;
        username: string | null;
        sport: "tenis" | "padel" | "ambos" | null;
        bio: string | null;
      }>
    | null;
};

type SlotRow = {
  cancha_id: number;
  cancha_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  precio: number;
};

const dayLabels = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const SERVICIO_LABELS: { key: keyof PublicClubRow; label: string }[] = [
  { key: "tiene_bar", label: "Bar" },
  { key: "tiene_estacionamiento", label: "Estacionamiento" },
  { key: "tiene_vestuario", label: "Vestuario" },
  { key: "tiene_parrilla", label: "Parrilla" },
  { key: "alquila_paletas", label: "Alquiler de paletas" },
  { key: "alquila_raquetas", label: "Alquiler de raquetas" },
];

function isValidDateIso(value: string | undefined) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined) {
  if (isValidDateIso(value)) {
    return new Date(`${value}T12:00:00.000Z`);
  }
  return new Date();
}

function startOfWeekMonday(date: Date) {
  const copy = new Date(date.getTime());
  const day = copy.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  copy.setUTCDate(copy.getUTCDate() + delta);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatDateEs(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getDeporteLabel(deporte: CanchaRow["deporte"]) {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  if (deporte === "futbol") return "Futbol";
  return "Otro";
}

function getSportLabel(sport: "tenis" | "padel" | "ambos" | null) {
  if (sport === "tenis") return "Tenis";
  if (sport === "padel") return "Padel";
  if (sport === "ambos") return "Tenis y padel";
  return null;
}

function formatSuperficie(value: string) {
  const map: Record<string, string> = {
    polvo_ladrillo: "Polvo de ladrillo",
    sintetico: "Sintetico",
    cemento: "Cemento",
    blindex: "Blindex",
    f5: "Futbol 5",
    f7: "Futbol 7",
    f8: "Futbol 8",
    f11: "Futbol 11",
  };
  return map[value] ?? "Otro";
}

function normalizeWebsite(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function shortBio(bio: string | null) {
  const text = bio?.trim();
  if (!text) return null;
  return text.length <= 80 ? text : `${text.slice(0, 80)}...`;
}

function safeDecodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function PublicClubPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profilePromise = user
    ? supabase.from("profiles").select("name").eq("user_id", user.id).maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const clubPromise = supabase
    .rpc("get_public_club_by_username", { p_username: username })
    .then((result) => ((result.data ?? [])[0] ?? null) as PublicClubRow | null);

  const [club, profileResult] = await Promise.all([clubPromise, profilePromise]);
  if (!club) notFound();

  const nombrePrefill = profileResult.data?.name ?? "";
  const emailPrefill = user?.email ?? "";

  const [canchasResult, profesoresResult, deportesResult] = await Promise.all([
    supabase
      .from("canchas")
      .select("id, nombre, deporte, superficie, techada, iluminacion")
      .eq("club_id", club.id)
      .eq("activa", true)
      .order("deporte")
      .order("nombre"),
    supabase
      .from("club_profesores")
      .select("profesor_id, profiles!club_profesores_profesor_profile_fkey(name, username, sport, bio)")
      .eq("club_id", club.id)
      .eq("status", "activo"),
    supabase.from("club_disponibilidad").select("deporte").eq("club_id", club.id),
  ]);

  const canchas = (canchasResult.data ?? []) as CanchaRow[];
  const profesoresData = (profesoresResult.data ?? []) as ProfesorJoinRow[];

  const DEPORTES_VISIBLES = ["tenis", "padel", "futbol"] as const;
  type DeporteVisible = (typeof DEPORTES_VISIBLES)[number];

  const deportesDisponibles = Array.from(
    new Set((deportesResult.data ?? []).map((item) => item.deporte)),
  ).filter((d): d is DeporteVisible => DEPORTES_VISIBLES.includes(d as DeporteVisible));

  const selectedSport: DeporteVisible =
    resolvedSearchParams?.deporte &&
    DEPORTES_VISIBLES.includes(resolvedSearchParams.deporte as DeporteVisible)
      ? (resolvedSearchParams.deporte as DeporteVisible)
      : deportesDisponibles[0] ?? "tenis";

  const selectedDateObj = parseDate(resolvedSearchParams?.fecha);
  const selectedDate = toDateIso(selectedDateObj);
  const weekStart = startOfWeekMonday(selectedDateObj);
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const prevWeekDate = toDateIso(addDays(weekStart, -7));
  const nextWeekDate = toDateIso(addDays(weekStart, 7));

  const { data: slotsData } =
    deportesDisponibles.length > 0
      ? await supabase.rpc("get_club_slots_disponibles", {
          p_club_id: club.id,
          p_deporte: selectedSport,
          p_fecha: selectedDate,
        })
      : { data: [] };

  const slots = (slotsData ?? []) as SlotRow[];

  const slotsByCancha = slots.reduce<Record<string, SlotRow[]>>((acc, slot) => {
    if (!acc[slot.cancha_nombre]) acc[slot.cancha_nombre] = [];
    acc[slot.cancha_nombre].push(slot);
    return acc;
  }, {});

  const selectedReserva = resolvedSearchParams?.reservar ?? null;
  const reservaOk = resolvedSearchParams?.reserva_ok === "1";
  const errorMessage = resolvedSearchParams?.error
    ? safeDecodeUriComponent(resolvedSearchParams.error)
    : null;

  const buildHref = (next: { deporte?: string; fecha?: string; reservar?: string | null }) => {
    const sport = next.deporte ?? selectedSport;
    const date = next.fecha ?? selectedDate;
    const params = new URLSearchParams();
    params.set("deporte", sport);
    params.set("fecha", date);
    if (next.reservar) params.set("reservar", next.reservar);
    return `/clubes/${club.username}?${params.toString()}`;
  };

  const servicios = SERVICIO_LABELS.filter((item) => club[item.key]);

  const canchasAgrupadas = canchas.reduce<Record<string, CanchaRow[]>>((acc, cancha) => {
    if (!acc[cancha.deporte]) acc[cancha.deporte] = [];
    acc[cancha.deporte].push(cancha);
    return acc;
  }, {});

  const profesores = profesoresData
    .map((row) => (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const phoneDigits = (club.telefono ?? "").replace(/\D/g, "");

  const canchaNames = Object.keys(slotsByCancha).sort((a, b) => a.localeCompare(b));
  const hourKeys = Array.from(new Set(slots.map((slot) => slot.hora_inicio.slice(0, 5)))).sort((a, b) =>
    a.localeCompare(b),
  );

  const slotMap = new Map<string, SlotRow[]>();
  slots.forEach((slot) => {
    const key = `${slot.cancha_nombre}|${slot.hora_inicio.slice(0, 5)}`;
    const current = slotMap.get(key) ?? [];
    current.push(slot);
    current.sort((a, b) => a.duracion_minutos - b.duracion_minutos);
    slotMap.set(key, current);
  });

  const selectedSlot = slots.find((slot) => {
    const slotKey = `${slot.cancha_id}|${slot.hora_inicio.slice(0, 5)}|${slot.duracion_minutos}`;
    return slotKey === selectedReserva;
  });

  return (
    <>
      <AppNavbar />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <div
          className="border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <p
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: "var(--misu)" }}
            >
              Club deportivo
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
              {club.nombre}
            </h1>
            {club.direccion ? (
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {club.direccion}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {phoneDigits ? (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost inline-flex items-center gap-2 text-sm"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M19.11 4.93A9.9 9.9 0 0 0 12.06 2C6.55 2 2.06 6.49 2.06 12c0 1.75.46 3.46 1.33 4.97L2 22l5.17-1.36A9.95 9.95 0 0 0 12.06 22c5.51 0 10-4.49 10-10 0-2.67-1.04-5.18-2.95-7.07ZM12.06 20.2a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.07.8.82-3-.2-.31A8.16 8.16 0 0 1 3.86 12a8.2 8.2 0 0 1 8.2-8.2 8.14 8.14 0 0 1 5.8 2.4A8.14 8.14 0 0 1 20.26 12a8.2 8.2 0 0 1-8.2 8.2Zm4.5-6.15c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.55.12-.16.24-.62.78-.76.95-.14.16-.28.18-.52.06a6.66 6.66 0 0 1-1.95-1.2 7.36 7.36 0 0 1-1.36-1.7c-.14-.24-.02-.37.1-.5.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.75-1.82-.2-.48-.4-.42-.55-.43h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.3.98 2.46c.12.16 1.7 2.58 4.1 3.62.57.24 1.02.38 1.37.48.57.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                  </svg>
                  WhatsApp
                </a>
              ) : null}
              {club.website ? (
                <a href={normalizeWebsite(club.website)} target="_blank" rel="noreferrer" className="btn-ghost text-sm">
                  Website
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {reservaOk ? (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: "var(--success-border)",
                background: "var(--success-bg)",
                color: "var(--success)",
              }}
            >
              ¡Reserva confirmada! Te esperamos.
            </div>
          ) : null}
          {errorMessage ? (
            <div
              className="mb-4 rounded-xl border px-4 py-3 text-sm font-medium"
              style={{
                borderColor: "var(--error)",
                background: "rgba(127, 29, 29, 0.18)",
                color: "var(--error)",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <section
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
              Reservas
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Elegi deporte, dia y horario para reservar tu turno.
            </p>

            {deportesDisponibles.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                El club aun no tiene disponibilidad configurada.
              </p>
            ) : (
              <div className="mt-3 grid gap-4">
                <div className="flex flex-wrap gap-2">
                  {deportesDisponibles.map((sport) => (
                    <Link
                      key={sport}
                      href={buildHref({ deporte: sport, reservar: null })}
                      className="pill"
                      style={
                        selectedSport === sport
                          ? { background: "var(--misu)", color: "var(--background)" }
                          : undefined
                      }
                    >
                      {getDeporteLabel(sport)}
                    </Link>
                  ))}
                </div>

                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Link href={buildHref({ fecha: prevWeekDate, reservar: null })} className="btn-ghost text-sm">
                      ← Semana anterior
                    </Link>
                    <p className="text-xs font-medium" style={{ color: "var(--muted-2)" }}>
                      Semana de {formatDateEs(weekDates[0] ?? new Date())}
                    </p>
                    <Link href={buildHref({ fecha: nextWeekDate, reservar: null })} className="btn-ghost text-sm">
                      Semana siguiente →
                    </Link>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDates.map((dateObj) => {
                      const iso = toDateIso(dateObj);
                      const isSelected = iso === selectedDate;
                      return (
                        <Link
                          key={iso}
                          href={buildHref({ fecha: iso, reservar: null })}
                          className="rounded-md border px-2 py-2 text-center text-xs"
                          style={
                            isSelected
                              ? {
                                  borderColor: "var(--misu)",
                                  background: "var(--misu)",
                                  color: "var(--background)",
                                }
                              : { borderColor: "var(--border)", color: "var(--foreground)" }
                          }
                        >
                          <div>{dayLabels[dateObj.getUTCDay()]}</div>
                          <div className="font-semibold">{iso.slice(8, 10)}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {slots.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    No hay turnos disponibles para este dia.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm" style={{ background: "var(--misu)" }} />
                        Seleccionado
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }} />
                        Disponible
                      </span>
                    </div>

                    <div className="grid gap-3 md:hidden">
                      {canchaNames.map((canchaNombre) => {
                        const canchaSlots = slotsByCancha[canchaNombre] ?? [];
                        return (
                          <div key={`mobile-${canchaNombre}`} className="rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {canchaNombre}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2.5">
                              {canchaSlots.map((slot) => {
                                const slotKey = `${slot.cancha_id}|${slot.hora_inicio.slice(0, 5)}|${slot.duracion_minutos}`;
                                const isSelected = selectedReserva === slotKey;
                                return (
                                  <Link
                                    key={`mobile-${slotKey}`}
                                    href={buildHref({ reservar: slotKey })}
                                    className="rounded-md px-2.5 py-1.5 text-xs font-medium"
                                    style={
                                      isSelected
                                        ? { background: "var(--misu)", color: "var(--background)" }
                                        : { border: "1px solid var(--border)", background: "var(--surface-1)", color: "var(--foreground)" }
                                    }
                                  >
                                    {slot.hora_inicio.slice(0, 5)} · {slot.duracion_minutos}m
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="hidden overflow-x-auto rounded-lg border md:block" style={{ borderColor: "var(--border)" }}>
                      <div className="min-w-[760px]">
                        <div
                          className="grid items-center border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--muted-2)",
                            gridTemplateColumns: `180px repeat(${hourKeys.length}, minmax(96px, 1fr))`,
                          }}
                        >
                          <span>Cancha</span>
                          {hourKeys.map((hour) => (
                            <span key={hour} className="text-center">
                              {hour}
                            </span>
                          ))}
                        </div>

                        {canchaNames.map((canchaNombre) => (
                          <div
                            key={canchaNombre}
                            className="grid border-b px-3 py-2 last:border-b-0"
                            style={{
                              borderColor: "var(--border)",
                              gridTemplateColumns: `180px repeat(${hourKeys.length}, minmax(96px, 1fr))`,
                            }}
                          >
                            <div className="pr-2">
                              <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                {canchaNombre}
                              </p>
                            </div>
                            {hourKeys.map((hour) => {
                              const cellSlots = slotMap.get(`${canchaNombre}|${hour}`) ?? [];
                              return (
                                <div key={`${canchaNombre}-${hour}`} className="flex items-center justify-center px-1 py-1">
                                  {cellSlots.length === 0 ? (
                                    <span
                                      className="h-7 w-full rounded-md border border-dashed"
                                      style={{ borderColor: "var(--border)", opacity: 0.5 }}
                                    />
                                  ) : (
                                    <div className="grid w-full gap-1">
                                      {cellSlots.map((slot) => {
                                        const slotKey = `${slot.cancha_id}|${slot.hora_inicio.slice(0, 5)}|${slot.duracion_minutos}`;
                                        const isSelected = selectedReserva === slotKey;
                                        return (
                                          <Link
                                            key={slotKey}
                                            href={buildHref({ reservar: slotKey })}
                                            className="rounded-md px-2 py-1 text-center text-[11px] font-medium transition-colors"
                                            style={
                                              isSelected
                                                ? { background: "var(--misu)", color: "var(--background)" }
                                                : { background: "var(--surface-2)", color: "var(--foreground)", border: "1px solid var(--border)" }
                                            }
                                          >
                                            {slot.duracion_minutos}m
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedSlot ? (
                      <div
                        className="rounded-lg border p-4"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                      >
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          Reserva seleccionada
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="pill">{selectedSlot.cancha_nombre}</span>
                          <span className="pill">
                            {selectedSlot.hora_inicio.slice(0, 5)}-{selectedSlot.hora_fin.slice(0, 5)}
                          </span>
                          <span className="pill">{selectedSlot.duracion_minutos} min</span>
                        </div>
                        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
                          {new Intl.NumberFormat("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 0,
                          }).format(Number(selectedSlot.precio))}
                        </p>

                        <form
                          action={reservarCanchaFormAction}
                          className="mt-3 grid gap-3 border-t pt-3"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <input type="hidden" name="club_username" value={club.username} />
                          <input type="hidden" name="club_id" value={club.id} />
                          <input type="hidden" name="cancha_id" value={selectedSlot.cancha_id} />
                          <input type="hidden" name="deporte" value={selectedSport} />
                          <input type="hidden" name="fecha" value={selectedDate} />
                          <input
                            type="hidden"
                            name="hora_inicio"
                            value={selectedSlot.hora_inicio.slice(0, 5)}
                          />
                          <input
                            type="hidden"
                            name="duracion_minutos"
                            value={selectedSlot.duracion_minutos}
                          />

                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="label">
                              <span>Nombre</span>
                              <input name="nombre" className="input" defaultValue={nombrePrefill} required />
                            </label>
                            <label className="label">
                              <span>Telefono</span>
                              <input name="telefono" className="input" />
                            </label>
                            <label className="label sm:col-span-2">
                              <span>Email</span>
                              <input
                                name="email"
                                type="email"
                                className="input"
                                defaultValue={emailPrefill}
                              />
                            </label>
                          </div>

                          <div className="flex justify-end">
                            <button type="submit" className="btn-primary text-sm">
                              Confirmar reserva
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        Selecciona un bloque horario para completar la reserva.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="mt-5 grid gap-5">
            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Servicios
              </h2>
              {servicios.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  Este club todavia no publico servicios.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {servicios.map((servicio) => (
                    <span key={servicio.key} className="pill">
                      {servicio.label}
                    </span>
                  ))}
                </div>
              )}
            </section>

            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Canchas
              </h2>
              {canchas.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  Este club todavia no publico canchas.
                </p>
              ) : (
                <div className="mt-4 grid gap-4">
                  {(Object.entries(canchasAgrupadas) as [CanchaRow["deporte"], CanchaRow[]][]).map(
                    ([deporte, lista]) => (
                      <div key={deporte}>
                        <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--misu)" }}>
                          {getDeporteLabel(deporte)}
                        </p>
                        <div className="grid gap-2">
                          {lista.map((cancha) => (
                            <div
                              key={cancha.id}
                              className="flex items-center justify-between rounded-xl border px-4 py-3"
                              style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                            >
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                                  {cancha.nombre}
                                </p>
                                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                                  {formatSuperficie(cancha.superficie)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {cancha.techada ? <span className="pill">Techada</span> : null}
                                {cancha.iluminacion ? <span className="pill">Iluminacion</span> : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </section>

            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Profesores
              </h2>
              {profesores.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  Este club todavia no tiene profesores publicados.
                </p>
              ) : (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {profesores.map((profesor) => (
                    <div
                      key={`${profesor.name}-${profesor.username ?? "x"}`}
                      className="flex flex-col justify-between rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                    >
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {profesor.name}
                        </p>
                        {getSportLabel(profesor.sport) ? (
                          <p className="mt-0.5 text-xs" style={{ color: "var(--misu)" }}>
                            {getSportLabel(profesor.sport)}
                          </p>
                        ) : null}
                        {shortBio(profesor.bio) ? (
                          <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--muted)" }}>
                            {shortBio(profesor.bio)}
                          </p>
                        ) : null}
                      </div>
                      {profesor.username ? (
                        <Link
                          href={`/p/${profesor.username}`}
                          className="mt-3 text-xs font-semibold"
                          style={{ color: "var(--misu-light)" }}
                        >
                          Ver perfil →
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
