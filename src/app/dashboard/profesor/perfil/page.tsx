import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfesorSettingsForm } from "@/app/dashboard/profesor/configuracion/settings-form";
import { PriceSettingsForm } from "@/app/dashboard/profesor/finanzas/price-settings-form";
import { ClubsManager } from "./clubs-manager";
import { PerfilForm } from "./perfil-form";
import { InvitacionesManager } from "./invitaciones-manager";

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

type Club = {
  id: number;
  nombre: string;
  direccion: string | null;
  deporte: "tenis" | "padel" | "ambos";
  is_placeholder: boolean;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  cp_status: "pendiente" | "activo" | "inactivo";
};

type ClubJoinRow = {
  club_id: number;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  status: "pendiente" | "activo" | "inactivo";
  clubs:
    | {
        id: number;
        nombre: string;
        direccion: string | null;
        deporte: "tenis" | "padel" | "ambos";
        is_placeholder: boolean;
      }
    | null
    | Array<{
        id: number;
        nombre: string;
        direccion: string | null;
        deporte: "tenis" | "padel" | "ambos";
        is_placeholder: boolean;
      }>;
};

type Invitacion = {
  id: number;
  club: { nombre: string; direccion: string | null };
  invited_at: string;
};

type ClubPropio = {
  id: number;
  nombre: string;
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

  // Invitaciones pendientes con datos del club
  const { data: invitacionesData } = await supabase
    .from("club_profesores")
    .select("id, invited_at, clubs!club_profesores_club_id_fkey(nombre, direccion)")
    .eq("profesor_id", profile.user_id)
    .eq("status", "pendiente");


  const invitaciones: Invitacion[] = (invitacionesData ?? [])
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;
      if (!clubData) return null;
      return {
        id: row.id as number,
        invited_at: row.invited_at as string,
        club: {
          nombre: clubData.nombre,
          direccion: clubData.direccion ?? null,
        },
      };
    })
    .filter((row): row is Invitacion => row !== null);

  // Clubs placeholder del profesor
  const { data: clubsPropiosData } = await supabase
    .from("clubs")
    .select("id, nombre")
    .eq("created_by_profesor_id", profile.user_id)
    .eq("is_placeholder", true);

  const clubsPropios: ClubPropio[] = (clubsPropiosData ?? []).map((row) => ({
    id: row.id as number,
    nombre: row.nombre as string,
  }));

  // Obtener clubes del profesor via la tabla de relación.
  const { data: clubsData, error: clubsError } = await supabase
    .from("club_profesores")
    .select(`
      club_id,
      court_cost_mode,
      court_cost_per_hour,
      court_percentage_per_student,
      status,
      clubs!club_profesores_club_id_fkey (
        id,
        nombre,
        direccion,
        deporte,
        is_placeholder
      )
    `)
    .eq("profesor_id", profile.user_id)
    .eq("status", "activo");

  const clubs: Club[] = ((clubsData ?? []) as ClubJoinRow[])
    .map((row) => {
      const clubData = Array.isArray(row.clubs) ? row.clubs[0] ?? null : row.clubs;

      if (!clubData) {
        return null;
      }

      return {
        id: clubData.id,
        nombre: clubData.nombre,
        direccion: clubData.direccion,
        deporte: clubData.deporte,
        is_placeholder: clubData.is_placeholder,
        court_cost_mode: row.court_cost_mode,
        court_cost_per_hour: row.court_cost_per_hour,
        court_percentage_per_student: row.court_percentage_per_student,
        cp_status: row.status,
      };
    })
    .filter((row): row is Club => row !== null);

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
      label: "Definir precios",
      done: hasPrecios,
      href: "#precios",
      cta: "Configurar precios",
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

      {doneCount < checklist.length ? <section className="card mt-6 p-4">
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
      </section> : null}

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

      <section id="precios" className="mt-6">
        <div className="card p-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Precios
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Precio por tipo de clase. Se usa para calcular montos estimados y deudas.
          </p>
          <div className="mt-4">
            <PriceSettingsForm
              initialValues={{
                price_individual: profile.price_individual !== null ? String(profile.price_individual) : "",
                price_dobles: profile.price_dobles !== null ? String(profile.price_dobles) : "",
                price_trio: profile.price_trio !== null ? String(profile.price_trio) : "",
                price_grupal: profile.price_grupal !== null ? String(profile.price_grupal) : "",
              }}
            />
          </div>
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

      <section id="invitaciones" className="mb-8">
        <div className="card p-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Invitaciones
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Respondé invitaciones de clubes y vinculá tus clases si corresponde.
          </p>
          <div className="mt-4">
            <InvitacionesManager invitaciones={invitaciones} clubsPropios={clubsPropios} />
          </div>
        </div>
      </section>

      <section id="clubes" className="mb-8">
        <div className="card p-4">
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Clubes
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Administrá los clubes donde das clases y las condiciones de costo de cancha.
          </p>

          {clubsError ? (
            <p className="alert-error mt-4">
              No se pudieron cargar los clubes en este momento. Intentá nuevamente.
            </p>
          ) : (
            <ClubsManager clubs={clubs} />
          )}
        </div>
      </section>
    </main>
  );
}
