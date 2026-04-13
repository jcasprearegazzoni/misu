import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubAjustesShell } from "./ajustes-shell";

type PageProps = {
  searchParams?: Promise<{ q?: string; section?: string; updated?: string }>;
};

type ClubProfesorRow = {
  status: "pendiente" | "activo" | "inactivo";
  invited_at: string | null;
  profesor_id: string;
};

type ProfesorSearchRow = {
  user_id: string;
  name: string | null;
  username: string | null;
  sport: string | null;
  zone: string | null;
  provincia: string | null;
};

export default async function ClubAjustesPage({ searchParams }: PageProps) {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();
  const resolved = searchParams ? await searchParams : {};
  const query = (resolved.q ?? "").trim();
  const defaultSection = resolved.section ?? null;
  const profileUpdated = resolved.updated === "1";

  const [configResult, canchasResult, clubProfesoresResult, disponibilidadResult, franjasResult, canchasActivasResult] =
    await Promise.all([
      supabase
        .from("club_configuracion")
        .select(
          "confirmacion_automatica, cancelacion_horas_limite, payment_gateway, payment_gateway_enabled, payment_gateway_access_token",
        )
        .eq("club_id", club.id)
        .maybeSingle(),
      supabase
        .from("canchas")
        .select("id, club_id, nombre, deporte, pared, superficie, techada, iluminacion, activa")
        .eq("club_id", club.id)
        .order("deporte")
        .order("nombre"),
      supabase
        .from("club_profesores")
        .select("status, invited_at, profesor_id")
        .eq("club_id", club.id)
        .in("status", ["pendiente", "activo"])
        .order("status", { ascending: true }),
      supabase
        .from("club_disponibilidad")
        .select("id, deporte, day_of_week, apertura, cierre, duraciones")
        .eq("club_id", club.id)
        .order("deporte")
        .order("day_of_week")
        .order("apertura"),
      supabase
        .from("club_franjas_precio")
        .select("id, deporte, day_of_week, desde, hasta, duracion_minutos, precio, cancha_id")
        .eq("club_id", club.id)
        .order("deporte")
        .order("day_of_week")
        .order("desde")
        .order("duracion_minutos"),
      supabase
        .from("canchas")
        .select("id, nombre, deporte")
        .eq("club_id", club.id)
        .eq("activa", true)
        .order("deporte")
        .order("nombre"),
    ]);

  const clubProfesores = (clubProfesoresResult.data ?? []) as ClubProfesorRow[];
  const profesorIds = clubProfesores.map((item) => item.profesor_id);
  const { data: perfilesData } =
    profesorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("user_id, name, username, sport, zone, provincia")
          .in("user_id", profesorIds)
      : { data: [] as ProfesorSearchRow[] };
  const perfilesMap = new Map((perfilesData ?? []).map((p) => [p.user_id, p]));

  const existingProfesorIds = new Set(profesorIds);
  let searchResults: ProfesorSearchRow[] = [];
  if (query.length >= 2) {
    const { data: searchData } = await supabase
      .from("profiles")
      .select("user_id, name, username, sport, zone, provincia")
      .eq("role", "profesor")
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,zone.ilike.%${query}%,provincia.ilike.%${query}%`)
      .limit(20);
    searchResults = (searchData ?? []).filter((row) => !existingProfesorIds.has(row.user_id));
  }

  const configuracion = configResult.data ?? { confirmacion_automatica: true, cancelacion_horas_limite: 24 };
  const gatewayInitialValues = {
    enabled: configResult.data?.payment_gateway_enabled ?? false,
    gateway: (configResult.data?.payment_gateway as "mercadopago" | null) ?? null,
    hasToken: Boolean(configResult.data?.payment_gateway_access_token),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Ajustes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Gestioná la configuración integral del club en un solo lugar.
        </p>
      </header>

      <ClubAjustesShell
        club={club}
        configuracion={configuracion}
        canchas={canchasResult.data ?? []}
        clubProfesores={clubProfesores}
        perfilesMap={Object.fromEntries(perfilesMap)}
        disponibilidad={disponibilidadResult.data ?? []}
        franjas={franjasResult.data ?? []}
        canchasActivas={canchasActivasResult.data ?? []}
        searchQuery={query}
        searchResults={searchResults}
        defaultSection={defaultSection}
        profileUpdated={profileUpdated}
        gatewayInitialValues={gatewayInitialValues}
      />
    </main>
  );
}
