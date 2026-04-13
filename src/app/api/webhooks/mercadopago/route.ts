import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type GatewayStatus = "pending" | "approved" | "rejected" | "refunded" | "cancelled";
type PaymentInsertType = "clase" | "paquete" | "programa" | "seña";

type MercadoPagoWebhookPayload = {
  type?: string;
  data?: {
    id?: string | number;
  };
};

type MercadoPagoPaymentResponse = {
  id?: string | number;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  metadata?: Record<string, unknown> | null;
  external_reference?: string | null;
};

type PaymentTransactionRow = {
  id: number;
  gateway_status: GatewayStatus;
  amount: number;
  currency: string;
  profesor_id: string | null;
  club_id: number | null;
  student_package_id: number | null;
  student_program_id: number | null;
  reserva_cancha_id: number | null;
  payer_user_id: string | null;
  gateway_payment_id: string | null;
};

type StudentPackageRow = {
  id: number;
  profesor_id: string | null;
  alumno_id: string | null;
};

function parseSignatureHeader(signatureHeader: string | null): string | null {
  if (!signatureHeader) {
    return null;
  }

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const v1Part = parts.find((part) => part.startsWith("v1="));

  if (v1Part) {
    const [, value] = v1Part.split("=");
    return value?.trim().toLowerCase() || null;
  }

  if (signatureHeader.startsWith("sha256=")) {
    return signatureHeader.slice("sha256=".length).trim().toLowerCase() || null;
  }

  return signatureHeader.trim().toLowerCase() || null;
}

function isValidSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  const receivedSignature = parseSignatureHeader(signatureHeader);

  if (!receivedSignature) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex").toLowerCase();

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function toGatewayStatus(status: string | undefined): GatewayStatus {
  if (status === "approved") {
    return "approved";
  }

  if (status === "rejected") {
    return "rejected";
  }

  if (status === "refunded" || status === "charged_back") {
    return "refunded";
  }

  if (status === "cancelled" || status === "cancelled_by_user") {
    return "cancelled";
  }

  return "pending";
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

async function fetchMercadoPagoPayment(
  paymentId: string,
  accessToken: string,
): Promise<MercadoPagoPaymentResponse | null> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as MercadoPagoPaymentResponse;
}

async function resolveEntityAccessToken(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  profesorId: string | null;
  clubId: number | null;
}): Promise<string | null> {
  const { supabase, profesorId, clubId } = params;

  // Prioriza token a nivel profesor cuando la transacción está asociada a profesor.
  if (profesorId !== null) {
    const { data } = await supabase
      .from("profiles")
      .select("payment_gateway_access_token")
      .eq("user_id", profesorId)
      .maybeSingle();

    const token = data?.payment_gateway_access_token;
    if (typeof token === "string" && token.trim().length > 0) {
      return token;
    }
  }

  // Si no hay profesor o no tiene token, busca token a nivel club.
  if (clubId !== null) {
    const { data } = await supabase
      .from("club_configuracion")
      .select("payment_gateway_access_token")
      .eq("club_id", clubId)
      .maybeSingle();

    const token = data?.payment_gateway_access_token;
    if (typeof token === "string" && token.trim().length > 0) {
      return token;
    }
  }

  return null;
}

async function findTransactionByMetadata(params: {
  metadata: Record<string, unknown> | null | undefined;
  externalReference: string | null | undefined;
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}): Promise<PaymentTransactionRow | null> {
  const { metadata, externalReference, supabase } = params;

  const transactionId = toPositiveInteger(metadata?.payment_transaction_id);
  if (transactionId) {
    const { data } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("id", transactionId)
      .maybeSingle();

    if (data) {
      return data as PaymentTransactionRow;
    }
  }

  const externalAsId = toPositiveInteger(externalReference);
  if (externalAsId) {
    const { data } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("id", externalAsId)
      .maybeSingle();

    if (data) {
      return data as PaymentTransactionRow;
    }
  }

  const studentPackageId = toPositiveInteger(metadata?.student_package_id);
  if (studentPackageId) {
    const { data } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("student_package_id", studentPackageId)
      .eq("gateway_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data as PaymentTransactionRow;
    }
  }

  const studentProgramId = toPositiveInteger(metadata?.student_program_id);
  if (studentProgramId) {
    const { data } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("student_program_id", studentProgramId)
      .eq("gateway_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data as PaymentTransactionRow;
    }
  }

  const reservaCanchaId = toPositiveInteger(metadata?.reserva_cancha_id);
  if (reservaCanchaId) {
    const { data } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("reserva_cancha_id", reservaCanchaId)
      .eq("gateway_status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      return data as PaymentTransactionRow;
    }
  }

  return null;
}

