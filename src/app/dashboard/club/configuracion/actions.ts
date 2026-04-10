"use server";

import { revalidatePath } from "next/cache";
import { requireClub } from "@/lib/auth/require-club";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  configuracionSchema,
  disponibilidadSchema,
  franjaPrecioSchema,
} from "@/lib/validation/club-configuracion.schema";

export type ClubConfiguracionActionState = {
  error: string | null;
  success: string | null;
  submitted: Record<string, string>;
};

const initialError = "No se pudo guardar la configuracion.";

function parseDuraciones(formData: FormData) {
  const duraciones: number[] = [];
  if (formData.get("duracion_60") === "on") duraciones.push(60);
  if (formData.get("duracion_90") === "on") duraciones.push(90);
  if (formData.get("duracion_120") === "on") duraciones.push(120);
  return duraciones;
}

function getSubmittedValues(formData: FormData, keys: string[]) {
  const result: Record<string, string> = {};
  keys.forEach((key) => {
    const value = formData.get(key);
    if (typeof value === "string") {
      result[key] = value;
    }
  });
  return result;
}

function parseMultipleDays(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") {
    return [];
  }

  const parsed = raw
    .split(",")
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);

  return Array.from(new Set(parsed));
}

function parseMinutes(value: string) {
  const [hours, minutes] = value.split(":").map((item) => Number(item));
  return hours * 60 + minutes;
}

function isOvernight(start: string, end: string) {
  return parseMinutes(end) <= parseMinutes(start);
}

function nextDay(dayOfWeek: number) {
  return (dayOfWeek + 1) % 7;
}

function buildDisponibilidadRows(params: {
  clubId: number;
  deporte: "tenis" | "padel" | "futbol";
  dayOfWeek: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
}) {
  const baseRow = {
    club_id: params.clubId,
    deporte: params.deporte,
    duraciones: params.duraciones,
  };

  if (!isOvernight(params.apertura, params.cierre)) {
    return [
      {
        ...baseRow,
        day_of_week: params.dayOfWeek,
        apertura: params.apertura,
        cierre: params.cierre,
      },
    ];
  }

  const rows = [
    {
      ...baseRow,
      day_of_week: params.dayOfWeek,
      apertura: params.apertura,
      cierre: "23:59",
    },
  ];

  if (params.cierre !== "00:00") {
    rows.push({
      ...baseRow,
      day_of_week: nextDay(params.dayOfWeek),
      apertura: "00:00",
      cierre: params.cierre,
    });
  }

  return rows;
}

type DisponibilidadOverlapRow = {
  id: number;
  day_of_week: number;
  apertura: string;
  cierre: string;
};

type DisponibilidadCoverageRow = {
  apertura: string;
  cierre: string;
  duraciones: number[];
};

function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aStartMinutes = parseMinutes(aStart);
  const aEndMinutes = parseMinutes(aEnd);
  const bStartMinutes = parseMinutes(bStart);
  const bEndMinutes = parseMinutes(bEnd);
  return aStartMinutes < bEndMinutes && aEndMinutes > bStartMinutes;
}

const weekDayLabels: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miercoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sabado",
};

function formatTimeLabel(value: string) {
  const base = value.slice(0, 5);
  return base === "23:59" ? "24:00" : base;
}

