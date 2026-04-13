import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignProgramToStudentAction,
  createProgramAction,
  deactivateProgramAction,
  markStudentProgramPaidAction,
} from "./actions";
import { AssignProgramForm } from "./assign-program-form";
import { ProgramForm } from "./program-form";

type ProgramRow = {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  nivel: string;
  deporte: string;
  tipo_clase: string;
  total_clases: number;
  precio: number;
  cupo_max: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  dias_semana: number[];
  hora_inicio: string;
  hora_fin: string;
  visibilidad: "privado" | "publico";
  estado: string;
  active: boolean;
  created_at: string;
};

type StudentProgramRow = {
  id: number;
  alumno_id: string;
  program_id: number;
  classes_remaining: number;
  paid: boolean;
  fecha_inscripcion: string;
  program: { nombre: string } | { nombre: string }[] | null;
};

type AlumnoOption = {
  user_id: string;
  name: string;
};

type AlumnoFromRpcRow = {
  alumno_id: string;
  alumno_name: string | null;
};

type AlumnoFallbackRow = {
  alumno_id: string;
};

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

const DIA_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDias(dias: number[]) {
  return [...dias].sort((a, b) => a - b).map((dia) => DIA_LABELS[dia] ?? String(dia)).join(", ");
}

export default async function ProfesorProgramasPage({ searchParams }: PageProps) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const activeTab = resolvedSearchParams?.tab === "membresias" ? "membresias" : "programas";

  const supabase = await createSupabaseServerClient();
  const [programasResult, inscripcionesResult, alumnosRpcResult, alumnosFallbackResult] = await Promise.all([
    supabase
      .from("programs")
      .select("id, nombre, descripcion, categoria, nivel, deporte, tipo_clase, total_clases, precio, cupo_max, fecha_inicio, fecha_fin, dias_semana, hora_inicio, hora_fin, visibilidad, estado, active, created_at")
      .eq("profesor_id", profile.user_id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_programs")
      .select("id, alumno_id, program_id, classes_remaining, paid, fecha_inscripcion, program:programs(nombre)")
      .eq("profesor_id", profile.user_id)
      .order("fecha_inscripcion", { ascending: false }),
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
    supabase.from("bookings").select("alumno_id").eq("profesor_id", profile.user_id).limit(200),
  ]);

  const programas = (programasResult.data ?? []) as ProgramRow[];
  const inscripciones = (inscripcionesResult.data ?? []) as StudentProgramRow[];

  const alumnosFromBookings = (alumnosRpcResult.data ?? []) as AlumnoFromRpcRow[];
  const alumnosFallback = (alumnosFallbackResult.data ?? []) as AlumnoFallbackRow[];
  const alumnosMap = new Map<string, AlumnoOption>();

  for (const row of alumnosFromBookings) {
    if (!alumnosMap.has(row.alumno_id)) {
      alumnosMap.set(row.alumno_id, {
        user_id: row.alumno_id,
        name: row.alumno_name?.trim() || "Alumno",
      });
    }
  }

  for (const row of alumnosFallback) {
    if (!alumnosMap.has(row.alumno_id)) {
      alumnosMap.set(row.alumno_id, {
        user_id: row.alumno_id,
        name: "Alumno",
      });
    }
  }

  for (const assigned of inscripciones) {
    if (!alumnosMap.has(assigned.alumno_id)) {
      alumnosMap.set(assigned.alumno_id, {
        user_id: assigned.alumno_id,
        name: "Alumno",
      });
    }
  }

  const alumnos = Array.from(alumnosMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));
  const hasLoadError = Boolean(programasResult.error || inscripcionesResult.error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          Dashboard / Profesor / Programas
        </p>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Programas
        </h1>
      </header>

      <div
        className="mt-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl p-1"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <Link
          href="/dashboard/profesor/programas?tab=programas"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={
            activeTab === "programas"
              ? { background: "var(--misu)", color: "#fff" }
              : { color: "var(--muted)" }
          }
        >
          Programas
        </Link>
        <Link
          href="/dashboard/profesor/programas?tab=membresias"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={
            activeTab === "membresias"
              ? { background: "var(--misu)", color: "#fff" }
              : { color: "var(--muted)" }
          }
        >
          Membresías
        </Link>
      </div>

      {activeTab === "membresias" ? (
        <div className="mt-6 rounded-xl border p-6 text-center" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Membresías</p>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Próximamente disponible.</p>
        </div>
      ) : hasLoadError ? (
        <p
          className="mt-6 rounded-lg px-4 py-3 text-sm"
          style={{
            border: "1px solid var(--error)",
            background: "color-mix(in srgb, var(--error) 10%, transparent)",
            color: "var(--error)",
          }}
        >
          No se pudieron cargar los datos de programas. Inténtalo nuevamente.
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card p-4">
              <ProgramForm action={createProgramAction} />
            </div>
            <div className="card p-4">
              <AssignProgramForm
                alumnos={alumnos}
                programs={programas.map((programa) => ({ id: programa.id, nombre: programa.nombre }))}
                action={assignProgramToStudentAction}
              />
            </div>
          </section>

          {programas.length === 0 ? (
            <p
              className="mt-6 rounded-lg px-4 py-3 text-sm"
              style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
            >
              Aún no hay programas activos.
            </p>
          ) : (
            <section className="mt-8 grid gap-3">
              {programas.map((programa) => {
                const inscriptos = inscripciones.filter((inscripcion) => inscripcion.program_id === programa.id);
                return (
                  <article key={programa.id} className="card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                          {programa.nombre}
                        </p>
                        {programa.categoria ? (
                          <p className="text-sm" style={{ color: "var(--muted)" }}>
                            {programa.categoria}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                          {programa.deporte} · {programa.nivel} · {programa.tipo_clase}
                        </p>
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          {formatUserDate(programa.fecha_inicio)} → {formatUserDate(programa.fecha_fin)}
                        </p>
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          {formatDias(programa.dias_semana)} · {programa.hora_inicio.slice(0, 5)} - {programa.hora_fin.slice(0, 5)}
                        </p>
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          {formatAmount(Number(programa.precio))}
                          {programa.cupo_max !== null ? ` · Cupo ${programa.cupo_max}` : ""}
                        </p>
                      </div>
                      <span
                        className="rounded-full border px-2 py-0.5 text-xs font-medium"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--surface-2)",
                          color: "var(--foreground)",
                        }}
                      >
                        {programa.visibilidad === "publico" ? "Público" : "Privado"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Inscriptos
                      </p>
                      {inscriptos.length === 0 ? (
                        <p className="text-sm" style={{ color: "var(--muted)" }}>
                          Sin inscripciones todavía.
                        </p>
                      ) : (
                        inscriptos.map((inscripcion) => {
                          return (
                            <div
                              key={inscripcion.id}
                              className="rounded-lg border px-3 py-2 text-sm"
                              style={{
                                borderColor: "var(--border)",
                                background: "var(--surface-2)",
                              }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="font-medium" style={{ color: "var(--foreground)" }}>
                                    {alumnosMap.get(inscripcion.alumno_id)?.name || "Alumno"}
                                  </p>
                                  <p style={{ color: "var(--muted)" }}>
                                    Clases restantes: {inscripcion.classes_remaining}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="rounded-full border px-2 py-0.5 text-xs font-medium"
                                    style={
                                      inscripcion.paid
                                        ? {
                                            borderColor: "var(--success)",
                                            background: "color-mix(in srgb, var(--success) 10%, transparent)",
                                            color: "var(--success)",
                                          }
                                        : {
                                            borderColor: "var(--warning)",
                                            background: "color-mix(in srgb, var(--warning) 10%, transparent)",
                                            color: "var(--warning)",
                                          }
                                    }
                                  >
                                    {inscripcion.paid ? "Pagado" : "Pendiente"}
                                  </span>
                                  {!inscripcion.paid ? (
                                    <form action={markStudentProgramPaidAction}>
                                      <input type="hidden" name="student_program_id" value={inscripcion.id} />
                                      <button className="btn-primary text-xs" style={{ padding: "0.4rem 0.7rem" }}>
                                        Marcar pagado
                                      </button>
                                    </form>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                      <AssignProgramForm
                        alumnos={alumnos}
                        programs={[{ id: programa.id, nombre: programa.nombre }]}
                        action={assignProgramToStudentAction}
                        defaultProgramId={programa.id}
                      />
                    </div>

                    <form action={deactivateProgramAction} className="mt-4">
                      <input type="hidden" name="program_id" value={programa.id} />
                      <button
                        className="rounded-md border px-3 py-1.5 text-xs font-medium transition"
                        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                      >
                        Desactivar programa
                      </button>
                    </form>
                  </article>
                );
              })}
            </section>
          )}
        </>
      )}
    </main>
  );
}
