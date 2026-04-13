import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AjustesShell } from "./ajustes-shell";

type AjustesPageProps = {
  searchParams?: Promise<{ updated?: string }>;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

type Club = {
  id: number;
  nombre: string;
  direccion: string | null;
  deporte: "tenis" | "padel" | "ambos";
  is_placeholder: boolean;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  cp_status: "pendiente" | "activo" | "inactivo";
};

type ClubJoinRow = {
  club_id: number;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  status: "pendiente" | "activo" | "inactivo";
  clubs:
    | {
        id: number;
        nombre: string;
        direccion: string | null;
        deporte: "tenis" | "padel" | "ambos";
        is_placeholder: boolean;
      }
    | null
    | Array<{
        id: number;
        nombre: string;
        direccion: string | null;
        deporte: "tenis" | "padel" | "ambos";
        is_placeholder: boolean;
      }>;
};

type Invitacion = {
  id: number;
  club: { nombre: string; direccion: string | null };
  invited_at: string;
};

type ClubPropio = {
  id: number;
  nombre: string;
};

export default async function ProfesorAjustesPage({ searchParams }: AjustesPageProps) {
  const profile = await getCurrentProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const [
    { count: availabilityCount },
    { data: invitacionesData },
    { data: clubsPropiosData },
    { data: clubsData, error: clubsError },
    { data: availabilityData },
    { data: blockedDatesData },
    { data: clubProfData },
    gatewayResult,
  ] = await Promise.all([
    supabase
      .from("availability")
      .select("id", { count: "exact", head: true })
      .eq("profesor_id", profile.user_id),
    supabase
      .from("club_profesores")
      .select("id, invited_at, clubs!club_profesores_club_id_fkey(nombre, direccion)")
      .eq("profesor_id", profile.user_id)
      .eq("status", "pendiente"),
    supabase
      .from("clubs")
      .select("id, nombre")
      .eq("created_by_profesor_id", profile.user_id)
      .eq("is_placeholder", true),
    supabase
      .from("club_profesores")
      .select(`
        club_id,
        court_cost_mode,
        court_cost_per_hour,
        court_percentage_per_student,
        status,
        clubs!club_profesores_club_id_fkey (
          id,
          nombre,
          direccion,
          deporte,
          is_placeholder
        )
      `)
      .eq("profesor_id", profile.user_id)
      .eq("status", "activo"),
    supabase
      .from("availability")
      .select("id, day_of_week, start_time, end_time, slot_duration_minutes, club_id")
      .eq("profesor_id", profile.user_id)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("blocked_dates")
      .select("id, start_at, end_at, reason")
      .eq("profesor_id", profile.user_id)
      .order("start_at", { ascending: true }),
    supabase
      .from("club_profesores")
      .select("club_id, clubs(id, nombre)")
      .eq("profesor_id", profile.user_id)
      .eq("status", "activo"),
    supabase
      .from("profiles")
      .select("payment_gateway, payment_gateway_enabled, payment_gateway_access_token")
      .eq("user_id", profile.user_id)
      .maybeSingle(),
  ]);

  const invitaciones: Invitacion[] = (invitacionesData ?? [])
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;
      if (!clubData) return null;
      return {
        id: row.id as number,
        invited_at: row.invited_at as string,
        club: {
          nombre: clubData.nombre,
          direccion: clubData.direccion ?? null,
        },
      };
    })
    .filter((row): row is Invitacion => row !== null);

  const clubsPropios: ClubPropio[] = (clubsPropiosData ?? []).map((row) => ({
    id: row.id as number,
    nombre: row.nombre as string,
  }));

  const clubs: Club[] = ((clubsData ?? []) as ClubJoinRow[])
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;

      if (!clubData) {
        return null;
      }

      return {
        id: clubData.id,
        nombre: clubData.nombre,
        direccion: clubData.direccion,
        deporte: clubData.deporte,
        is_placeholder: clubData.is_placeholder,
        court_cost_mode: row.court_cost_mode,
        court_cost_per_hour: row.court_cost_per_hour,
        court_percentage_per_student: row.court_percentage_per_student,
        cp_status: row.status,
      };
    })
    .filter((row): row is Club => row !== null);

  const clubsForAvailability = ((clubProfData ?? []) as Array<{
    club_id: number;
    clubs: { id: number; nombre: string } | null | Array<{ id: number; nombre: string }>;
  }>)
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;
      if (!clubData) return null;
      return { id: clubData.id, nombre: clubData.nombre };
    })
    .filter((row): row is { id: number; nombre: string } => row !== null);

  const hasDisponibilidad = (availabilityCount ?? 0) > 0;
  const hasPrecios =
    profile.price_individual !== null ||
    profile.price_dobles !== null ||
    profile.price_trio !== null ||
    profile.price_grupal !== null;
  const hasPerfilBase = Boolean(profile.name?.trim()) && Boolean(profile.provincia?.trim());

  const checklist: ChecklistItem[] = [
    {
      id: "perfil",
      label: "Completar datos básicos del perfil",
      done: hasPerfilBase,
      href: "#datos",
      cta: "Completar perfil",
    },
    {
      id: "disponibilidad",
      label: "Configurar disponibilidad semanal",
      done: hasDisponibilidad,
      href: "/dashboard/profesor/clases/disponibilidad",
      cta: "Ir a Disponibilidad",
    },
    {
      id: "precios",
      label: "Definir precios",
      done: hasPrecios,
      href: "#precios",
      cta: "Configurar precios",
    },
  ];

  const gatewayProfile = gatewayResult.data;
  const gatewayInitialValues = {
    enabled: gatewayProfile?.payment_gateway_enabled ?? false,
    gateway: (gatewayProfile?.payment_gateway as "mercadopago" | null) ?? null,
    hasToken: Boolean(gatewayProfile?.payment_gateway_access_token),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Ajustes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Gestioná tu configuración integral en un solo lugar.
        </p>
      </header>

      <AjustesShell
        successMessage={resolvedSearchParams?.updated === "1" ? "Perfil actualizado correctamente." : null}
        checklist={checklist}
        perfilInitialValues={{
          name: profile.name,
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          sport: profile.sport ?? "tenis",
          provincia: profile.provincia ?? "",
          municipio: profile.zone ?? "",
          localidad: profile.localidad ?? "",
        }}
        priceInitialValues={{
          price_individual: profile.price_individual !== null ? String(profile.price_individual) : "",
          price_dobles: profile.price_dobles !== null ? String(profile.price_dobles) : "",
          price_trio: profile.price_trio !== null ? String(profile.price_trio) : "",
          price_grupal: profile.price_grupal !== null ? String(profile.price_grupal) : "",
        }}
        operationalInitialValues={{
          cancel_without_charge_hours:
            profile.cancel_without_charge_hours === null
              ? ""
              : String(profile.cancel_without_charge_hours),
          solo_warning_hours: profile.solo_warning_hours === null ? "" : String(profile.solo_warning_hours),
          solo_decision_deadline_minutes:
            profile.solo_decision_deadline_minutes === null
              ? ""
              : String(profile.solo_decision_deadline_minutes),
        }}
        invitaciones={invitaciones}
        clubsPropios={clubsPropios}
        clubs={clubs}
        availability={(availabilityData ?? []).map((row) => ({ ...row, club_nombre: null }))}
        blockedDates={blockedDatesData ?? []}
        clubsForAvailability={clubsForAvailability}
        clubsError={Boolean(clubsError)}
        gatewayInitialValues={gatewayInitialValues}
      />
    </main>
  );
}