async function hasDisponibilidadOverlap(params: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  clubId: number;
  deporte: "tenis" | "padel" | "futbol";
  rows: Array<{ day_of_week: number; apertura: string; cierre: string }>;
  ignoreIds?: number[];
}) {
  const days = Array.from(new Set(params.rows.map((row) => row.day_of_week)));
  if (days.length === 0) return false;

  const { data, error } = await params.supabase
    .from("club_disponibilidad")
    .select("id, day_of_week, apertura, cierre")
    .eq("club_id", params.clubId)
    .eq("deporte", params.deporte)
    .in("day_of_week", days);

  if (error) {
    throw new Error("No se pudo validar superposicion de disponibilidad.");
  }

  const existing = (data ?? []) as DisponibilidadOverlapRow[];
  const ignoreSet = new Set(params.ignoreIds ?? []);

  for (const candidate of params.rows) {
    const conflict = existing.find((current) => {
      if (ignoreSet.has(current.id)) return false;
      if (current.day_of_week !== candidate.day_of_week) return false;
      return intervalsOverlap(candidate.apertura, candidate.cierre, current.apertura, current.cierre);
    });

    if (conflict) {
      return {
        day_of_week: conflict.day_of_week,
        apertura: conflict.apertura,
        cierre: conflict.cierre,
      };
    }
  }

  return null;
}

function isFranjaInsideDisponibilidad(
  franja: { desde: string; hasta: string; duracion_minutos: number },
  disponibilidadRows: DisponibilidadCoverageRow[],
) {
  const candidates = disponibilidadRows
    .filter((row) => row.duraciones.includes(franja.duracion_minutos))
    .map((row) => ({
      apertura: parseMinutes(row.apertura),
      cierre: parseMinutes(row.cierre),
    }))
    .sort((a, b) => a.apertura - b.apertura);
  if (candidates.length === 0) return false;

  const franjaDesde = parseMinutes(franja.desde);
  const franjaHasta = parseMinutes(franja.hasta);

  // Permite validar cobertura continua aunque la jornada este partida en varios tramos.
  let coveredUntil = franjaDesde;
  for (const candidate of candidates) {
    if (candidate.cierre <= coveredUntil) continue;
    if (candidate.apertura > coveredUntil) break;
    coveredUntil = Math.max(coveredUntil, candidate.cierre);
    if (coveredUntil >= franjaHasta) return true;
  }

  return false;
}

async function findInvalidFranjaCoverage(params: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  clubId: number;
  deporte: "tenis" | "padel" | "futbol";
  rows: Array<{ desde: string; hasta: string; duracion_minutos: number }>;
}) {
  const { data, error } = await params.supabase
    .from("club_disponibilidad")
    .select("apertura, cierre, duraciones")
    .eq("club_id", params.clubId)
    .eq("deporte", params.deporte);

  if (error) {
    throw new Error("No se pudo validar franjas contra disponibilidad.");
  }

  const disponibilidadRows = (data ?? []) as DisponibilidadCoverageRow[];
  const invalid = params.rows.find((row) => !isFranjaInsideDisponibilidad(row, disponibilidadRows));
  if (!invalid) return null;

  return invalid;
}

function buildFranjaRows(params: {
  clubId: number;
  deporte: "tenis" | "padel" | "futbol";
  desde: string;
  hasta: string;
  duracionMinutos: number;
  precio: number;
  canchaId: number | null;
}) {
  const baseRow = {
    club_id: params.clubId,
    deporte: params.deporte,
    duracion_minutos: params.duracionMinutos,
    precio: params.precio,
    cancha_id: params.canchaId,
  };

  if (!isOvernight(params.desde, params.hasta)) {
    return orderedWeekDays.map((day) => ({
      ...baseRow,
      day_of_week: day,
      desde: params.desde,
      hasta: params.hasta,
    }));
  }

  const rows: Array<{
    club_id: number;
    deporte: "tenis" | "padel" | "futbol";
    duracion_minutos: number;
    precio: number;
    cancha_id: number | null;
    day_of_week: number;
    desde: string;
    hasta: string;
  }> = [];

  orderedWeekDays.forEach((day) => {
    rows.push({
      ...baseRow,
      day_of_week: day,
      desde: params.desde,
      hasta: "23:59",
    });

    if (params.hasta !== "00:00") {
      rows.push({
        ...baseRow,
        day_of_week: nextDay(day),
        desde: "00:00",
        hasta: params.hasta,
      });
    }
  });

  return rows;
}

const orderedWeekDays = [0, 1, 2, 3, 4, 5, 6];

