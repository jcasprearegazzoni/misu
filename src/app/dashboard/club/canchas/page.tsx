import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CanchasManager } from "./canchas-manager";

type CanchaRow = {
  id: number;
  club_id: number;
  nombre: string;
  deporte: "tenis" | "padel" | "futbol";
  pared: "blindex" | "muro" | "mixto" | null;
  superficie: "sintetico" | "polvo_ladrillo" | "cemento" | "blindex" | "f5" | "f7" | "f8" | "f11";
  techada: boolean;
  iluminacion: boolean;
  activa: boolean;
};

export default async function ClubCanchasPage() {
  const club = await requireClub();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("canchas")
    .select("id, club_id, nombre, deporte, pared, superficie, techada, iluminacion, activa")
    .eq("club_id", club.id)
    .order("id", { ascending: true });

  const canchas = (data ?? []) as CanchaRow[];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--foreground)" }}>
          Canchas
        </h1>
      </header>

      <section className="mt-6">
        <CanchasManager canchas={canchas} clubId={club.id} />
      </section>
    </main>
  );
}
