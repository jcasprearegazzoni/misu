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
            has_paleta: profile.has_paleta ?? false,
            has_raqueta: profile.has_raqueta ?? false,
          }}
        />
      </section>
    </main>
  );
}
