import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingFlowOverlay } from "./booking-flow-overlay";

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{
    reserva_ok?: string;
    error?: string;
    deporte?: string;
    fecha?: string;
    hora?: string;
    duracion?: string;
    cancha_nombre?: string;
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
  deporte: "tenis" | "padel" | "futbol" | "otro";
  superficie: string;
  nombre: string;
  techada: boolean;
};

type ProfesorJoinRow = {
  profiles:
    | {
        name: string;
        username: string | null;
        sport: "tenis" | "padel" | "ambos" | null;
      }
    | Array<{
        name: string;
        username: string | null;
        sport: "tenis" | "padel" | "ambos" | null;
      }>
    | null;
};

const SERVICIO_LABELS: { key: keyof PublicClubRow; label: string }[] = [
  { key: "tiene_bar", label: "Bar" },
  { key: "tiene_estacionamiento", label: "Estacionamiento" },
  { key: "tiene_vestuario", label: "Vestuario" },
  { key: "tiene_parrilla", label: "Parrilla" },
  { key: "alquila_paletas", label: "Alquiler de paletas" },
  { key: "alquila_raquetas", label: "Alquiler de raquetas" },
];

function getDeporteLabel(deporte: CanchaRow["deporte"]) {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  if (deporte === "futbol") return "Futbol";
  return "Otro";
}

function getDeporteColor(deporte: CanchaRow["deporte"]) {
  if (deporte === "tenis") return "#16a34a";
  if (deporte === "padel") return "#d97706";
  if (deporte === "futbol") return "#2563eb";
  return "var(--misu)";
}

function formatSuperficie(value: string) {
  const map: Record<string, string> = {
    polvo_ladrillo: "Polvo de ladrillo",
    sintetico: "Sintético",
    cemento: "Cemento",
    blindex: "Blindex",
    f5: "Fútbol 5",
    f7: "Fútbol 7",
    f8: "Fútbol 8",
    f11: "Fútbol 11",
  };
  return map[value] ?? "Otro";
}

