import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const turnosSections = [
  {
    href: "/dashboard/profesor/calendario",
    icon: "📅",
    title: "Calendario",
    description: "Pantalla operativa única para confirmar, cancelar y cobrar clases.",
  },
  {
    href: "/dashboard/profesor/clases/disponibilidad",
    icon: "🕐",
    title: "Disponibilidad",
    description: "Configurá horarios semanales y bloqueos de fechas.",
  },
  {
    href: "/dashboard/profesor/paquetes",
    icon: "📦",
    title: "Paquetes",
    description: "Administrá paquetes, asignaciones y créditos.",
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
    <section
      className="rounded-xl p-5"
      style={{
        background: "var(--info-bg)",
        border: "1px solid var(--info-border)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold" style={{ color: "#93c5fd" }}>
          Primeros pasos
        </p>
        <span
          className="text-xs font-bold"
          style={{
            background: "var(--info-bg)",
            border: "1px solid var(--info-border)",
            color: "#93c5fd",
            padding: "2px 8px",
            borderRadius: "999px",
          }}
        >
          {totalDone}/{steps.length}
        </span>
      </div>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Completá estos pasos para que tus alumnos puedan reservar clases.
      </p>

      {/* Barra de progreso */}
      <div
        className="mt-3 h-1.5 w-full rounded-full"
        style={{ background: "rgba(59,130,246,0.2)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(totalDone / steps.length) * 100}%`,
            background: "var(--info)",
          }}
        />
      </div>

      <ol className="mt-5 grid gap-4">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-start gap-3">
            {/* Ícono de estado */}
            <div
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={
                step.done
                  ? { background: "var(--success)", color: "#fff" }
                  : { background: "var(--surface-3)", border: "1px solid var(--border-hover)", color: "var(--muted)" }
              }
            >
              {step.done ? "✓" : index + 1}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: step.done ? "var(--muted-2)" : "var(--foreground)",
                    textDecoration: step.done ? "line-through" : "none",
                  }}
                >
                  {step.label}
                </p>
                {step.comingSoon ? (
                  <span
                    className="text-xs"
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border)",
                      color: "var(--muted-2)",
                      padding: "1px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    Próximamente
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                {step.description}
              </p>
              {step.href && !step.done && !step.comingSoon ? (
                <Link
                  href={step.href}
                  className="mt-2 inline-flex rounded-lg px-3 py-1.5 text-xs font-medium transition"
                  style={{
                    background: "rgba(59,130,246,0.1)",
                    border: "1px solid var(--info-border)",
                    color: "#93c5fd",
                  }}
                >
                  Configurar →
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
    <main
      className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-8 sm:px-6 sm:py-10"
    >
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-black tracking-tight sm:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          Clases
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Acceso rápido a las secciones operativas de clases.
        </p>
      </div>

      {/* Onboarding steps */}
      <div className="mt-6">
        <OnboardingCard steps={onboardingSteps} />
      </div>

      {/* Secciones rápidas */}
      <div className="mt-6 grid gap-3">
        {turnosSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="card-link flex items-center gap-4 px-5 py-4"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
              style={{
                background: "var(--misu-subtle)",
                border: "1px solid var(--border-misu)",
              }}
            >
              {section.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {section.title}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                {section.description}
              </p>
            </div>
            <span style={{ color: "var(--muted-2)", fontSize: "18px" }}>›</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
