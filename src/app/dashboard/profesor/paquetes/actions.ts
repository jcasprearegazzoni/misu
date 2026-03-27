"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assignStudentPackageSchema,
  createPackageSchema,
  markStudentPackagePaidSchema,
} from "@/lib/validation/packages.schema";
import { z } from "zod";

export type PackageActionState = {
  error: string | null;
  success: string | null;
};

async function requireProfesor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "profesor") {
    return null;
  }

  return { supabase, userId: user.id };
}

export async function createPackageAction(
  _prevState: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const context = await requireProfesor();

  if (!context) {
    return { error: "Solo los profesores pueden crear paquetes.", success: null };
  }

  const parsed = createPackageSchema.safeParse({
    name: formData.get("name"),
    total_classes: formData.get("total_classes"),
    price: formData.get("price"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para crear el paquete.",
      success: null,
    };
  }

  const { error } = await context.supabase.from("packages").insert({
    profesor_id: context.userId,
    name: parsed.data.name,
    total_classes: parsed.data.total_classes,
    price: parsed.data.price,
    description: parsed.data.description ?? null,
    active: true,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/dashboard/profesor/paquetes");
  return { error: null, success: "Paquete creado correctamente." };
}

export async function assignPackageToStudentAction(
  _prevState: PackageActionState,
  formData: FormData,
): Promise<PackageActionState> {
  const context = await requireProfesor();

  if (!context) {
    return { error: "Solo los profesores pueden asignar paquetes.", success: null };
  }

  const parsed = assignStudentPackageSchema.safeParse({
    alumno_id: formData.get("alumno_id"),
    package_id: formData.get("package_id"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Datos invalidos para asignar el paquete.",
      success: null,
    };
  }

  const { data: selectedPackage } = await context.supabase
    .from("packages")
    .select("id, total_classes")
    .eq("id", parsed.data.package_id)
    .eq("profesor_id", context.userId)
    .eq("active", true)
    .single();

  if (!selectedPackage) {
    return {
      error: "El paquete seleccionado no pertenece al profesor o esta inactivo.",
      success: null,
    };
  }

  const { error } = await context.supabase.from("student_packages").insert({
    alumno_id: parsed.data.alumno_id,
    package_id: selectedPackage.id,
    profesor_id: context.userId,
    classes_remaining: selectedPackage.total_classes,
    paid: false,
  });

  if (error) {
    return { error: error.message, success: null };
  }

  revalidatePath("/dashboard/profesor/paquetes");
  return { error: null, success: "Paquete asignado al alumno." };
}

export async function markStudentPackagePaidAction(formData: FormData) {
  const context = await requireProfesor();

  if (!context) {
    return;
  }

  const parsed = markStudentPackagePaidSchema.safeParse({
    student_package_id: formData.get("student_package_id"),
  });

  if (!parsed.success) {
    return;
  }

  await context.supabase
    .from("student_packages")
    .update({ paid: true })
    .eq("id", parsed.data.student_package_id)
    .eq("profesor_id", context.userId);

  revalidatePath("/dashboard/profesor/paquetes");
}

const deactivatePackageSchema = z.object({
  package_id: z.coerce.number().int().positive("Paquete invalido."),
});

export async function deactivatePackageAction(formData: FormData) {
  const context = await requireProfesor();

  if (!context) {
    return;
  }

  const parsed = deactivatePackageSchema.safeParse({
    package_id: formData.get("package_id"),
  });

  if (!parsed.success) {
    return;
  }

  await context.supabase
    .from("packages")
    .update({ active: false })
    .eq("id", parsed.data.package_id)
    .eq("profesor_id", context.userId)
    .eq("active", true);

  revalidatePath("/dashboard/profesor/paquetes");
}
