import Link from "next/link";
import { notFound } from "next/navigation";
import { AppNavbar } from "@/components/app-navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ username: string }>;
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
    | { name: string; username: string | null; sport: "tenis" | "padel" | "ambos" | null; bio: string | null }
    | Array<{ name: string; username: string | null; sport: "tenis" | "padel" | "ambos" | null; bio: string | null }>
    | null;
};

function getDeporteLabel(deporte: CanchaRow["deporte"]) {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Pádel";
  if (deporte === "futbol") return "Fútbol";
  return "Otro";
}

function getSportLabel(sport: "tenis" | "padel" | "ambos" | null) {
  if (sport === "tenis") return "Tenis";
  if (sport === "padel") return "Pádel";
  if (sport === "ambos") return "Tenis y Pádel";
  return null;
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

function shortBio(bio: string | null) {
  const text = bio?.trim();
  if (!text) return null;
  return text.length <= 90 ? text : `${text.slice(0, 90)}…`;
}

// Íconos SVG inline
function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.532 5.845L.057 23.52a.563.563 0 0 0 .68.745l5.898-1.548A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 0 1-5.016-1.374l-.36-.213-3.714.975.991-3.614-.234-.37A9.786 9.786 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

function WebsiteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
    </svg>
  );
}

const SERVICIO_LABELS: { key: keyof PublicClubRow; label: string }[] = [
  { key: "tiene_bar", label: "Bar" },
  { key: "tiene_estacionamiento", label: "Estacionamiento" },
  { key: "tiene_vestuario", label: "Vestuario" },
  { key: "tiene_parrilla", label: "Parrilla" },
  { key: "alquila_paletas", label: "Alquiler de paletas" },
  { key: "alquila_raquetas", label: "Alquiler de raquetas" },
];

export default async function PublicClubPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createSupabaseServerClient();

  const clubPromise = supabase
    .rpc("get_public_club_by_username", { p_username: username })
    .then((result) => ((result.data ?? [])[0] ?? null) as PublicClubRow | null);

  const canchasPromise = clubPromise.then(async (club) => {
    if (!club) return [] as CanchaRow[];
    const { data } = await supabase
      .from("canchas")
      .select("id, nombre, deporte, superficie, techada, iluminacion")
      .eq("club_id", club.id)
      .eq("activa", true)
      .order("deporte")
      .order("nombre");
    return (data ?? []) as CanchaRow[];
  });

  const profesoresPromise = clubPromise.then(async (club) => {
    if (!club) return [] as ProfesorJoinRow[];
    const { data } = await supabase
      .from("club_profesores")
      .select("profesor_id, profiles!club_profesores_profesor_profile_fkey(name, username, sport, bio)")
      .eq("club_id", club.id)
      .eq("status", "activo");
    return (data ?? []) as ProfesorJoinRow[];
  });

  const [club, canchas, profesoresData] = await Promise.all([clubPromise, canchasPromise, profesoresPromise]);

  if (!club) notFound();

  const servicios = SERVICIO_LABELS.filter((s) => club[s.key]);

  const canchasAgrupadas = canchas.reduce<Record<string, CanchaRow[]>>((acc, c) => {
    if (!acc[c.deporte]) acc[c.deporte] = [];
    acc[c.deporte].push(c);
    return acc;
  }, {});

  const profesores = profesoresData
    .map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return p ?? null;
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const phoneDigits = (club.telefono ?? "").replace(/\D/g, "");

  return (
    <>
      <AppNavbar />
      <main
        className="min-h-screen"
        style={{ background: "var(--background)" }}
      >
        {/* Hero */}
        <div
          className="border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
        >
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--misu)" }}>
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

            {/* Contacto */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {phoneDigits ? (
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#25D366", color: "#fff" }}
                >
                  <WhatsappIcon />
                  Escribinos
                </a>
              ) : null}
              {club.website ? (
                <a
                  href={normalizeWebsite(club.website)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost inline-flex items-center gap-1.5 text-sm"
                >
                  <WebsiteIcon />
                  {club.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="grid gap-5">

            {/* Servicios */}
            {servicios.length > 0 ? (
              <section
                className="rounded-2xl border p-5"
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              >
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                  Servicios
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {servicios.map((s) => (
                    <span
                      key={s.key}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        borderColor: "var(--border)",
                        background: "var(--surface-2)",
                        color: "var(--foreground)",
                      }}
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Canchas */}
            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Canchas
              </h2>
              {canchas.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  Este club todavía no publicó canchas.
                </p>
              ) : (
                <div className="mt-4 grid gap-4">
                  {(Object.entries(canchasAgrupadas) as [CanchaRow["deporte"], CanchaRow[]][]).map(([deporte, lista]) => (
                    <div key={deporte}>
                      <p
                        className="mb-2 text-xs font-bold uppercase tracking-wider"
                        style={{ color: "var(--misu)" }}
                      >
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
                              {cancha.techada ? (
                                <span
                                  className="rounded-full border px-2 py-0.5 text-xs"
                                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                                >
                                  Techada
                                </span>
                              ) : null}
                              {cancha.iluminacion ? (
                                <span
                                  className="rounded-full border px-2 py-0.5 text-xs"
                                  style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                                >
                                  Iluminada
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Profesores */}
            <section
              className="rounded-2xl border p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
                Profesores
              </h2>
              {profesores.length === 0 ? (
                <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                  Este club todavía no tiene profesores publicados.
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
