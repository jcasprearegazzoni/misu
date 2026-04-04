import Link from "next/link";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelarReservaAction, confirmarReservaAction } from "./actions";

type PageProps = {
  searchParams?: Promise<{ deporte?: string; fecha?: string }>;
};

type ReservaRow = {
  id: number;
  cancha_id: number;
  deporte: "tenis" | "padel" | "futbol";
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  tipo: "alquiler" | "clase";
  profesor_id: string | null;
  canchas: Array<{ nombre: string }> | null;
  reserva_participantes: Array<{
    nombre: string;
    email: string | null;
    telefono: string | null;
    es_organizador: boolean;
  }>;
};

const DEPORTES_VISIBLES = ["tenis", "padel", "futbol"] as const;

function toDateIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return toDateIso(new Date());
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateIso(date);
}

function getDeporteLabel(value: ReservaRow["deporte"]) {
  if (value === "tenis") return "Tenis";
  if (value === "padel") return "Padel";
  if (value === "futbol") return "Futbol";
  return "Sin deporte";
}

function getEstadoStyle(estado: ReservaRow["estado"]) {
  if (estado === "confirmada") {
    return { background: "var(--success-bg)", color: "var(--success)" };
  }
  if (estado === "pendiente") {
    return { background: "var(--warning-bg)", color: "var(--warning)" };
  }
  return { background: "var(--muted-2)", color: "var(--muted)" };
}

function getTipoStyle(tipo: ReservaRow["tipo"]) {
  if (tipo === "alquiler") {
    return { background: "rgba(59, 130, 246, 0.18)", color: "#93c5fd" };
  }
  return { background: "rgba(249, 115, 22, 0.18)", color: "#fdba74" };
}

export default async function ClubCalendarioPage({ searchParams }: PageProps) {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const fecha = parseDate(resolvedSearchParams?.fecha);
  const { data: deportesData } = await supabase
    .from("club_disponibilidad")
    .select("deporte")
    .eq("club_id", club.id);
  const deportes = Array.from(new Set((deportesData ?? []).map((item) => item.deporte))) as ReservaRow["deporte"][];
  const deportesVisibles = deportes.filter((deporte) =>
    DEPORTES_VISIBLES.includes(deporte as (typeof DEPORTES_VISIBLES)[number]),
  );

  const deporteSeleccionado =
    resolvedSearchParams?.deporte && DEPORTES_VISIBLES.includes(resolvedSearchParams.deporte as (typeof DEPORTES_VISIBLES)[number])
      ? (resolvedSearchParams.deporte as ReservaRow["deporte"])
      : deportesVisibles[0] ?? "tenis";

  const { data } = await supabase
    .from("reservas_cancha")
    .select(
      "id, cancha_id, deporte, fecha, hora_inicio, hora_fin, duracion_minutos, estado, tipo, profesor_id, canchas(nombre), reserva_participantes(nombre, email, telefono, es_organizador)",
    )
    .eq("club_id", club.id)
    .eq("fecha", fecha)
    .eq("deporte", deporteSeleccionado)
    .order("hora_inicio");

  const reservas = (data ?? []) as ReservaRow[];
  const groupedByCancha = reservas.reduce<Record<string, ReservaRow[]>>((acc, reserva) => {
    const canchaNombre = reserva.canchas?.[0]?.nombre ?? `Cancha ${reserva.cancha_id}`;
    if (!acc[canchaNombre]) acc[canchaNombre] = [];
    acc[canchaNombre].push(reserva);
    return acc;
  }, {});

  const buildHref = (next: { deporte?: string; fecha?: string }) => {
    const params = new URLSearchParams();
    params.set("deporte", next.deporte ?? deporteSeleccionado);
    params.set("fecha", next.fecha ?? fecha);
    return `/dashboard/club/calendario?${params.toString()}`;
  };

  const prevDay = addDays(fecha, -1);
  const nextDay = addDays(fecha, 1);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Calendario
        </h1>
      </header>

      <section className="card grid gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          {deportesVisibles.map((deporte) => (
            <Link
              key={deporte}
              href={buildHref({ deporte })}
              className="pill"
              style={deporte === deporteSeleccionado ? { background: "var(--misu)", color: "var(--background)" } : undefined}
            >
              {getDeporteLabel(deporte)}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <Link href={buildHref({ fecha: prevDay })} className="btn-ghost text-sm">
            ← Dia anterior
          </Link>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {fecha}
          </p>
          <Link href={buildHref({ fecha: nextDay })} className="btn-ghost text-sm">
            Dia siguiente →
          </Link>
        </div>

        {reservas.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No hay reservas para este dia.
          </p>
        ) : (
          <div className="grid gap-3">
            {Object.entries(groupedByCancha).map(([canchaNombre, canchaReservas]) => (
              <div key={canchaNombre} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  {canchaNombre}
                </p>
                <div className="mt-2 grid gap-2">
                  {canchaReservas.map((reserva) => {
                    const organizador =
                      reserva.reserva_participantes.find((p) => p.es_organizador) ??
                      reserva.reserva_participantes[0];
                    return (
                      <div key={reserva.id} className="rounded-md border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {reserva.hora_inicio.slice(0, 5)}-{reserva.hora_fin.slice(0, 5)} · {reserva.duracion_minutos} min
                            </p>
                            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                              Organizador: {organizador?.nombre ?? "Sin datos"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="pill" style={getEstadoStyle(reserva.estado)}>
                              {reserva.estado}
                            </span>
                            <span className="pill" style={getTipoStyle(reserva.tipo)}>
                              {reserva.tipo}
                            </span>
                          </div>
                        </div>

                        {(reserva.estado === "pendiente" || reserva.estado === "confirmada") ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reserva.estado === "pendiente" ? (
                              <form action={confirmarReservaAction}>
                                <input type="hidden" name="reserva_id" value={reserva.id} />
                                <button type="submit" className="btn-primary text-xs">
                                  Confirmar
                                </button>
                              </form>
                            ) : null}
                            <form action={cancelarReservaAction}>
                              <input type="hidden" name="reserva_id" value={reserva.id} />
                              <button type="submit" className="btn-ghost text-xs" style={{ color: "var(--error)" }}>
                                Cancelar
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