function normalizeWebsite(url: string) {
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function getSportLabel(sport: "tenis" | "padel" | "ambos" | null) {
  if (sport === "tenis") return "Tenis";
  if (sport === "padel") return "Padel";
  if (sport === "ambos") return "Tenis y padel";
  return null;
}

function safeDecodeUriComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfesorAvatar({ name }: { name: string }) {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: "var(--misu)" }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
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

  const club = await supabase
    .rpc("get_public_club_by_username", { p_username: username })
    .then((result) => ((result.data ?? [])[0] ?? null) as PublicClubRow | null);

  if (!club) notFound();

  const [canchasResult, profesoresResult, profileResult] = await Promise.all([
    supabase
      .from("canchas")
      .select("id, deporte, superficie, nombre, techada")
      .eq("club_id", club.id)
      .eq("activa", true),
    supabase
      .from("club_profesores")
      .select("profiles!club_profesores_profesor_profile_fkey(name, username, sport)")
      .eq("club_id", club.id)
      .eq("status", "activo"),
    profilePromise,
  ]);

  const canchas = (canchasResult.data ?? []) as CanchaRow[];
  const servicios = SERVICIO_LABELS.filter((item) => club[item.key]);
  const phoneDigits = (club.telefono ?? "").replace(/\D/g, "");
  const nombrePrefill = profileResult.data?.name ?? "";
  const emailPrefill = user?.email ?? "";

  const initialError = resolvedSearchParams?.error
    ? safeDecodeUriComponent(resolvedSearchParams.error)
    : null;

  const initialSuccess =
    resolvedSearchParams?.reserva_ok === "1"
      ? {
          deporte: resolvedSearchParams.deporte,
          fecha: resolvedSearchParams.fecha,
          hora: resolvedSearchParams.hora,
          duracion: resolvedSearchParams.duracion,
          canchaNombre: resolvedSearchParams.cancha_nombre,
        }
      : null;

  // Mapa de canchas para mostrar detalles en los slots
  const canchasMap = Object.fromEntries(
    canchas.map((c) => [c.id, { superficie: c.superficie, techada: c.techada }])
  ) as Record<number, { superficie: string; techada: boolean }>;

  const canchasAgrupadas = canchas.reduce<Record<string, CanchaRow[]>>((acc, cancha) => {
    if (!acc[cancha.deporte]) acc[cancha.deporte] = [];
    acc[cancha.deporte].push(cancha);
    return acc;
  }, {});

  const canchasResumen = (Object.entries(canchasAgrupadas) as [CanchaRow["deporte"], CanchaRow[]][]).map(
    ([deporte, lista]) => {
      const conteo = lista.reduce<Record<string, number>>((acc, c) => {
        acc[c.superficie] = (acc[c.superficie] ?? 0) + 1;
        return acc;
      }, {});
      return { deporte, conteo, total: lista.length };
    },
  );

  const profesoresData = (profesoresResult.data ?? []) as ProfesorJoinRow[];
  const profesores = profesoresData
    .map((row) => (Array.isArray(row.profiles) ? row.profiles[0] : row.profiles))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const mapsQuery = encodeURIComponent(`${club.nombre} ${club.direccion ?? ""}`);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <>
      <AppNavbar />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

          {/* Header del club — ancho completo */}
          <section
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <h1 className="min-w-0 text-2xl font-black" style={{ color: "var(--foreground)" }}>
                {club.nombre}
              </h1>
              {phoneDigits ? (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-1.5 sm:text-sm sm:font-semibold"
                  style={{ background: "#22c55e", color: "#ffffff" }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.34-1.66a11.86 11.86 0 0 0 5.72 1.47h.01c6.56 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.18-3.45-8.43ZM12.07 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.22-3.76.98 1-3.67-.24-.38a9.88 9.88 0 0 1-1.5-5.25c0-5.45 4.44-9.9 9.9-9.9 2.65 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.45-4.44 9.9-9.9 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.66.15-.2.3-.76.97-.93 1.16-.17.2-.34.22-.64.08-.3-.15-1.26-.46-2.4-1.47a9.06 9.06 0 0 1-1.67-2.07c-.17-.3-.02-.46.13-.6.13-.13.3-.34.45-.52.15-.17.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.48 0 1.46 1.08 2.88 1.23 3.07.15.2 2.1 3.2 5.08 4.48.71.31 1.27.5 1.7.64.72.23 1.38.2 1.9.12.58-.08 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                  </svg>
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              ) : null}
            </div>

            {club.direccion ? (
              <p className="mt-2 flex items-start gap-2 text-sm" style={{ color: "var(--muted)" }}>
                <span aria-hidden="true" className="mt-0.5 inline-flex">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <span>{club.direccion}</span>
              </p>
            ) : null}

            {servicios.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {servicios.map((servicio) => (
                  <span
                    key={servicio.key}
                    className="rounded-full border px-3 py-1 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
                  >
                    {servicio.label}
                  </span>
                ))}
              </div>
            ) : null}

            {club.website ? (
              <div className="mt-4">
                <a
                  href={normalizeWebsite(club.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-xl border px-3 py-1.5 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  Website
                </a>
              </div>
            ) : null}
          </section>

          {/* Grid de dos columnas: booking izq + info der */}
          <div className="mt-5 grid gap-5 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">

            {/* Columna derecha: canchas, profesores, mapa */}
            <div className="order-2 grid gap-5 lg:order-2">

              {canchasResumen.length > 0 ? (
                <section
                  className="rounded-2xl border p-5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                    Canchas
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {canchasResumen.map(({ deporte, conteo, total }) => (
                      <div
                        key={deporte}
                        className="rounded-xl border px-4 py-3"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: getDeporteColor(deporte) }}>
                          {getDeporteLabel(deporte)} · {total} {total === 1 ? "cancha" : "canchas"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {Object.entries(conteo).map(([sup, count]) => (
                            <span key={sup} className="text-xs" style={{ color: "var(--foreground)" }}>
                              {count} de {formatSuperficie(sup)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {profesores.length > 0 ? (
                <section
                  className="rounded-2xl border p-5"
                  style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                >
                  <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                    Profesores
                  </h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {profesores.slice(0, 6).map((profesor) => {
                      const cardContent = (
                        <div className="flex items-center gap-3">
                          <ProfesorAvatar name={profesor.name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {profesor.name}
                            </p>
                            {getSportLabel(profesor.sport) ? (
                              <p className="text-xs" style={{ color: "var(--muted)" }}>
                                {getSportLabel(profesor.sport)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );

                      if (profesor.username) {
                        return (
                          <Link
                            key={profesor.username}
                            href={`/p/${profesor.username}`}
                            className="block rounded-xl border px-3 py-2.5 transition-opacity hover:opacity-75"
                            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                          >
                            {cardContent}
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={profesor.name}
                          className="rounded-xl border px-3 py-2.5"
                          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                        >
                          {cardContent}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {club.direccion ? (
                <section className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ background: "var(--surface-1)" }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                        Cómo llegar
                      </p>
                      <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                        {club.direccion}
                      </p>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-sm font-medium"
                      style={{ color: "var(--misu-light)" }}
                    >
                      Abrir en Maps →
                    </a>
                  </div>
                  <iframe
                    title={`Mapa de ${club.nombre}`}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${club.nombre} ${club.direccion}`)}&output=embed&z=15`}
                    width="100%"
                    height="280"
                    style={{ border: 0, display: "block" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </section>
              ) : null}

            </div>

            {/* Columna izquierda: widget de reserva — sticky en desktop, primero en mobile */}
            <div className="order-1 lg:order-1 lg:sticky lg:top-6">
              <section
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <BookingFlowOverlay
                  clubId={club.id}
                  clubUsername={club.username}
                  clubNombre={club.nombre}
                  nombrePrefill={nombrePrefill}
                  emailPrefill={emailPrefill}
                  initialError={initialError}
                  initialSuccess={initialSuccess}
                  canchasMap={canchasMap}
                />
              </section>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
