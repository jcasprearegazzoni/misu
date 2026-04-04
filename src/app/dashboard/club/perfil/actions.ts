"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireClub } from "@/lib/auth/require-club";
import { clubPerfilSchema } from "@/lib/validation/club-perfil.schema";
import { generateUniqueUsername } from "@/lib/utils/generate-username";

export type ClubPerfilActionState = {
  error: string | null;
  success: string | null;
};

export async function updateClubPerfilAction(
  _prev: ClubPerfilActionState,
  formData: FormData,
): Promise<ClubPerfilActionState> {
  const club = await requireClub();

  const parsed = clubPerfilSchema.safeParse({
    nombre: formData.get("nombre"),
    username: formData.get("username"),
    direccion: formData.get("direccion"),
    telefono: formData.get("telefono"),
    email_contacto: formData.get("email_contacto"),
    website: formData.get("website"),
    tiene_bar: formData.get("tiene_bar") === "on",
    tiene_estacionamiento: formData.get("tiene_estacionamiento") === "on",
    alquila_paletas: formData.get("alquila_paletas") === "on",
    alquila_raquetas: formData.get("alquila_raquetas") === "on",
    tiene_vestuario: formData.get("tiene_vestuario") === "on",
    tiene_parrilla: formData.get("tiene_parrilla") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisá los datos.", success: null };
  }

  const supabase = await createSupabaseServerClient();

  // Auto-generar username si no se proporcionó
  let username = parsed.data.username ?? null;
  if (!username) {
    username = await generateUniqueUsername(parsed.data.nombre, async (candidate) => {
      const { data } = await supabase
        .from("clubs")
        .select("user_id")
        .eq("username", candidate)
        .neq("user_id", club.user_id)
        .maybeSingle();
      return !!data;
    });
  }

  const { error } = await supabase
    .from("clubs")
    .update({
      nombre: parsed.data.nombre,
      username,
      direccion: parsed.data.direccion ?? null,
      telefono: parsed.data.telefono ?? null,
      email_contacto: parsed.data.email_contacto ?? null,
      website: parsed.data.website ?? null,
      tiene_bar: parsed.data.tiene_bar,
      tiene_estacionamiento: parsed.data.tiene_estacionamiento,
      alquila_paletas: parsed.data.alquila_paletas,
      alquila_raquetas: parsed.data.alquila_raquetas,
      tiene_vestuario: parsed.data.tiene_vestuario,
      tiene_parrilla: parsed.data.tiene_parrilla,
    })
    .eq("user_id", club.user_id);

  if (error) {
    return { error: "No se pudo actualizar el perfil del club.", success: null };
  }

  revalidatePath("/dashboard/club/perfil");
  return { error: null, success: "Perfil actualizado correctamente." };
}
