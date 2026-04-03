import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CurrentClub = {
  id: number;
  user_id: string;
  nombre: string;
  username: string | null;
  direccion: string | null;
  telefono: string | null;
  email_contacto: string | null;
  website: string | null;
  cuit: string | null;
  tiene_bar: boolean;
  tiene_estacionamiento: boolean;
  alquila_paletas: boolean;
  alquila_raquetas: boolean;
  tiene_vestuario: boolean;
  tiene_parrilla: boolean;
};

export async function getCurrentClub(): Promise<CurrentClub | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("clubs")
    .select(
      "id, user_id, nombre, username, direccion, telefono, email_contacto, website, cuit, tiene_bar, tiene_estacionamiento, alquila_paletas, alquila_raquetas, tiene_vestuario, tiene_parrilla",
    )
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CurrentClub;
}
