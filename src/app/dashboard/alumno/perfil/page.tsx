import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { AlumnoPerfilForm } from "./perfil-form";

export default async function AlumnoPerfilPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "alumno") {
    redirect("/dashboard/profesor/perfil");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Mi perfil</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Completá tus datos para que el profesor pueda conocerte antes de la clase.
      </p>

      <AlumnoPerfilForm
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
    </main>
  );
}
