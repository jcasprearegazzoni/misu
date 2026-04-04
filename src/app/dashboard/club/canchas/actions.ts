"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireClub } from "@/lib/auth/require-club";
import { canchaSchema } from "@/lib/validation/cancha.schema";

export type CanchaActionState = {
  error: string | null;
  success: string | null;
  invalidField?: "nombre" | "deporte" | "pared" | "superficie" | null;
};

export async function createCanchaAction(
  _prev: CanchaActionState,
  formData: FormData,
): Promise<CanchaActionState> {
  const club = await requireClub();
  const autoNameEnabled = String(formData.get("nombre_auto")) === "on";

  const parsed = canchaSchema.safeParse({
    // Si el nombre es automatico, validamos con un placeholder.
    nombre: autoNameEnabled ? "Cancha" : formData.get("nombre"),
    deporte: formData.get("deporte"),
    pared: formData.get("pared"),
    superficie: formData.get("superficie"),
    techada: formData.get("techada"),
    iluminacion: formData.get("iluminacion"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? "Revisá los datos.",
      success: null,
      invalidField: (issue?.path?.[0] as CanchaActionState["invalidField"]) ?? null,
    };
  }

  const supabase = await createSupabaseServerClient();
  let nombreFinal = parsed.data.nombre;

  if (autoNameEnabled) {
    const { data: existingNames, error: namesError } = await supabase
      .from("canchas")
      .select("nombre")
      .eq("club_id", club.id)
      .eq("deporte", parsed.data.deporte);

    if (namesError) {
      return { error: "No se pudo preparar el nombre automatico.", success: null };
    }

    const maxNumber = (existingNames ?? []).reduce((max, row) => {
      const match = /^cancha\s+(\d+)$/i.exec(row.nombre?.trim() ?? "");
      if (!match) return max;
      const value = Number(match[1]);
      if (!Number.isFinite(value)) return max;
      return value > max ? value : max;
    }, 0);

    nombreFinal = `Cancha ${maxNumber + 1}`;
  }

  const { data: existing } = await supabase
    .from("canchas")
    .select("id")
    .eq("club_id", club.id)
    .eq("deporte", parsed.data.deporte)
    .ilike("nombre", nombreFinal)
    .maybeSingle();

  if (existing) {
    return {
      error: "Ya existe una cancha con ese nombre para ese deporte.",
      success: null,
      invalidField: "nombre",
    };
  }

  const { error } = await supabase.from("canchas").insert({
    club_id: club.id,
    nombre: nombreFinal,
    deporte: parsed.data.deporte,
    pared: parsed.data.deporte === "padel" ? parsed.data.pared ?? null : null,
    superficie: parsed.data.superficie,
    techada: parsed.data.techada,
    iluminacion: parsed.data.iluminacion,
    activa: true,
  });

  if (error) {
    return { error: "No se pudo crear la cancha.", success: null };
  }

  revalidatePath("/dashboard/club/canchas");
  return { error: null, success: null };
}

export async function updateCanchaAction(
  _prev: CanchaActionState,
  formData: FormData,
): Promise<CanchaActionState> {
  const club = await requireClub();
  const canchaId = Number(formData.get("cancha_id"));

  if (!Number.isInteger(canchaId) || canchaId <= 0) {
    return { error: "Cancha inválida.", success: null };
  }

  const parsed = canchaSchema.safeParse({
    nombre: formData.get("nombre"),
    deporte: formData.get("deporte"),
    pared: formData.get("pared"),
    superficie: formData.get("superficie"),
    techada: formData.get("techada"),
    iluminacion: formData.get("iluminacion"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? "Revisá los datos.",
      success: null,
      invalidField: (issue?.path?.[0] as CanchaActionState["invalidField"]) ?? null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("canchas")
    .select("id")
    .eq("club_id", club.id)
    .eq("deporte", parsed.data.deporte)
    .ilike("nombre", parsed.data.nombre)
    .neq("id", canchaId)
    .maybeSingle();

  if (existing) {
    return {
      error: "Ya existe una cancha con ese nombre para ese deporte.",
      success: null,
      invalidField: "nombre",
    };
  }

  const { error } = await supabase
    .from("canchas")
    .update({
      nombre: parsed.data.nombre,
      deporte: parsed.data.deporte,
      pared: parsed.data.deporte === "padel" ? parsed.data.pared ?? null : null,
      superficie: parsed.data.superficie,
      techada: parsed.data.techada,
      iluminacion: parsed.data.iluminacion,
    })
    .eq("id", canchaId)
    .eq("club_id", club.id);

  if (error) {
    return { error: "No se pudo actualizar la cancha.", success: null };
  }

  revalidatePath("/dashboard/club/canchas");
  return { error: null, success: "Cancha actualizada." };
}

export async function toggleCanchaActivaAction(formData: FormData) {
  const club = await requireClub();
  const canchaId = Number(formData.get("cancha_id"));
  const currentActiva = String(formData.get("activa")) === "true";

  if (!Number.isInteger(canchaId) || canchaId <= 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("canchas")
    .update({ activa: !currentActiva })
    .eq("id", canchaId)
    .eq("club_id", club.id);

  revalidatePath("/dashboard/club/canchas");
}

export async function deleteCanchaAction(formData: FormData) {
  const club = await requireClub();
  const canchaId = Number(formData.get("cancha_id"));

  if (!Number.isInteger(canchaId) || canchaId <= 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  await supabase.from("canchas").delete().eq("id", canchaId).eq("club_id", club.id);
  revalidatePath("/dashboard/club/canchas");
}
