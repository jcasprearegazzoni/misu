import Link from "next/link";
import { requireClub } from "@/lib/auth/require-club";

type AjusteCard = {
  title: string;
  description: string;
  href: string;
};

const CARDS: AjusteCard[] = [
  {
    title: "Perfil del club",
    description: "Datos públicos, contacto y servicios",
    href: "/dashboard/club/perfil",
  },
  {
    title: "Canchas",
    description: "Agregar y administrar canchas",
    href: "/dashboard/club/canchas",
  },
  {
    title: "Profesores",
    description: "Invitar y gestionar profesores",
    href: "/dashboard/club/profesores",
  },
  {
    title: "Horarios y precios",
    description: "Configurar disponibilidad y franjas",
    href: "/dashboard/club/configuracion",
  },
];

export default async function ClubAjustesPage() {
  await requireClub();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-6 sm:px-4 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Ajustes
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
          Administrá las canchas, profesores y configuración del club.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border p-4 transition-opacity hover:opacity-75"
            style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {card.title}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
