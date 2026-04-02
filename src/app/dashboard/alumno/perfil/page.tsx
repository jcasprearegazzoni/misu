import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { AlumnoPerfilForm } from "./perfil-form";

type AlumnoPerfilPageProps = {
  searchParams?: Promise<{ redirectTo?: string; updated?: string }>;
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

      <section className="card mt-6 p-4">
        <AlumnoPerfilForm
          redirectTo={resolvedSearchParams?.redirectTo ?? null}
          successMessage={resolvedSearchParams?.updated === "1" ? "Perfil actualizado correctamente." : null}
          initialValues={{
            name: profile.name,
            category:
              profile.category === "Principiante" ||
              profile.category === "8va" ||
              profile.category === "7ma" ||
              profile.category === "6ta" ||
              profile.category === "5ta" ||
              profile.category === "4ta" ||
              profile.category === "3ra" ||
              profile.category === "2da" ||
              profile.category === "1ra"
                ? profile.category
                : "Principiante",
            branch: profile.branch === "Dama" ? "Dama" : "Caballero",
            provincia: profile.provincia ?? "",
            municipio: profile.zone ?? "",
            has_equipment: profile.has_equipment,
          }}
        />
      </section>
    </main>
  );
}
