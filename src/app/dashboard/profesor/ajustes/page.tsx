import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

type AjusteCard = {
  title: string;
  description: string;
  href: string;
};

export default async function ProfesorAjustesPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "profesor") {
    redirect("/dashboard/alumno/turnos");
  }

  const cards: AjusteCard[] = [
    {
      title: "Perfil",
      description: "Datos personales y perfil público.",
      href: "/dashboard/profesor/perfil#datos",
    },
    {
      title: "Disponibilidad",
      description: "Horarios semanales y bloqueos.",
      href: "/dashboard/profesor/clases/disponibilidad",
    },
    {
      title: "Paquetes",
      description: "Oferta de paquetes y asignaciones.",
      href: "/dashboard/profesor/paquetes",
    },
    {
      title: "Precios",
      description: "Valores por tipo de clase.",
      href: "/dashboard/profesor/perfil#precios",
    },
    {
      title: "Configuración",
      description: "Reglas operativas y decisiones.",
      href: "/dashboard/profesor/perfil#ajustes",
    },
    {
      title: "Clubes",
      description: "Gestión de clubes vinculados.",
      href: "/dashboard/profesor/perfil#clubes",
    },
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Ajustes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Centro de configuración del profesor.
        </p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} className="card block p-4 transition-opacity hover:opacity-90">
            <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              {card.title}
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {card.description}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