async function tryInsertPayment(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  tx: PaymentTransactionRow;
  studentPackage: StudentPackageRow | null;
  paymentId: string;
  payment_transaction_id: number;
}): Promise<void> {
  const { supabase, tx, studentPackage, paymentId, payment_transaction_id } = params;

  const isPackagePayment = tx.student_package_id !== null;
  const isProgramPayment = tx.student_program_id !== null;
  const isReservaCanchaPayment = tx.reserva_cancha_id !== null;

  // Define el contexto del pago segun su origen (paquete o reserva de cancha).
  const profesorId = isPackagePayment ? tx.profesor_id ?? studentPackage?.profesor_id ?? null : null;
  const clubId = tx.club_id ?? null;
  const alumnoId = tx.payer_user_id ?? studentPackage?.alumno_id ?? null;
  const resolvedAlumnoId = isReservaCanchaPayment && !alumnoId ? null : alumnoId;
  const type: PaymentInsertType = isPackagePayment ? "paquete" : isProgramPayment ? "programa" : isReservaCanchaPayment ? "seña" : "clase";

  // Si no hay profesor, club ni alumno, no hay contexto suficiente para registrar el pago.
  if (!profesorId && !clubId && !resolvedAlumnoId) {
    console.warn(
      `[mercadopago-webhook] No se pudo insertar payments por falta de contexto. tx=${tx.id} mp_payment=${paymentId}`,
    );
    return;
  }

  const { error } = await supabase.from("payments").insert({
    profesor_id: profesorId,
    alumno_id: resolvedAlumnoId,
    club_id: clubId,
    student_package_id: tx.student_package_id ?? null,
    student_program_id: tx.student_program_id ?? null,
    reserva_cancha_id: tx.reserva_cancha_id ?? null,
    payment_transaction_id,
    booking_id: null,
    amount: tx.amount,
    method: "pasarela_online",
    type,
    note: `Pago online MercadoPago. transaction_id=${tx.id} gateway_payment_id=${paymentId}`,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn(
      `[mercadopago-webhook] No se pudo insertar payments para tx=${tx.id}. Detalle: ${error.message}`,
    );
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { ok: false, error: "Falta MERCADOPAGO_WEBHOOK_SECRET en variables de entorno." },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("x-signature");

  // Valida firma HMAC-SHA256 antes de parsear el cuerpo.
  if (!isValidSignature(rawBody, signatureHeader, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Firma invalida." }, { status: 401 });
  }

  let bodyJson: MercadoPagoWebhookPayload;
  try {
    bodyJson = JSON.parse(rawBody) as MercadoPagoWebhookPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const eventType = bodyJson.type;
  const eventDataId = bodyJson.data?.id;

  if (eventType !== "payment") {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(eventDataId ?? "").trim();
  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const fallbackEnvToken = process.env.MERCADOPAGO_ACCESS_TOKEN ?? null;

    const { data: transactionByGatewayId } = await supabase
      .from("payment_transactions")
      .select(
        "id, gateway_status, amount, currency, profesor_id, club_id, student_package_id, student_program_id, reserva_cancha_id, payer_user_id, gateway_payment_id",
      )
      .eq("gateway_payment_id", paymentId)
      .maybeSingle();

    let transaction = (transactionByGatewayId as PaymentTransactionRow | null) ?? null;
    let paymentDetailForLookup: MercadoPagoPaymentResponse | null = null;

    // Si no se encontró por gateway_payment_id, intenta resolver por metadata usando token global.
    if (!transaction) {
      if (!fallbackEnvToken) {
        console.warn(
          `[mercadopago-webhook] No se pudo resolver transacción para mp_payment=${paymentId} y no hay token global de fallback.`,
        );
        return NextResponse.json({ ok: true });
      }

      paymentDetailForLookup = await fetchMercadoPagoPayment(paymentId, fallbackEnvToken);
      if (!paymentDetailForLookup) {
        console.warn(`[mercadopago-webhook] No se pudo consultar el pago ${paymentId} en MercadoPago.`);
        return NextResponse.json({ ok: true });
      }

      transaction = await findTransactionByMetadata({
        metadata: paymentDetailForLookup.metadata,
        externalReference: paymentDetailForLookup.external_reference,
        supabase,
      });
    }

    if (!transaction) {
      console.warn(
        `[mercadopago-webhook] No se encontro payment_transaction para mp_payment=${paymentId}. Se ignora el evento.`,
      );
      return NextResponse.json({ ok: true });
    }

    // Resuelve token por entidad (profesor/club) y usa token global sólo como fallback.
    const entityAccessToken = await resolveEntityAccessToken({
      supabase,
      profesorId: transaction.profesor_id,
      clubId: transaction.club_id,
    });
    const resolvedAccessToken = entityAccessToken ?? fallbackEnvToken;

    if (!resolvedAccessToken) {
      console.warn(
        `[mercadopago-webhook] No hay access token disponible para procesar mp_payment=${paymentId}.`,
      );
      return NextResponse.json({ ok: true });
    }

    const paymentDetail = await fetchMercadoPagoPayment(paymentId, resolvedAccessToken);
    if (!paymentDetail) {
      console.warn(`[mercadopago-webhook] No se pudo consultar el pago ${paymentId} en MercadoPago.`);
      return NextResponse.json({ ok: true });
    }

    const newStatus = toGatewayStatus(paymentDetail.status);
    const previousStatus = transaction.gateway_status;

    const updatePayload: {
      gateway_status: GatewayStatus;
      raw_webhook: MercadoPagoWebhookPayload;
      webhook_received_at: string;
      gateway_payment_id?: string;
    } = {
      gateway_status: newStatus,
      raw_webhook: bodyJson,
      webhook_received_at: new Date().toISOString(),
    };

    // Si la transacción se encontró por metadata, guarda el id de pago de la pasarela.
    if (!transaction.gateway_payment_id) {
      updatePayload.gateway_payment_id = paymentId;
    }

    const { error: updateTxError } = await supabase
      .from("payment_transactions")
      .update(updatePayload)
      .eq("id", transaction.id);

    if (updateTxError) {
      console.warn(
        `[mercadopago-webhook] No se pudo actualizar payment_transactions id=${transaction.id}. Detalle: ${updateTxError.message}`,
      );
      return NextResponse.json({ ok: true });
    }

    // Idempotencia: sólo aplica efectos de negocio cuando cambia a approved por primera vez.
    if (newStatus === "approved" && previousStatus !== "approved") {
      let studentPackage: StudentPackageRow | null = null;

      if (transaction.student_package_id) {
        const { data: updatedPackage, error: updatePackageError } = await supabase
          .from("student_packages")
          .update({ paid: true })
          .eq("id", transaction.student_package_id)
          .select("id, profesor_id, alumno_id")
          .maybeSingle();

        if (updatePackageError) {
          console.warn(
            `[mercadopago-webhook] Error al actualizar student_packages id=${transaction.student_package_id}. Detalle: ${updatePackageError.message}`,
          );
        }

        studentPackage = (updatedPackage as StudentPackageRow | null) ?? null;
      }

      // Si el pago corresponde a un programa, marcar como pagado y generar bookings.
      if (transaction.student_program_id) {
        const { data: updatedProgram, error: updateProgramError } = await supabase
          .from("student_programs")
          .update({ paid: true })
          .eq("id", transaction.student_program_id)
          .select("id, profesor_id, alumno_id")
          .maybeSingle();

        if (updateProgramError) {
          console.warn(
            `[mercadopago-webhook] Error al actualizar student_programs id=${transaction.student_program_id}. Detalle: ${updateProgramError.message}`,
          );
        }

        // Generar los bookings del programa (usa admin client para saltear auth.uid check).
        if (updatedProgram?.profesor_id) {
          const { error: rpcError } = await supabase.rpc("generate_program_bookings", {
            p_student_program_id: transaction.student_program_id,
            p_profesor_id: updatedProgram.profesor_id,
          });
          if (rpcError) {
            console.warn(
              `[mercadopago-webhook] No se pudieron generar bookings para student_program=${transaction.student_program_id}. Detalle: ${rpcError.message}`,
            );
          }
        }
      }

      if (transaction.reserva_cancha_id) {
        const { error: updateReservaError } = await supabase
          .from("reservas_cancha")
          .update({ estado: "confirmada" })
          .eq("id", transaction.reserva_cancha_id);

        if (updateReservaError) {
          console.warn(
            `[mercadopago-webhook] Error al actualizar reservas_cancha id=${transaction.reserva_cancha_id}. Detalle: ${updateReservaError.message}`,
          );
        }
      }

      await tryInsertPayment({
        supabase,
        tx: transaction,
        studentPackage,
        paymentId,
        payment_transaction_id: transaction.id,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.warn(`[mercadopago-webhook] Error interno al procesar webhook. Detalle: ${message}`);
  }

  return NextResponse.json({ ok: true });
}

