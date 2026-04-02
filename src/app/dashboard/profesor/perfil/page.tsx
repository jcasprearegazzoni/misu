import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfesorSettingsForm } from "@/app/dashboard/profesor/configuracion/settings-form";
import { PerfilForm } from "./perfil-form";

type PerfilProfesorPageProps = {
  searchParams?: Promise<{ updated?: string }>;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export default async function PerfilProfesorPage({ searchParams }: PerfilProfesorPageProps) {
  const profile = await getCurrentProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  const supabase = await createSupabaseServerClient();
  const { count: availabilityCount } = await supabase
    .from("availability")
    .select("id", { count: "exact", head: true })
    .eq("profesor_id", profile.user_id);

  const hasDisponibilidad = (availabilityCount ?? 0) > 0;
  const hasPrecios =
    profile.price_individual !== null ||
    profile.price_dobles !== null ||
    profile.price_trio !== null ||
    profile.price_grupal !== null;
  const hasPerfilBase = Boolean(profile.name?.trim()) && Boolean(profile.provincia?.trim());

  const checklist: ChecklistItem[] = [
    {
      id: "perfil",
      label: "Completar datos básicos del perfil",
      done: hasPerfilBase,
      href: "#datos",
      cta: "Completar perfil",
    },
    {
      id: "disponibilidad",
      label: "Configurar disponibilidad semanal",
      done: hasDisponibilidad,
      href: "/dashboard/profesor/clases/disponibilidad",
      cta: "Ir a Disponibilidad",
    },
    {
      id: "precios",
      label: "Definir precios en Finanzas",
      done: hasPrecios,
      href: "/dashboard/profesor/finanzas",
      cta: "Ir a Finanzas",
    },
  ];

  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Perfil
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Gestioná tus datos, ajustes operativos y estado de configuración.
        </p>
      </header>

      <section className="card mt-6 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Onboarding
          </h2>
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {doneCount}/{checklist.length} completados
          </span>
        </div>
        <ul className="mt-3 grid gap-2">
          {checklist.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: item.done ? "var(--success-border)" : "var(--border)",
                background: item.done ? "var(--success-bg)" : "var(--surface-2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: item.done ? "rgba(34, 197, 94, 0.2)" : "var(--surface-3)",
                    color: item.done ? "var(--success)" : "var(--muted)",
                  }}
                >
                  {item.done ? "✓" : "•"}
                </span>
                <span style={{ color: "var(--foreground)" }}>{item.label}</span>
              </div>
              {!item.done ? (
                <Link href={item.href} className="btn-secondary" style={{ padding: "0.4rem 0.7rem" }}>
                  {item.cta}
                </Link>
              ) : (
                <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
                  Completo
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="datos" className="mt-6">
        <div className="card p-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Datos del profesor
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Información visible para alumnos y configuración de tu perfil público.
          </p>
          <PerfilForm
            successMessage={resolvedSearchParams?.updated === "1" ? "Perfil actualizado correctamente." : null}
            initialValues={{
              name: profile.name,
              username: profile.username ?? "",
              bio: profile.bio ?? "",
              sport: profile.sport ?? "tenis",
              provincia: profile.provincia ?? "",
              municipio: profile.zone ?? "",
            }}
          />
        </div>
      </section>

      <section id="ajustes" className="mt-6 mb-8">
        <div className="card p-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Ajustes operativos
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Reglas de cancelación y comportamiento cuando un alumno queda solo.
          </p>
          <ProfesorSettingsForm
            initialValues={{
              cancel_without_charge_hours:
                profile.cancel_without_charge_hours === null
                  ? ""
                  : String(profile.cancel_without_charge_hours),
              solo_warning_hours:
                profile.solo_warning_hours === null ? "" : String(profile.solo_warning_hours),
              solo_decision_deadline_minutes:
                profile.solo_decision_deadline_minutes === null
                  ? ""
                  : String(profile.solo_decision_deadline_minutes),
            }}
          />
        </div>
      </section>
    </main>
  );
}
