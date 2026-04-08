import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubCalendarClient } from "./club-calendar-client";

type PageProps = {
  searchParams?: Promise<{ deporte?: string; fecha?: string; view?: string }>;
};

type Deporte = "tenis" | "padel" | "futbol";
type CalendarView = "week" | "day";

type ReservaRow = {
  id: number;
  cancha_id: number;
  deporte: Deporte;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  reserva_participantes: Array<{
    nombre: string;
    email: string | null;
    telefono: string | null;
    es_organizador: boolean;
  }>;
};

export type CalendarEvent = {
  id: number;
  canchaId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  canchaNombre: string;
  deporte: Deporte;
  duracionMinutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  organizadorNombre: string | null;
  organizadorEmail: string | null;
  organizadorTelefono: string | null;
};

export type CalendarCourt = {
  id: number;
  nombre: string;
};

const DEPORTES_VISIBLES: Deporte[] = ["tenis", "padel", "futbol"];

function toDateIsoArg(date: Date) {
  const formatter = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function getTodayIsoArg() {
  return toDateIsoArg(new Date());
}

function parseDate(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return getTodayIsoArg();
}

function parseView(value: string | undefined): CalendarView {
  return value === "day" ? "day" : "week";
}

function addDaysIso(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWeekIso(isoDate: string) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export default async function ClubCalendarioPage({ searchParams }: PageProps) {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const fecha = parseDate(resolvedSearchParams?.fecha);
  const view = parseView(resolvedSearchParams?.view);

  const { data: deportesData } = await supabase
    .from("club_disponibilidad")
    .select("deporte")
    .eq("club_id", club.id);

  const deportes = Array.from(new Set((deportesData ?? []).map((item) => item.deporte))) as Deporte[];
  const deportesVisibles = deportes.filter((deporte) => DEPORTES_VISIBLES.includes(deporte));
  const deporteSeleccionado =
    resolvedSearchParams?.deporte && DEPORTES_VISIBLES.includes(resolvedSearchParams.deporte as Deporte)
      ? (resolvedSearchParams.deporte as Deporte)
      : deportesVisibles[0] ?? "tenis";

  const rangeStart = view === "week" ? startOfWeekIso(fecha) : fecha;
  const rangeEndExclusive = view === "week" ? addDaysIso(rangeStart, 7) : addDaysIso(fecha, 1);

  const days = view === "week" ? Array.from({ length: 7 }, (_, i) => addDaysIso(rangeStart, i)) : [fecha];

  const { data: canchasData } = await supabase
    .from("canchas")
    .select("id, nombre, deporte, activa")
    .eq("club_id", club.id);

  const canchaNombreById = new Map((canchasData ?? []).map((cancha) => [cancha.id, cancha.nombre]));
  const canchasActivasDeporte = (canchasData ?? []).filter(
    (cancha) => cancha.deporte === deporteSeleccionado && cancha.activa,
  ) as Array<{ id: number; nombre: string }>;

  // Fuente unica: calendario de club lee solo reservas_cancha (alquileres + clases espejo).
  const { data, error } = await supabase
    .from("reservas_cancha")
    .select(
      "id, cancha_id, deporte, fecha, hora_inicio, hora_fin, duracion_minutos, estado, tipo, reserva_participantes(nombre, email, telefono, es_organizador)",
    )
    .eq("club_id", club.id)
    .eq("deporte", deporteSeleccionado)
    .gte("fecha", rangeStart)
    .lt("fecha", rangeEndExclusive)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  const reservas = (data ?? []) as ReservaRow[];

  const eventos: CalendarEvent[] = reservas.map((reserva) => {
    const organizador =
      reserva.reserva_participantes.find((participante) => participante.es_organizador) ??
      reserva.reserva_participantes[0] ??
      null;

    return {
      id: reserva.id,
      canchaId: reserva.cancha_id,
      fecha: reserva.fecha,
      horaInicio: reserva.hora_inicio,
      horaFin: reserva.hora_fin,
      canchaNombre: canchaNombreById.get(reserva.cancha_id) ?? `Cancha ${reserva.cancha_id}`,
      deporte: reserva.deporte,
      duracionMinutos: reserva.duracion_minutos,
      estado: reserva.estado,
      tipo: reserva.tipo,
      organizadorNombre: organizador?.nombre ?? null,
      organizadorEmail: organizador?.email ?? null,
      organizadorTelefono: organizador?.telefono ?? null,
    };
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Calendario
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Operacion diaria de reservas por deporte, en formato calendario.
        </p>
      </header>

      {error ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--error-border)",
            background: "var(--error-bg)",
            color: "var(--error)",
          }}
        >
          No se pudieron cargar las reservas del calendario. {error.message}
        </div>
      ) : (
        <ClubCalendarClient
          deporte={deporteSeleccionado}
          fecha={fecha}
          view={view}
          deportesVisibles={deportesVisibles}
          days={days}
          eventos={eventos}
          canchas={canchasActivasDeporte.map((cancha) => ({ id: cancha.id, nombre: cancha.nombre }))}
        />
      )}
    </main>
  );
}
