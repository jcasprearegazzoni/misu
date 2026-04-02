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
};

type BlockedDateRow = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
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
    .select("id, day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("profesor_id", profile.user_id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const { data: blockedDatesData } = await supabase
    .from("blocked_dates")
    .select("id, start_at, end_at, reason")
    .eq("profesor_id", profile.user_id)
    .order("start_at", { ascending: true });

  const availability = (availabilityData ?? []) as AvailabilityRow[];
  const blockedDates = (blockedDatesData ?? []) as BlockedDateRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Disponibilidad
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Configura horarios semanales y bloqueos sin salir de esta pantalla.
        </p>
      </header>

      <TabsNav activeTab={activeTab} />

      {activeTab === "disponibilidad" ? <DisponibilidadTab availability={availability} /> : null}
      {activeTab === "frecuente" ? <HorarioFrecuenteTab availability={availability} /> : null}
      {activeTab === "ausencias" ? <AusenciasTab blockedDates={blockedDates} /> : null}
    </main>
  );
}
