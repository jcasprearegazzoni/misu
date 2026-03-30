import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const turnosSections = [
  {
    href: "/dashboard/profesor/calendario",
    title: "Calendario",
    description: "Pantalla operativa unica para confirmar, cancelar y cobrar clases.",
  },
  {
    href: "/dashboard/profesor/clases/disponibilidad",
    title: "Disponibilidad",
    description: "Configura horarios semanales y bloqueos de fechas.",
  },
  {
    href: "/dashboard/profesor/paquetes",
    title: "Paquetes",
    description: "Administra paquetes, asignaciones y creditos.",
  },
];

type OnboardingStep = {
  label: string;
  description: string;
  href?: string;
  done: boolean;
  comingSoon?: boolean;
};

function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const totalDone = steps.filter((s) => s.done).length;
  const actionableSteps = steps.filter((s) => !s.comingSoon);
  const allActionableDone = actionableSteps.every((s) => s.done);

  if (allActionableDone) {
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4">
      <p className="text-sm font-semibold text-sky-900">
        Primeros pasos ({totalDone}/{steps.length})
      </p>
      <p className="mt-1 text-sm text-sky-700">
        Completa estos pasos para que tus alumnos puedan reservar clases.
      </p>

      <ol className="mt-4 grid gap-3">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-start gap-3">
            {/* Indicador de estado */}
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                step.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-400 bg-white text-zinc-500"
              }`}
            >
              {step.done ? "✓" : index + 1}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-sm font-medium ${
                    step.done ? "text-zinc-400 line-through" : "text-zinc-900"
                  }`}
                >
                  {step.label}
                </p>
                {step.comingSoon ? (
                  <span className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-xs text-zinc-500">
                    Próximamente
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{step.description}</p>
              {step.href && !step.done && !step.comingSoon ? (
                <Link
                  href={step.href}
                  className="mt-2 inline-flex rounded-md border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-50"
                >
                  Configurar
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function ProfesorTurnosPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  const supabase = await createSupabaseServerClient();

  // Verificamos si ya configuró disponibilidad.
  const { count: availabilityCount } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .eq("profesor_id", profile.user_id);

  const hasDisponibilidad = (availabilityCount ?? 0) > 0;
  const hasPrecio = profile.price_individual !== null;

  const onboardingSteps: OnboardingStep[] = [
    {
      label: "Configurar disponibilidad",
      description: "Indicá en qué días y horarios das clases.",
      href: "/dashboard/profesor/clases/disponibilidad",
      done: hasDisponibilidad,
    },
    {
      label: "Configurar precios",
      description: "Cargá el precio por clase individual para que el calendario muestre montos.",
      href: "/dashboard/profesor/finanzas",
      done: hasPrecio,
    },
    {
      label: "Compartir tu link con alumnos",
      description: "Tu link público para que los alumnos reserven directamente.",
      done: false,
      comingSoon: true,
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Clases</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Acceso rapido a las secciones operativas de clases.
      </p>

      <OnboardingCard steps={onboardingSteps} />

      <div className="mt-6 grid gap-3">
        {turnosSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-3 hover:bg-zinc-50"
          >
            <p className="text-base font-semibold text-zinc-900">{section.title}</p>
            <p className="mt-1 text-sm text-zinc-700">{section.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
