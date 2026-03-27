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
      <h1 className="text-2xl font-semibold text-zinc-900">Perfil</h1>
      <p className="mt-2 text-sm text-zinc-600">Completa y actualiza tus datos como alumno.</p>

      <div className="mt-6 rounded-lg border border-zinc-300 bg-white px-4 py-4 text-sm">
        <p className="text-zinc-700">Nombre: {profile.name}</p>
        <p className="text-zinc-700">Rol: Alumno</p>
        <p className="text-zinc-700">Categoria: {profile.category?.trim() || "Sin dato"}</p>
        <p className="text-zinc-700">Rama: {profile.branch?.trim() || "Sin dato"}</p>
        <p className="text-zinc-700">
          ¿Tiene paleta/raqueta?: {profile.has_equipment ? "Si" : "No"}
        </p>
      </div>

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
          has_equipment: profile.has_equipment,
        }}
      />
    </main>
  );
}
