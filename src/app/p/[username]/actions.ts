"use server";

import { redirect } from "next/navigation";
import { createNotification } from "@/lib/notifications/create-notification";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const enrollProgramSchema = z.object({
  program_id: z.coerce.number().int().positive("Programa inválido."),
  profesor_id: z.string().uuid("Profesor inválido."),
});

export type EnrollProgramActionState = {
  error: string | null;
  success: string | null;
};

export async function enrollProgramAction(
  _prevState: EnrollProgramActionState,
  formData: FormData,
): Promise<EnrollProgramActionState> {
  const parsed = enrollProgramSchema.safeParse({
    program_id: formData.get("program_id"),
    profesor_id: formData.get("profesor_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos.", success: null };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "alumno") {
    return { error: "Solo los alumnos pueden solicitar programas.", success: null };
  }

  const { data: programa } = await supabase
    .from("programs")
    .select("id, nombre, total_clases")
    .eq("id", parsed.data.program_id)
    .eq("profesor_id", parsed.data.profesor_id)
    .eq("visibilidad", "publico")
    .eq("estado", "activo")
    .eq("active", true)
    .single();

  if (!programa) {
    return { error: "El programa ya no está disponible.", success: null };
  }

  const { error } = await supabase.from("student_programs").insert({
    alumno_id: user.id,
    program_id: parsed.data.program_id,
    profesor_id: parsed.data.profesor_id,
    classes_remaining: 0,
    paid: false,
    origen: "online",
  });

  if (error) {
    return { error: "No se pudo procesar la solicitud. Intenta nuevamente.", success: null };
  }

  await createNotification({
    userId: parsed.data.profesor_id,
    type: "package_assigned",
    title: "Solicitud de inscripción al programa",
    message: `${profile.name || "Un alumno"} solicitó inscripción al programa "${programa.nombre}".`,
  });

  return {
    error: null,
    success: "Solicitud enviada. Coordina el pago con tu profesor para activar las clases.",
  };
}

export async function pagarProgramaOnlineAction(
  _prevState: EnrollProgramActionState,
  formData: FormData,
): Promise<EnrollProgramActionState> {
  const parsed = enrollProgramSchema.safeParse({
    program_id: formData.get("program_id"),
    profesor_id: formData.get("profesor_id"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos.", success: null };
  }

  const profesorUsernameRaw = formData.get("profesor_username");
  const profesorUsername = typeof profesorUsernameRaw === "string" ? profesorUsernameRaw.trim() : "";
  if (!profesorUsername) {
    return { error: "No se pudo identificar al profesor.", success: null };
  }

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

  if (!profile || profile.role !== "alumno") {
    return { error: "Solo los alumnos pueden comprar programas online.", success: null };
  }

  const { data: programa } = await supabase
    .from("programs")
    .select("id, nombre, total_clases, precio")
    .eq("id", parsed.data.program_id)
    .eq("profesor_id", parsed.data.profesor_id)
    .eq("visibilidad", "publico")
    .eq("estado", "activo")
    .eq("active", true)
    .single();

  if (!programa) {
    return { error: "El programa ya no está disponible.", success: null };
  }

  const { data: gatewayProfile } = await supabase
    .from("profiles")
    .select("payment_gateway_access_token")
    .eq("user_id", parsed.data.profesor_id)
    .maybeSingle();

  const paymentGatewayAccessToken = gatewayProfile?.payment_gateway_access_token?.trim() ?? "";
  if (!paymentGatewayAccessToken) {
    return { error: "El profesor no tiene pagos online configurados.", success: null };
  }

  const { data: createdStudentProgram, error: studentProgramError } = await supabase
    .from("student_programs")
    .insert({
      alumno_id: user.id,
      program_id: parsed.data.program_id,
      profesor_id: parsed.data.profesor_id,
      classes_remaining: 0,
      paid: false,
      origen: "online",
    })
    .select("id")
    .single();

  if (studentProgramError || !createdStudentProgram) {
    return { error: "No se pudo procesar la solicitud. Intenta nuevamente.", success: null };
  }

  const { data: transactionId, error: transactionError } = await supabase.rpc(
    "create_payment_transaction",
    {
      p_gateway: "mercadopago",
      p_amount: programa.precio,
      p_student_program_id: createdStudentProgram.id,
      p_profesor_id: parsed.data.profesor_id,
      p_payer_email: null,
    },
  );

  if (transactionError || !transactionId) {
    return { error: "No se pudo iniciar el pago. Intenta de nuevo.", success: null };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl) {
    return { error: "Falta NEXT_PUBLIC_APP_URL para iniciar el pago online.", success: null };
  }

  const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paymentGatewayAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: programa.nombre,
          unit_price: Number(programa.precio),
          quantity: 1,
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${appUrl}/p/${profesorUsername}?pago=ok`,
        failure: `${appUrl}/p/${profesorUsername}?pago=error`,
        pending: `${appUrl}/p/${profesorUsername}?pago=pendiente`,
      },
      auto_return: "approved",
      external_reference: String(transactionId),
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      metadata: { payment_transaction_id: transactionId, student_program_id: createdStudentProgram.id },
    }),
  });

  if (!mpResponse.ok) {
    return { error: "No se pudo iniciar el pago. Intenta de nuevo.", success: null };
  }

  const mpData = (await mpResponse.json()) as { init_point?: unknown };
  const initPoint = typeof mpData.init_point === "string" ? mpData.init_point : "";

  if (!initPoint) {
    return { error: "No se pudo iniciar el pago. Intenta de nuevo.", success: null };
  }

  return {
    error: null,
    success: initPoint,
  };
}
