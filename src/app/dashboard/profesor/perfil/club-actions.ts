"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { placeholderClubSchema, clubCostSchema, clubIdSchema } from "@/lib/validation/club.schema";

export type ClubActionState = {
  error: string | null;
  success: string | null;
};

async function requireProfesor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "profesor") return null;

  return { supabase, userId: user.id };
}

export async function createPlaceholderClubAction(
  _prev: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const ctx = await requireProfesor();
  if (!ctx) return { error: "Solo los profesores pueden crear clubes.", success: null };

  const parsed = placeholderClubSchema.safeParse({
    nombre: formData.get("nombre"),
    direccion: formData.get("direccion"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "RevisÃ¡ los datos.", success: null };
  }

  // Crear el club placeholder.
  const { data: club, error: clubError } = await ctx.supabase
    .from("clubs")
    .insert({
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion ?? null,
      deporte: "ambos",
      is_placeholder: true,
      created_by_profesor_id: ctx.userId,
    })
    .select("id")
    .single();

  if (clubError || !club) {
    return { error: `No se pudo crear el club: ${clubError?.message ?? "error desconocido"}`, success: null };
  }

  // Crear la relaciÃ³n club-profesor con valores de costo por defecto.
  const { error: cpError } = await ctx.supabase.from("club_profesores").insert({
    club_id: club.id,
    profesor_id: ctx.userId,
    court_cost_mode: "fixed_per_hour",
    status: "activo",
  });

  if (cpError) {
    // Revertir el club si falla la relaciÃ³n.
    await ctx.supabase.from("clubs").delete().eq("id", club.id);
    return { error: `No se pudo crear la relaciÃ³n con el club: ${cpError.message}`, success: null };
  }

  revalidatePath("/dashboard/profesor/ajustes");
  revalidatePath("/dashboard/profesor/clases/disponibilidad");
  return { error: null, success: "Club creado correctamente." };
}

export async function updatePlaceholderClubAction(
  _prev: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const ctx = await requireProfesor();
  if (!ctx) return { error: "Solo los profesores pueden editar clubes.", success: null };

  const parsedId = clubIdSchema.safeParse({ club_id: formData.get("club_id") });
  if (!parsedId.success) return { error: "Club invÃ¡lido.", success: null };

  const parsed = placeholderClubSchema.safeParse({
    nombre: formData.get("nombre"),
    direccion: formData.get("direccion"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "RevisÃ¡ los datos.", success: null };
  }

  const { error } = await ctx.supabase
    .from("clubs")
    .update({
      nombre: parsed.data.nombre,
      direccion: parsed.data.direccion ?? null,
    })
    .eq("id", parsedId.data.club_id)
    .eq("created_by_profesor_id", ctx.userId)
    .eq("is_placeholder", true);

  if (error) return { error: "No se pudo actualizar el club.", success: null };

  revalidatePath("/dashboard/profesor/ajustes");
  revalidatePath("/dashboard/profesor/clases/disponibilidad");
  return { error: null, success: "Club actualizado." };
}

export async function updateClubCostAction(
  _prev: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const ctx = await requireProfesor();
  if (!ctx) return { error: "Solo los profesores pueden editar costos.", success: null };

  const parsed = clubCostSchema.safeParse({
    club_id: formData.get("club_id"),
    court_cost_mode: formData.get("court_cost_mode"),
    court_cost_per_hour: formData.get("court_cost_per_hour"),
    court_percentage_per_student: formData.get("court_percentage_per_student"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "RevisÃ¡ los datos.", success: null };
  }

  const { error } = await ctx.supabase
    .from("club_profesores")
    .update({
      court_cost_mode: parsed.data.court_cost_mode,
      court_cost_per_hour:
        parsed.data.court_cost_mode === "fixed_per_hour"
          ? (parsed.data.court_cost_per_hour ?? null)
          : null,
      court_percentage_per_student:
        parsed.data.court_cost_mode === "per_student_percentage"
          ? (parsed.data.court_percentage_per_student ?? null)
          : null,
    })
    .eq("club_id", parsed.data.club_id)
    .eq("profesor_id", ctx.userId);

  if (error) return { error: `No se pudo actualizar el costo: ${error.message}`, success: null };

  revalidatePath("/dashboard/profesor/ajustes");
  return { error: null, success: "Costo actualizado." };
}

export async function abandonarClubAction(
  _prev: ClubActionState,
  formData: FormData,
): Promise<ClubActionState> {
  const ctx = await requireProfesor();
  if (!ctx) return { error: "Solo los profesores pueden realizar esta acciÃ³n.", success: null };

  const parsed = clubIdSchema.safeParse({ club_id: formData.get("club_id") });
  if (!parsed.success) return { error: "Club invÃ¡lido.", success: null };

  const { error } = await ctx.supabase
    .from("club_profesores")
    .delete()
    .eq("club_id", parsed.data.club_id)
    .eq("profesor_id", ctx.userId);

  if (error) return { error: "No se pudo abandonar el club.", success: null };

  revalidatePath("/dashboard/profesor/ajustes");
  revalidatePath("/dashboard/profesor/clases/disponibilidad");
  return { error: null, success: "Abandonaste el club." };
}

export async function deleteClubAction(formData: FormData) {
  const ctx = await requireProfesor();
  if (!ctx) return;

  const parsed = clubIdSchema.safeParse({ club_id: formData.get("club_id") });
  if (!parsed.success) return;

  await ctx.supabase
    .from("clubs")
    .delete()
    .eq("id", parsed.data.club_id)
    .eq("created_by_profesor_id", ctx.userId)
    .eq("is_placeholder", true);

  revalidatePath("/dashboard/profesor/ajustes");
  revalidatePath("/dashboard/profesor/clases/disponibilidad");
}

