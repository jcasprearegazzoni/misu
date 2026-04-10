import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AusenciasTab } from "./ausencias-tab";
import { DisponibilidadTab } from "./disponibilidad-tab";
import { HorarioFrecuenteTab } from "./horario-frecuente-tab";
import { TabsNav, type DisponibilidadTabKey } from "./tabs-nav";

type AvailabilityRow = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  club_id: number | null;
  club_nombre: string | null;
};

type BlockedDateRow = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type ClubOptionRow = {
  club_id: number;
  clubs:
    | {
        id: number;
        nombre: string;
      }
    | null
    | Array<{
        id: number;
        nombre: string;
      }>;
};

function resolveTab(tab?: string): DisponibilidadTabKey {
  if (tab === "disponibilidad") {
    return "disponibilidad";
  }

  if (tab === "ausencias") {
    return "ausencias";
  }

  return "frecuente";
}

type DisponibilidadPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function DisponibilidadClasesPage({ searchParams }: DisponibilidadPageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = resolveTab(resolvedSearchParams?.tab);

  const { data: availabilityData } = await supabase
    .from("availability")
    .select("id, day_of_week, start_time, end_time, slot_duration_minutes, club_id")
    .eq("profesor_id", profile.user_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: blockedDatesData } = await supabase
    .from("blocked_dates")
    .select("id, start_at, end_at, reason")
    .eq("profesor_id", profile.user_id)
    .order("start_at", { ascending: true });

  // Clubs activos del profesor (para el selector en disponibilidad).
  const { data: clubProfData } = await supabase
    .from("club_profesores")
    .select("club_id, clubs(id, nombre)")
    .eq("profesor_id", profile.user_id)
    .eq("status", "activo");

  const blockedDates = (blockedDatesData ?? []) as BlockedDateRow[];
  const clubs = ((clubProfData ?? []) as ClubOptionRow[])
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;

      if (!clubData) {
        return null;
      }

      return {
        id: clubData.id,
        nombre: clubData.nombre,
      };
    })
    .filter((row): row is { id: number; nombre: string } => row !== null);
  const clubsById = new Map(clubs.map((club) => [club.id, club.nombre]));
  const availability = ((availabilityData ?? []) as Array<Omit<AvailabilityRow, "club_nombre">>).map((item) => ({
    ...item,
    club_nombre: item.club_id ? clubsById.get(item.club_id) ?? null : null,
  }));

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Disponibilidad
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Configura horarios semanales y bloqueos sin salir de esta pantalla.
        </p>
      </header>

      <TabsNav activeTab={activeTab} />

      {activeTab === "disponibilidad" ? <DisponibilidadTab availability={availability} clubs={clubs} /> : null}
      {activeTab === "frecuente" ? <HorarioFrecuenteTab availability={availability} clubs={clubs} /> : null}
      {activeTab === "ausencias" ? <AusenciasTab blockedDates={blockedDates} /> : null}
    </main>
  );
}
