import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConfiguracionForm } from "./configuracion-form";
import { HorariosPreciosManager } from "./horarios-precios-manager";

type ConfiguracionRow = {
  confirmacion_automatica: boolean;
  cancelacion_horas_limite: number;
};

type DisponibilidadRow = {
  id: number;
  deporte: "tenis" | "padel" | "futbol";
  day_of_week: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
};

type FranjaRow = {
  id: number;
  deporte: "tenis" | "padel" | "futbol";
  day_of_week: number;
  desde: string;
  hasta: string;
  duracion_minutos: number;
  precio: number;
  cancha_id: number | null;
};

type CanchaSimpleRow = {
  id: number;
  nombre: string;
  deporte: "tenis" | "padel" | "futbol";
};

export default async function ClubConfiguracionPage() {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();

  const [configResult, disponibilidadResult, franjasResult, canchasResult] = await Promise.all([
    supabase
      .from("club_configuracion")
      .select("confirmacion_automatica, cancelacion_horas_limite")
      .eq("club_id", club.id)
      .maybeSingle(),
    supabase
      .from("club_disponibilidad")
      .select("id, deporte, day_of_week, apertura, cierre, duraciones")
      .eq("club_id", club.id)
      .order("deporte", { ascending: true })
      .order("day_of_week", { ascending: true })
      .order("apertura", { ascending: true }),
    supabase
      .from("club_franjas_precio")
      .select("id, deporte, day_of_week, desde, hasta, duracion_minutos, precio, cancha_id")
      .eq("club_id", club.id)
      .order("deporte", { ascending: true })
      .order("day_of_week", { ascending: true })
      .order("desde", { ascending: true })
      .order("duracion_minutos", { ascending: true }),
    supabase
      .from("canchas")
      .select("id, nombre, deporte")
      .eq("club_id", club.id)
      .eq("activa", true)
      .order("deporte", { ascending: true })
      .order("nombre", { ascending: true }),
  ]);

  const configuracion = (configResult.data ?? {
    confirmacion_automatica: true,
    cancelacion_horas_limite: 24,
  }) as ConfiguracionRow;

  const disponibilidad = (disponibilidadResult.data ?? []) as DisponibilidadRow[];
  const franjas = (franjasResult.data ?? []) as FranjaRow[];
  const canchas = (canchasResult.data ?? []) as CanchaSimpleRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl" style={{ color: "var(--foreground)" }}>
          Configuracion
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Administra la jornada operativa, precios y ajustes del club.
        </p>
      </header>

      <ConfiguracionForm initialValues={configuracion} />
      <HorariosPreciosManager disponibilidad={disponibilidad} franjas={franjas} canchas={canchas} />
    </main>
  );
}
