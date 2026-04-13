import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { WeekCalendarStrip } from "@/components/calendar/week-calendar-strip";
import { AppNavbar } from "@/components/app-navbar";
import { ReserveSlotForm } from "@/app/alumno/profesores/[profesorId]/slots/reserve-slot-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfesorSlotsByWeek, parseWeekOffset } from "@/lib/turnos/get-profesor-slots";
import { EnrollProgramForm } from "./enroll-program-form";

type PublicProfesorRow = {
  user_id: string;
  username: string;
  name: string;
  bio: string | null;
  sport: "tenis" | "padel" | "ambos" | null;
  price_individual: number | string | null;
  price_dobles: number | string | null;
  price_trio: number | string | null;
  price_grupal: number | string | null;
};

type ProgramRow = {
  id: number;
  nombre: string;
  total_clases: number;
  precio: number;
  descripcion: string | null;
  categoria: string | null;
  nivel: string;
  tipo_clase: string;
  cupo_max: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  hora_inicio: string;
  hora_fin: string;
  dias_semana: number[];
};

type PageProps = {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ weekOffset?: string; day?: string; pago?: "ok" | "pendiente" | "error" }>;
};

const PRECIO_LABELS: Array<{
  key: keyof Pick<PublicProfesorRow, "price_individual" | "price_dobles" | "price_trio" | "price_grupal">;
  label: string;
}> = [
  { key: "price_individual", label: "Individual" },
  { key: "price_dobles", label: "Dobles" },
  { key: "price_trio", label: "Trio" },
  { key: "price_grupal", label: "Grupal" },
];

