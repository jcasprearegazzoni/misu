import Link from "next/link";
import { redirect } from "next/navigation";
import { formatUserDate } from "@/lib/format/date";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deactivatePackageAction, markStudentPackagePaidAction } from "./actions";
import { AssignPackageForm } from "./assign-package-form";
import { PackageForm } from "./package-form";

type PackageRow = {
  id: number;
  name: string;
  total_classes: number;
  price: number;
  description: string | null;
  active: boolean;
  created_at: string;
};

type StudentPackageRow = {
  id: number;
  alumno_id: string;
  package_id: number;
  classes_remaining: number;
  paid: boolean;
  created_at: string;
  package:
    | { name: string; total_classes: number; active: boolean }
    | { name: string; total_classes: number; active: boolean }[]
    | null;
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ProfesorPaquetesPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const [packagesResult, studentPackagesResult, alumnosRpcResult, alumnosFallbackResult] = await Promise.all([
    supabase
      .from("packages")
      .select("id, name, total_classes, price, description, active, created_at")
      .eq("profesor_id", profile.user_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("student_packages")
      .select("id, alumno_id, package_id, classes_remaining, paid, created_at, package:packages(name, total_classes, active)")
      .eq("profesor_id", profile.user_id)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_profesor_bookings_with_alumno_name", {
      p_profesor_id: profile.user_id,
    }),
    supabase.from("bookings").select("alumno_id").eq("profesor_id", profile.user_id).limit(200),
  ]);

  const packages = (packagesResult.data ?? []) as PackageRow[];
  const studentPackages = (studentPackagesResult.data ?? []) as StudentPackageRow[];

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

  // Fallback: si la RPC no está disponible, toma alumnos desde bookings.
  for (const row of alumnosFallback) {
    if (!alumnosMap.has(row.alumno_id)) {
      alumnosMap.set(row.alumno_id, {
        user_id: row.alumno_id,
        name: "Alumno",
      });
    }
  }

  // Si no hay datos por RPC, se asegura al menos incluir alumnos ya asignados.
  for (const assigned of studentPackages) {
    if (!alumnosMap.has(assigned.alumno_id)) {
      alumnosMap.set(assigned.alumno_id, {
        user_id: assigned.alumno_id,
        name: "Alumno",
      });
    }
  }

  const alumnos = Array.from(alumnosMap.values()).sort((a, b) => a.name.localeCompare(b.name, "es"));

  const hasLoadError = Boolean(packagesResult.error || studentPackagesResult.error);
  const packageNameMap = new Map(packages.map((pack) => [pack.id, pack.name]));
  const activePackages = packages.filter((pack) => pack.active);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
            Paquetes
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
            Asigná y seguí paquetes de clases en una sola pantalla.
          </p>
        </div>
        <Link href="#asignar-paquete" className="btn-primary w-full sm:w-auto">
          Asignar paquete
        </Link>
      </header>

      {hasLoadError ? (
        <p className="mt-6 rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid var(--error-border)", background: "var(--error-bg)", color: "#fca5a5" }}>
          No se pudieron cargar los datos de paquetes. Inténtalo nuevamente.
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <div id="asignar-paquete" className="card p-4">
              <AssignPackageForm
                alumnos={alumnos}
                packages={activePackages.map((pack) => ({
                  id: pack.id,
                  name: pack.name,
                  total_classes: pack.total_classes,
                }))}
              />
            </div>
            <div className="card p-4">
              <PackageForm />
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Paquetes activos
            </h2>
            {activePackages.length === 0 ? (
              <p className="mt-3 rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
                Aún no hay paquetes activos.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {activePackages.map((pack) => (
                  <li key={pack.id} className="card px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium" style={{ color: "var(--foreground)" }}>
                          {pack.name} · {pack.total_classes} clases
                        </p>
                        <p style={{ color: "var(--muted)" }}>Precio: {formatAmount(Number(pack.price))}</p>
                        {pack.description ? <p style={{ color: "var(--muted-2)" }}>{pack.description}</p> : null}
                      </div>
                      <form action={deactivatePackageAction}>
                        <input type="hidden" name="package_id" value={pack.id} />
                        <button
                          className="rounded-md border px-3 py-1.5 text-xs font-medium transition"
                          style={{ borderColor: "var(--border-misu)", color: "var(--misu-light)" }}
                        >
                          Desactivar
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Paquetes asignados
            </h2>
            {studentPackages.length === 0 ? (
              <p className="mt-3 rounded-lg px-4 py-3 text-sm" style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}>
                Aún no hay paquetes asignados.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {studentPackages.map((assigned) => {
                  const pkgData = Array.isArray(assigned.package) ? assigned.package[0] : assigned.package;
                  const pkgName = pkgData?.name ?? packageNameMap.get(assigned.package_id) ?? "Sin nombre";
                  const alumnoName = alumnosMap.get(assigned.alumno_id)?.name ?? "Alumno";

                  return (
                    <li
                      key={assigned.id}
                      className="rounded-lg border px-4 py-3 text-sm"
                      style={{
                        borderColor: assigned.paid ? "var(--border)" : "var(--warning-border)",
                        background: assigned.paid ? "var(--surface-1)" : "var(--warning-bg)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>
                            {alumnoName}
                          </p>
                          <p style={{ color: "var(--muted)" }}>
                            {pkgName} · {assigned.classes_remaining} clases restantes
                          </p>
                          <p className="text-xs" style={{ color: "var(--muted-2)" }}>
                            Solicitado: {formatUserDate(assigned.created_at)}
                          </p>
                        </div>
                        <span
                          className="rounded-full border px-2 py-0.5 text-xs font-medium"
                          style={
                            assigned.paid
                              ? {
                                  borderColor: "var(--success-border)",
                                  background: "var(--success-bg)",
                                  color: "var(--success)",
                                }
                              : {
                                  borderColor: "var(--warning-border)",
                                  background: "var(--warning-bg)",
                                  color: "var(--warning)",
                                }
                          }
                        >
                          {assigned.paid ? "Pagado" : "Pendiente"}
                        </span>
                      </div>

                      {!assigned.paid ? (
                        <form action={markStudentPackagePaidAction} className="mt-3">
                          <input type="hidden" name="student_package_id" value={assigned.id} />
                          <button className="btn-primary text-xs" style={{ padding: "0.45rem 0.8rem" }}>
                            Confirmar pago
                          </button>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
