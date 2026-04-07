import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { AlumnoPerfilForm } from "./perfil-form";

type AlumnoPerfilPageProps = {
  searchParams?: Promise<{ redirectTo?: string; updated?: string }>;
};

type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
};

export default async function AlumnoPerfilPage({ searchParams }: AlumnoPerfilPageProps) {
  const profile = await getCurrentProfile();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "alumno") {
    redirect("/dashboard/profesor/perfil");
  }

  const hasPerfilBase = Boolean(profile.name?.trim()) && Boolean(profile.provincia?.trim());
  const hasDeporteYCategoria =
    profile.sport !== null &&
    (Boolean(profile.category_padel?.trim()) || Boolean(profile.category_tenis?.trim()));

  const checklist: ChecklistItem[] = [
    {
      id: "perfil",
      label: "Completar datos básicos",
      done: hasPerfilBase,
      href: "#datos",
      cta: "Completar perfil",
    },
    {
      id: "deporte",
      label: "Definir deporte y categoría",
      done: hasDeporteYCategoria,
      href: "#datos",
      cta: "Definir deporte",
    },
  ];

  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Mi perfil
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Completá tus datos para que el profesor pueda conocerte antes de la clase.
        </p>
      </header>

      {doneCount < checklist.length ? (
        <section className="card mt-6 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              Para empezar
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

      <section id="datos" className="card mt-6 p-4">
        <AlumnoPerfilForm
          redirectTo={resolvedSearchParams?.redirectTo ?? null}
          successMessage={resolvedSearchParams?.updated === "1" ? "Perfil actualizado correctamente." : null}
          initialValues={{
            name: profile.name,
            sport:
              profile.sport === "tenis" || profile.sport === "padel" || profile.sport === "ambos"
                ? profile.sport
                : "padel",
            category_padel:
              profile.category_padel === "Principiante" ||
              profile.category_padel === "8va" ||
              profile.category_padel === "7ma" ||
              profile.category_padel === "6ta" ||
              profile.category_padel === "5ta" ||
              profile.category_padel === "4ta" ||
              profile.category_padel === "3ra" ||
              profile.category_padel === "2da" ||
              profile.category_padel === "1ra"
                ? profile.category_padel
                : null,
            category_tenis:
              profile.category_tenis === "Principiante" ||
              profile.category_tenis === "Intermedio" ||
              profile.category_tenis === "Avanzado"
                ? profile.category_tenis
                : null,
            branch: profile.branch === "Dama" ? "Dama" : "Caballero",
            provincia: profile.provincia ?? "",
            municipio: profile.zone ?? "",
            localidad: profile.localidad ?? "",
            celular: profile.celular ?? "",
            has_paleta: profile.has_paleta ?? false,
            has_raqueta: profile.has_raqueta ?? false,
          }}
        />
      </section>
    </main>
  );
}