export async function upsertConfiguracionAction(
  _prev: ClubConfiguracionActionState,
  formData: FormData,
): Promise<ClubConfiguracionActionState> {
  const club = await requireClub();
  const submitted = getSubmittedValues(formData, [
    "confirmacion_automatica",
    "cancelacion_horas_limite",
  ]);

  const parsed = configuracionSchema.safeParse({
    confirmacion_automatica: formData.get("confirmacion_automatica") === "on",
    cancelacion_horas_limite: formData.get("cancelacion_horas_limite"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? initialError, success: null, submitted };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("club_configuracion").upsert(
    {
      club_id: club.id,
      confirmacion_automatica: parsed.data.confirmacion_automatica,
      cancelacion_horas_limite: parsed.data.cancelacion_horas_limite,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "club_id" },
  );

  if (error) {
    return { error: "No se pudo actualizar la configuracion general.", success: null, submitted };
  }

  revalidatePath("/dashboard/club/configuracion");
  return { error: null, success: "Configuracion general actualizada.", submitted: {} };
}

export async function upsertDisponibilidadAction(
  _prev: ClubConfiguracionActionState,
  formData: FormData,
): Promise<ClubConfiguracionActionState> {
  const club = await requireClub();
  const submitted = getSubmittedValues(formData, [
    "id",
    "deporte",
    "day_of_week",
    "day_of_week_multi",
    "apertura",
    "cierre",
    "duracion_60",
    "duracion_90",
    "duracion_120",
  ]);
  const duraciones = parseDuraciones(formData);

  const parsed = disponibilidadSchema.safeParse({
    id: formData.get("id"),
    deporte: formData.get("deporte"),
    day_of_week: formData.get("day_of_week"),
    apertura: formData.get("apertura"),
    cierre: formData.get("cierre"),
    duraciones,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? initialError, success: null, submitted };
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.id) {
    const rows = buildDisponibilidadRows({
      clubId: club.id,
      deporte: parsed.data.deporte,
      dayOfWeek: parsed.data.day_of_week,
      apertura: parsed.data.apertura,
      cierre: parsed.data.cierre,
      duraciones: parsed.data.duraciones,
    });

    let overlap: Awaited<ReturnType<typeof hasDisponibilidadOverlap>>;
    try {
      overlap = await hasDisponibilidadOverlap({
        supabase,
        clubId: club.id,
        deporte: parsed.data.deporte,
        rows: rows.map((row) => ({
          day_of_week: row.day_of_week,
          apertura: row.apertura,
          cierre: row.cierre,
        })),
        ignoreIds: [parsed.data.id],
      });
    } catch {
      return { error: "No se pudo validar la superposicion horaria.", success: null, submitted };
    }

    if (overlap) {
      return {
        error: `Se superpone con ${weekDayLabels[overlap.day_of_week]} ${formatTimeLabel(overlap.apertura)}-${formatTimeLabel(overlap.cierre)}.`,
        success: null,
        submitted,
      };
    }

    const { error } = await supabase
      .from("club_disponibilidad")
      .delete()
      .eq("id", parsed.data.id)
      .eq("club_id", club.id);

    if (error) {
      return { error: "No se pudo guardar el tramo de disponibilidad.", success: null, submitted };
    }

    const { error: insertError } = await supabase
      .from("club_disponibilidad")
      .upsert(rows, { onConflict: "club_id,deporte,day_of_week,apertura" });

    if (insertError) {
      return { error: "No se pudo guardar el tramo de disponibilidad.", success: null, submitted };
    }
  } else {
    const multipleDays = parseMultipleDays(formData.get("day_of_week_multi"));
    const daysToInsert = multipleDays.length > 0 ? multipleDays : [parsed.data.day_of_week];

    const payload = daysToInsert.flatMap((day) =>
      buildDisponibilidadRows({
        clubId: club.id,
        deporte: parsed.data.deporte,
        dayOfWeek: day,
        apertura: parsed.data.apertura,
        cierre: parsed.data.cierre,
        duraciones: parsed.data.duraciones,
      }),
    );

    let overlap: Awaited<ReturnType<typeof hasDisponibilidadOverlap>>;
    try {
      overlap = await hasDisponibilidadOverlap({
        supabase,
        clubId: club.id,
        deporte: parsed.data.deporte,
        rows: payload.map((row) => ({
          day_of_week: row.day_of_week,
          apertura: row.apertura,
          cierre: row.cierre,
        })),
      });
    } catch {
      return { error: "No se pudo validar la superposicion horaria.", success: null, submitted };
    }

    if (overlap) {
      return {
        error: `Se superpone con ${weekDayLabels[overlap.day_of_week]} ${formatTimeLabel(overlap.apertura)}-${formatTimeLabel(overlap.cierre)}.`,
        success: null,
        submitted,
      };
    }

    const { error } = await supabase
      .from("club_disponibilidad")
      .upsert(payload, { onConflict: "club_id,deporte,day_of_week,apertura" });
    if (error) {
      return { error: "No se pudo guardar uno o mas tramos de disponibilidad.", success: null, submitted };
    }
  }

  revalidatePath("/dashboard/club/configuracion");
  return { error: null, success: "Disponibilidad actualizada.", submitted: {} };
}

export async function deleteDisponibilidadAction(formData: FormData) {
  const club = await requireClub();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("club_disponibilidad").delete().eq("id", id).eq("club_id", club.id);

  revalidatePath("/dashboard/club/configuracion");
}

export async function upsertFranjaPrecioAction(
  _prev: ClubConfiguracionActionState,
  formData: FormData,
): Promise<ClubConfiguracionActionState> {
  const club = await requireClub();
  const submittedBase = getSubmittedValues(formData, [
    "id",
    "deporte",
    "desde",
    "hasta",
    "duracion_minutos",
    "precio",
  ]);
  // Leer todos los valores de cancha_targets.
  const rawTargets = formData
    .getAll("cancha_targets")
    .map((v) => String(v).trim())
    .filter(Boolean);
  // Si no viene nada, defaultear a global.
  const canchaTargets = rawTargets.length > 0 ? rawTargets : ["global"];
  // Convertir a array de cancha_id: null = global, number = específica.
  const canchaIds: Array<number | null> = canchaTargets.map((t) => (t === "global" ? null : Number(t)));
  const submitted = {
    ...submittedBase,
    cancha_targets: canchaTargets[0] ?? "global",
  };

  const parsed = franjaPrecioSchema.safeParse({
    id: formData.get("id"),
    deporte: formData.get("deporte"),
    desde: formData.get("desde"),
    hasta: formData.get("hasta"),
    duracion_minutos: formData.get("duracion_minutos"),
    precio: formData.get("precio"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? initialError, success: null, submitted };
  }

  const supabase = await createSupabaseServerClient();
  let invalidCoverage: Awaited<ReturnType<typeof findInvalidFranjaCoverage>>;
  try {
    invalidCoverage = await findInvalidFranjaCoverage({
      supabase,
      clubId: club.id,
      deporte: parsed.data.deporte,
      rows: [
        {
          desde: parsed.data.desde,
          hasta: parsed.data.hasta,
          duracion_minutos: parsed.data.duracion_minutos,
        },
      ],
    });
  } catch {
    return { error: "No se pudo validar la franja contra la disponibilidad.", success: null, submitted };
  }

  if (invalidCoverage) {
    return {
      error: `La franja no coincide con la disponibilidad cargada (${formatTimeLabel(invalidCoverage.desde)}-${formatTimeLabel(invalidCoverage.hasta)}, ${invalidCoverage.duracion_minutos} min).`,
      success: null,
      submitted,
    };
  }

  if (parsed.data.id) {
    const { data: currentRow, error: currentError } = await supabase
      .from("club_franjas_precio")
      .select("deporte, desde, hasta, duracion_minutos, cancha_id")
      .eq("id", parsed.data.id)
      .eq("club_id", club.id)
      .maybeSingle();

    if (currentError || !currentRow) {
      return { error: "No se pudo guardar la franja de precio.", success: null, submitted };
    }

    let deleteQuery = supabase
      .from("club_franjas_precio")
      .delete()
      .eq("club_id", club.id)
      .eq("deporte", currentRow.deporte)
      .eq("desde", currentRow.desde)
      .eq("hasta", currentRow.hasta)
      .eq("duracion_minutos", currentRow.duracion_minutos);

    if (currentRow.cancha_id !== null && currentRow.cancha_id !== undefined) {
      deleteQuery = deleteQuery.eq("cancha_id", currentRow.cancha_id);
    } else {
      deleteQuery = deleteQuery.is("cancha_id", null);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return { error: "No se pudo guardar la franja de precio.", success: null, submitted };
    }
    const rows = buildFranjaRows({
      clubId: club.id,
      deporte: parsed.data.deporte,
      desde: parsed.data.desde,
      hasta: parsed.data.hasta,
      duracionMinutos: parsed.data.duracion_minutos,
      precio: parsed.data.precio,
      canchaId: currentRow.cancha_id ?? null,
    });
    const { error } = await supabase.from("club_franjas_precio").insert(rows);
    if (error) {
      return { error: "No se pudo guardar la franja de precio.", success: null, submitted };
    }
  } else {
    // Para cada cancha target, hacer el delete+insert.
    for (const canchaId of canchaIds) {
      const rows = buildFranjaRows({
        clubId: club.id,
        deporte: parsed.data.deporte,
        desde: parsed.data.desde,
        hasta: parsed.data.hasta,
        duracionMinutos: parsed.data.duracion_minutos,
        precio: parsed.data.precio,
        canchaId,
      });

      // Limpiar filas existentes con los mismos parámetros.
      let cleanupQuery = supabase
        .from("club_franjas_precio")
        .delete()
        .eq("club_id", club.id)
        .eq("deporte", parsed.data.deporte)
        .eq("desde", parsed.data.desde)
        .eq("hasta", parsed.data.hasta)
        .eq("duracion_minutos", parsed.data.duracion_minutos);

      if (canchaId !== null) {
        cleanupQuery = cleanupQuery.eq("cancha_id", canchaId);
      } else {
        cleanupQuery = cleanupQuery.is("cancha_id", null);
      }
      await cleanupQuery;

      const { error } = await supabase.from("club_franjas_precio").insert(rows);
      if (error) {
        return { error: "No se pudo guardar la franja de precio.", success: null, submitted };
      }
    }
  }

  revalidatePath("/dashboard/club/configuracion");
  return { error: null, success: "Franja de precio actualizada.", submitted: {} };
}

export async function deleteFranjaPrecioAction(formData: FormData) {
  const club = await requireClub();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;

  const supabase = await createSupabaseServerClient();
  const { data: currentRow } = await supabase
    .from("club_franjas_precio")
    .select("deporte, desde, hasta, duracion_minutos, cancha_id")
    .eq("id", id)
    .eq("club_id", club.id)
    .maybeSingle();

  if (currentRow) {
    let deleteQuery = supabase
      .from("club_franjas_precio")
      .delete()
      .eq("club_id", club.id)
      .eq("deporte", currentRow.deporte)
      .eq("desde", currentRow.desde)
      .eq("hasta", currentRow.hasta)
      .eq("duracion_minutos", currentRow.duracion_minutos);

    if (currentRow.cancha_id !== null && currentRow.cancha_id !== undefined) {
      deleteQuery = deleteQuery.eq("cancha_id", currentRow.cancha_id);
    } else {
      deleteQuery = deleteQuery.is("cancha_id", null);
    }

    await deleteQuery;
  }

  revalidatePath("/dashboard/club/configuracion");
}
