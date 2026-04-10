"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireClub } from "@/lib/auth/require-club";
import { getMunicipiosByProvincia } from "@/lib/geo/argentina";
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
    direccion: formData.get("direccion"),
    provincia: formData.get("provincia"),
    municipio: formData.get("municipio"),
    telefono: formData.get("telefono"),
    email_contacto: formData.get("email_contacto"),
    website: formData.get("website"),
    tiene_bar: formData.get("tiene_bar") === "on",
    tiene_estacionamiento: formData.get("tiene_estacionamiento") === "on",
    alquila_paletas: formData.get("alquila_paletas") === "on",
    alquila_raquetas: formData.get("alquila_raquetas") === "on",
    tiene_vestuario: formData.get("tiene_vestuario") === "on",
    tiene_parrilla: formData.get("tiene_parrilla") === "on",
    tiene_tenis: formData.get("tiene_tenis") === "on",
    tiene_padel: formData.get("tiene_padel") === "on",
    tiene_futbol: formData.get("tiene_futbol") === "on",
    confirmacion_automatica: formData.get("confirmacion_automatica") === "on",
    cancelacion_horas_limite: formData.get("cancelacion_horas_limite"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos.", success: null };
  }

  if (parsed.data.provincia && !parsed.data.municipio) {
    return { error: "Selecciona un municipio o barrio.", success: null };
  }

  if (parsed.data.provincia && parsed.data.municipio) {
    const municipiosValidos = getMunicipiosByProvincia(parsed.data.provincia);
    if (!municipiosValidos.includes(parsed.data.municipio)) {
      return { error: "La combinacion de provincia y municipio no es valida.", success: null };
    }
  }

  const supabase = await createSupabaseServerClient();

  const username = await generateUniqueUsername(parsed.data.nombre, async (candidate) => {
    const { data } = await supabase
      .from("clubs")
      .select("user_id")
      .eq("username", candidate)
      .neq("user_id", club.user_id)
      .maybeSingle();
    return !!data;
  });

  const { error } = await supabase
    .from("clubs")
    .update({
      nombre: parsed.data.nombre,
      username,
      direccion: parsed.data.direccion ?? null,
      provincia: parsed.data.provincia ?? null,
      municipio: parsed.data.municipio ?? null,
      telefono: parsed.data.telefono ?? null,
      email_contacto: parsed.data.email_contacto ?? null,
      website: parsed.data.website ?? null,
      tiene_bar: parsed.data.tiene_bar,
      tiene_estacionamiento: parsed.data.tiene_estacionamiento,
      alquila_paletas: parsed.data.alquila_paletas,
      alquila_raquetas: parsed.data.alquila_raquetas,
      tiene_vestuario: parsed.data.tiene_vestuario,
      tiene_parrilla: parsed.data.tiene_parrilla,
      tiene_tenis: parsed.data.tiene_tenis,
      tiene_padel: parsed.data.tiene_padel,
      tiene_futbol: parsed.data.tiene_futbol,
    })
    .eq("user_id", club.user_id);

  if (error) {
    return { error: "No se pudo actualizar el perfil del club.", success: null };
  }

  const supabaseConfig = await createSupabaseServerClient();
  const { error: configError } = await supabaseConfig.from("club_configuracion").upsert(
    {
      club_id: club.id,
      confirmacion_automatica: parsed.data.confirmacion_automatica,
      cancelacion_horas_limite: parsed.data.cancelacion_horas_limite,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id" },
  );
  if (configError) {
    return { error: "No se pudo actualizar la configuracion general.", success: null };
  }

  revalidatePath("/dashboard/club/perfil");
  revalidatePath("/dashboard/club/ajustes");

  const nextRaw = formData.get("next");
  const nextPath =
    typeof nextRaw === "string" && nextRaw.startsWith("/dashboard/club")
      ? nextRaw
      : "/dashboard/club/ajustes?section=perfil";
  const separator = nextPath.includes("?") ? "&" : "?";

  redirect(`${nextPath}${separator}updated=1`);
}
