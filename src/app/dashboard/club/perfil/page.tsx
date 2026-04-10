import Link from "next/link";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClubPerfilForm } from "./perfil-form";

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

type PageProps = {
  searchParams?: Promise<{ updated?: string }>;
};

export default async function ClubPerfilPage({ searchParams }: PageProps) {
  const resolved = searchParams ? await searchParams : {};
  const profileUpdated = resolved.updated === "1";
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();

  const [canchasCountResult, disponibilidadCountResult, preciosCountResult, configuracionResult] = await Promise.all([
    supabase.from("canchas").select("id", { count: "exact", head: true }).eq("club_id", club.id).eq("activa", true),
    supabase.from("club_disponibilidad").select("id", { count: "exact", head: true }).eq("club_id", club.id),
    supabase.from("club_franjas_precio").select("id", { count: "exact", head: true }).eq("club_id", club.id),
    supabase
      .from("club_configuracion")
      .select("confirmacion_automatica, cancelacion_horas_limite")
      .eq("club_id", club.id)
      .maybeSingle(),
  ]);

  const canchasCount = canchasCountResult.count ?? 0;
  const disponibilidadCount = disponibilidadCountResult.count ?? 0;
  const preciosCount = preciosCountResult.count ?? 0;

  const hasDatosClub =
    Boolean(club.nombre?.trim()) && Boolean(club.direccion?.trim()) && Boolean(club.telefono?.trim());
  const hasCanchas = canchasCount > 0;
  const hasHorarios = disponibilidadCount > 0;
  const hasPrecios = preciosCount > 0;
  const configuracion = {
    confirmacion_automatica: configuracionResult.data?.confirmacion_automatica ?? true,
    cancelacion_horas_limite: configuracionResult.data?.cancelacion_horas_limite ?? 24,
  };

  const checklist: ChecklistItem[] = [
    {
      id: "datos",
      label: "Completar datos del club",
      done: hasDatosClub,
      href: "#datos",
      cta: "Completar datos",
    },
    {
      id: "canchas",
      label: "Agregar al menos una cancha",
      done: hasCanchas,
      href: "/dashboard/club/canchas",
      cta: "Agregar cancha",
    },
    {
      id: "horarios",
      label: "Configurar horarios de apertura",
      done: hasHorarios,
      href: "/dashboard/club/configuracion",
      cta: "Configurar horarios",
    },
    {
      id: "precios",
      label: "Definir precios por franja",
      done: hasPrecios,
      href: "/dashboard/club/configuracion",
      cta: "Definir precios",
    },
  ];

  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Perfil del club
        </h1>
      </header>

      {doneCount < checklist.length ? (
        <section className="card mt-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Configuración inicial
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
                    {item.done ? "\u2713" : "\u2022"}
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
      ) : null}

      <section id="datos" className="mt-6">
        <ClubPerfilForm
          club={club}
          configuracion={configuracion}
          successMessage={profileUpdated ? "Perfil actualizado correctamente." : null}
          returnTo="/dashboard/club/perfil"
        />
      </section>
    </main>
  );
}
