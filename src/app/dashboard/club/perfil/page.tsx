import { requireClub } from "@/lib/auth/require-club";
import { ClubPerfilForm } from "./perfil-form";

export default async function ClubPerfilPage() {
  const club = await requireClub();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Perfil del club
        </h1>
      </header>

      <section className="mt-6">
        <ClubPerfilForm club={club} />
      </section>
    </main>
  );
}
