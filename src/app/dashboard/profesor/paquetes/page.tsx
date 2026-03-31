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
  package: { name: string; total_classes: number; active: boolean } | { name: string; total_classes: number; active: boolean }[] | null;
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

  // Fallback: si la RPC no esta disponible, toma alumnos desde bookings.
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

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Paquetes</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Crea paquetes, asignalos a alumnos y consumi creditos al confirmar reservas.
      </p>

      {hasLoadError ? (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-800">
          No se pudieron cargar los datos de paquetes. Revisa migraciones y vuelve a intentar.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <PackageForm />
            <AssignPackageForm
              alumnos={alumnos}
              packages={packages.filter((pack) => pack.active).map((pack) => ({
                id: pack.id,
                name: pack.name,
                total_classes: pack.total_classes,
              }))}
            />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">Paquetes disponibles</h2>
            {packages.filter((p) => p.active).length === 0 ? (
              <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
                Aun no hay paquetes disponibles. Crea uno arriba.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {packages.filter((p) => p.active).map((pack) => (
                  <li key={pack.id} className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm">
                    <p className="font-medium text-zinc-900">
                      {pack.name} — {pack.total_classes} clases
                    </p>
                    <p className="text-zinc-700">Precio: {formatAmount(Number(pack.price))}</p>
                    {pack.description ? <p className="text-zinc-500">{pack.description}</p> : null}
                    <form action={deactivatePackageAction} className="mt-3">
                      <input type="hidden" name="package_id" value={pack.id} />
                      <button className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
                        Eliminar
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-zinc-900">Paquetes asignados</h2>
            {studentPackages.length === 0 ? (
              <p className="mt-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-700">
                Aun no hay paquetes asignados.
              </p>
            ) : (
              <ul className="mt-3 grid gap-2">
                {studentPackages.map((assigned) => {
                  const pkgData = Array.isArray(assigned.package) ? assigned.package[0] : assigned.package;
                  const pkgName = pkgData?.name ?? packageNameMap.get(assigned.package_id) ?? "Sin nombre";
                  const alumnoName = alumnosMap.get(assigned.alumno_id)?.name ?? "Alumno";

                  return (
                  <li key={assigned.id} className={`rounded-lg border px-4 py-3 text-sm ${assigned.paid ? "border-zinc-300 bg-white" : "border-amber-200 bg-amber-50"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-zinc-900">{alumnoName}</p>
                        <p className="text-zinc-700">{pkgName} · {assigned.classes_remaining} clases restantes</p>
                        <p className="text-zinc-500 text-xs">Solicitado: {formatUserDate(assigned.created_at)}</p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${assigned.paid ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-100 text-amber-800"}`}>
                        {assigned.paid ? "Pagado" : "Pendiente"}
                      </span>
                    </div>

                    {!assigned.paid ? (
                      <form action={markStudentPackagePaidAction} className="mt-3">
                        <input type="hidden" name="student_package_id" value={assigned.id} />
                        <button className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white">
                          Confirmar pago — activar créditos
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
