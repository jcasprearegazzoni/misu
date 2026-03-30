import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { PerfilForm } from "./perfil-form";

export default async function PerfilProfesorPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Perfil del Profesor</h1>
      <p className="mt-2 text-sm text-zinc-600">Completa y edita tu perfil basico.</p>

      <PerfilForm
        initialValues={{
          name: profile.name,
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          sport: profile.sport ?? "tenis",
          provincia: profile.provincia ?? "",
          municipio: profile.zone ?? "",
        }}
      />
    </main>
  );
}