const DIA_LABELS: Record<number, string> = { 0: "Dom", 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb" };

function formatDias(dias: number[]): string {
  return [...dias].sort((a, b) => a - b).map((d) => DIA_LABELS[d] ?? d).join(", ");
}

function normalizePrice(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSportLabel(sport: PublicProfesorRow["sport"]) {
  if (sport === "tenis") {
    return "Tenis";
  }
  if (sport === "padel") {
    return "Padel";
  }
  if (sport === "ambos") {
    return "Tenis y padel";
  }
  return "No definido";
}

export default async function PublicProfesorPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const weekOffset = parseWeekOffset(resolvedSearchParams?.weekOffset);
  const supabase = await createSupabaseServerClient();

  const { data: profesorData, error: profesorError } = await supabase.rpc("get_public_profesor_by_username", {
    p_username: username,
  });

  if (profesorError) {
    notFound();
  }

  const profesor = ((profesorData ?? [])[0] ?? null) as PublicProfesorRow | null;
  if (!profesor) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole: "alumno" | "profesor" | null = null;
  if (user) {
    const { data: roleData } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (roleData?.role === "alumno" || roleData?.role === "profesor") {
      userRole = roleData.role;
    }
  }

  const [{ data: programasData }, { data: gatewayData }] = await Promise.all([
    user
      ? supabase
          .from("programs")
          .select("id, nombre, total_clases, precio, descripcion, categoria, nivel, tipo_clase, cupo_max, fecha_inicio, fecha_fin, hora_inicio, hora_fin, dias_semana")
          .eq("profesor_id", profesor.user_id)
          .eq("visibilidad", "publico")
          .eq("estado", "activo")
          .eq("active", true)
          .order("precio", { ascending: true })
      : Promise.resolve({ data: [] as ProgramRow[] }),
    user
      ? supabase
          .from("profiles")
          .select("payment_gateway_enabled")
          .eq("user_id", profesor.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null as { payment_gateway_enabled?: boolean } | null }),
  ]);

  const activePrograms = (programasData ?? []) as ProgramRow[];
  const profesorGatewayEnabled = gatewayData?.payment_gateway_enabled ?? false;
  const pagoStatus = resolvedSearchParams?.pago;

  const slotsData = await getProfesorSlotsByWeek({
    supabase,
    profesorId: profesor.user_id,
    weekOffset,
    selectedDayParam: resolvedSearchParams?.day,
  });

  const loginHref = `/login?redirectTo=${encodeURIComponent(`/p/${profesor.username}`)}`;
  const preciosNormalizados = {
    price_individual: normalizePrice(profesor.price_individual),
    price_dobles: normalizePrice(profesor.price_dobles),
    price_trio: normalizePrice(profesor.price_trio),
    price_grupal: normalizePrice(profesor.price_grupal),
  };
  const preciosVisibles = PRECIO_LABELS.filter(({ key }) => preciosNormalizados[key] !== null);

  return (
    <>
      <AppNavbar />
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <section
          className="rounded-xl border p-4"
          style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted-2)" }}>
            Perfil publico
          </p>
          <h1 className="mt-1 text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
            {profesor.name}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
            Deporte: {getSportLabel(profesor.sport)}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {profesor.bio?.trim() || "Profesor de clases personalizadas."}
          </p>
        </section>

        {preciosVisibles.length > 0 ? (
          <section
            className="mt-4 rounded-2xl border p-4"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
              Precios por clase
            </p>
            <div className="mt-3 grid gap-2">
              {preciosVisibles.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    {label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    $ {preciosNormalizados[key]!.toLocaleString("es-AR", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {pagoStatus === "ok" ? (
          <div
            className="mt-4 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--success-border)", background: "var(--success-bg)", color: "var(--success)" }}
          >
            ¡Pago procesado! Tus créditos se activarán en unos segundos.
          </div>
        ) : null}
        {pagoStatus === "pendiente" ? (
          <div
            className="mt-4 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--warning)", background: "var(--warning-bg)", color: "var(--warning)" }}
          >
            Tu pago está siendo procesado. Te avisaremos cuando se confirme.
          </div>
        ) : null}
        {pagoStatus === "error" ? (
          <div
            className="mt-4 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--danger)", background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}
          >
            No pudimos procesar el pago. Podés intentarlo de nuevo.
          </div>
        ) : null}

        {activePrograms.length > 0 ? (
          <section
            className="mt-4 rounded-xl border p-4"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Programas
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
              {profesorGatewayEnabled
                ? "Inscribite y pagá online con MercadoPago."
                : "Solicitá la inscripción y coordiná el pago con el profesor para activar tus clases."}
            </p>

            <div className="mt-3 grid grid-cols-1 items-start gap-3 sm:grid-cols-2 md:grid-cols-3">
              {activePrograms.map((prog) =>
                userRole === "alumno" ? (
                  <div
                    key={prog.id}
                    className="rounded-lg border p-3"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  >
                    {prog.descripcion ? (
                      <p className="mb-2 text-xs" style={{ color: "var(--muted-2)" }}>
                        {prog.descripcion}
                      </p>
                    ) : null}
                    <EnrollProgramForm
                      programId={prog.id}
                      profesorId={profesor.user_id}
                      profesorUsername={profesor.username}
                      programaNombre={prog.nombre}
                      totalClases={prog.total_clases}
                      precio={Number(prog.precio)}
                      gatewayEnabled={profesorGatewayEnabled}
                    />
                  </div>
                ) : (
                  <div
                    key={prog.id}
                    className="rounded-lg border p-3"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {prog.nombre}
                    </p>
                    {prog.categoria ? (
                      <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                        {prog.categoria}
                      </p>
                    ) : null}
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {formatUserDate(prog.fecha_inicio)} → {formatUserDate(prog.fecha_fin)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {prog.tipo_clase} · {formatDias(prog.dias_semana)} · {prog.hora_inicio.slice(0, 5)} - {prog.hora_fin.slice(0, 5)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      }).format(Number(prog.precio))}
                    </p>
                    {prog.cupo_max !== null ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
                        Cupo máximo: {prog.cupo_max}
                      </p>
                    ) : null}
                    {!user ? (
                      <Link
                        href={loginHref}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition hover:opacity-90"
                        style={{ background: "var(--misu)", color: "#fff" }}
                      >
                        Solicitar inscripción
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs" style={{ color: "var(--muted-2)" }}>
                        Usa una cuenta de alumno para solicitar.
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        <WeekCalendarStrip
          weekDates={slotsData.weekDates}
          selectedDay={slotsData.selectedDay}
          tone="booking"
          subtitle="Semana disponible"
          prevHref={`/p/${profesor.username}?weekOffset=${Math.max(0, slotsData.weekOffset - 1)}&day=${slotsData.selectedDay}`}
          nextHref={`/p/${profesor.username}?weekOffset=${slotsData.weekOffset + 1}&day=${slotsData.selectedDay}`}
          dayHrefBuilder={(date) => `/p/${profesor.username}?weekOffset=${slotsData.weekOffset}&day=${date}`}
          resetHref={slotsData.weekOffset !== 0 ? `/p/${profesor.username}?weekOffset=0&day=${slotsData.todayIso}` : undefined}
        />

        {!slotsData.selectedGroup || slotsData.selectedGroup.items.length === 0 ? (
          <p
            className="mt-6 rounded-lg border px-4 py-3 text-sm"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            No hay clases disponibles para este dia.
          </p>
        ) : (
          <section
            className="mt-6 rounded-xl border px-4 py-3"
            style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {slotsData.selectedGroup.label}
            </p>
            <div className="mt-3 grid gap-2">
              {slotsData.selectedGroup.items.map((item) => (
                <div
                  key={item.slotKey}
                  className="rounded-md border px-3 py-3"
                  style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        {item.timeLabel}
                      </p>
                      {item.clubNombre ? (
                        <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                          {item.clubNombre}
                        </p>
                      ) : (
                        <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                          Particulares
                        </p>
                      )}
                      <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                        {item.slotInfoLabel}
                      </p>
                    </div>

                    <div className="min-w-40">
                      {!user ? (
                        <Link
                          href={loginHref}
                          className="btn-primary inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-xs font-medium"
                        >
                          Inicia sesion para reservar
                        </Link>
                      ) : userRole === "alumno" ? (
                        <ReserveSlotForm
                          profesorId={profesor.user_id}
                          date={item.date}
                          startTime={item.startTime}
                          endTime={item.endTime}
                          fixedType={item.fixedType}
                          sport={profesor.sport === "ambos" ? null : (profesor.sport ?? null)}
                        />
                      ) : (
                        <p
                          className="rounded-md border px-3 py-2 text-xs"
                          style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--muted)" }}
                        >
                          Estas logueado como profesor. Para reservar, usa una cuenta de alumno.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

