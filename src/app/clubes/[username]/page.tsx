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
      .select("id, deporte, superficie")
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

  return (
    <>
      <AppNavbar />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <section
            className="rounded-2xl border p-5"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
              Club deportivo
            </p>
            <h1 className="mt-2 text-3xl font-black" style={{ color: "var(--foreground)" }}>
              {club.nombre}
            </h1>
            {club.direccion ? (
              <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                {club.direccion}
              </p>
            ) : null}

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <BookingFlowOverlay
                clubId={club.id}
                clubUsername={club.username}
                clubNombre={club.nombre}
                nombrePrefill={nombrePrefill}
                emailPrefill={emailPrefill}
                initialError={initialError}
                initialSuccess={initialSuccess}
              />
              {profesores.length > 0 ? (
                <Link
                  href={`/clubes/${club.username}/profesores`}
                  className="btn-ghost w-full justify-center rounded-xl border px-4 py-2 text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  Ver profesores
                </Link>
              ) : (
                <div />
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {phoneDigits ? (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-xl border px-3 py-1.5 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  WhatsApp
                </a>
              ) : null}
              {club.website ? (
                <a
                  href={normalizeWebsite(club.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost rounded-xl border px-3 py-1.5 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  Website
                </a>
              ) : null}
              {club.email_contacto ? (
                <a
                  href={`mailto:${club.email_contacto}`}
                  className="btn-ghost rounded-xl border px-3 py-1.5 text-sm"
                  style={{ borderColor: "var(--border)" }}
                >
                  Contacto
                </a>
              ) : null}
            </div>
          </section>

          {servicios.length > 0 ? (
            <section
              className="mt-5 rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Servicios
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {servicios.map((servicio) => (
                  <span
                    key={servicio.key}
                    className="rounded-lg border px-2.5 py-1 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
                  >
                    {servicio.label}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {canchasResumen.length > 0 ? (
            <section
              className="mt-5 rounded-2xl border p-5"
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
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--misu)" }}>
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
              className="mt-5 rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Profesores
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {profesores.slice(0, 6).map((profesor) => {
                  const cardContent = (
                    <>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {profesor.name}
                      </p>
                      {getSportLabel(profesor.sport) ? (
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {getSportLabel(profesor.sport)}
                        </p>
                      ) : null}
                    </>
                  );

                  if (profesor.username) {
                    return (
                      <Link
                        key={profesor.username}
                        href={`/p/${profesor.username}`}
                        className="block rounded-xl border px-3 py-2 transition-opacity hover:opacity-75"
                        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                      >
                        {cardContent}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={profesor.name}
                      className="rounded-xl border px-3 py-2"
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
            <section className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              <div className="px-5 py-4" style={{ background: "var(--surface-1)" }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                  Como llegar
                </p>
                <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                  {club.direccion}
                </p>
              </div>
              <iframe
                title={`Mapa de ${club.nombre}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(`${club.nombre} ${club.direccion}`)}&output=embed&z=15`}
                width="100%"
                height="320"
                style={{ border: 0, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </section>
          ) : null}
        </div>
      </main>
    </>
  );
}
