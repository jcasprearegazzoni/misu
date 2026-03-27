import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

const turnosSections = [
  {
    href: "/dashboard/profesor/calendario",
    title: "Calendario",
    description: "Pantalla operativa unica para confirmar, cancelar y cobrar clases.",
  },
  {
    href: "/dashboard/profesor/clases/disponibilidad",
    title: "Disponibilidad",
    description: "Configura horarios semanales y bloqueos de fechas.",
  },
  {
    href: "/dashboard/profesor/paquetes",
    title: "Paquetes",
    description: "Administra paquetes, asignaciones y creditos.",
  },
];

export default async function ProfesorTurnosPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Clases</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Acceso rapido a las secciones operativas de clases.
      </p>

      <div className="mt-6 grid gap-3">
        {turnosSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-3 hover:bg-zinc-50"
          >
            <p className="text-base font-semibold text-zinc-900">{section.title}</p>
            <p className="mt-1 text-sm text-zinc-700">{section.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
