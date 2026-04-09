"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { reserveSlotAction } from "./actions";

type ReserveSlotFormProps = {
  profesorId: string;
  date: string;
  startTime: string;
  endTime: string;
  fixedType: "individual" | "dobles" | "trio" | "grupal" | null;
  sport: "tenis" | "padel" | null;
};

const typeLabel: Record<Exclude<ReserveSlotFormProps["fixedType"], null>, string> = {
  individual: "Individual",
  dobles: "Dobles",
  trio: "Trio",
  grupal: "Grupal",
};

export function ReserveSlotForm({
  profesorId,
  date,
  startTime,
  endTime,
  fixedType,
  sport,
}: ReserveSlotFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(reserveSlotAction, {
    error: null,
    success: null,
  });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    const timer = setTimeout(() => {
      router.refresh();
    }, 1400);

    return () => clearTimeout(timer);
  }, [router, state.success]);

  return (
    <form action={formAction} className="grid gap-2 sm:flex sm:items-center sm:gap-2">
      <input type="hidden" name="profesor_id" value={profesorId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="start_time" value={startTime} />
      <input type="hidden" name="end_time" value={endTime} />
      {sport ? (
        <input type="hidden" name="sport" value={sport} />
      ) : (
        <select
          name="sport"
          defaultValue=""
          required
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900"
        >
          <option value="" disabled>
            Deporte
          </option>
          <option value="tenis">Tenis</option>
          <option value="padel">Pádel</option>
        </select>
      )}
      {fixedType ? (
        <>
          <input type="hidden" name="type" value={fixedType} />
          <span className="inline-flex rounded-md border border-zinc-300 bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
            Tipo fijo: {typeLabel[fixedType]}
          </span>
        </>
      ) : (
        <select
          name="type"
          defaultValue="individual"
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900"
        >
          <option value="individual">Individual</option>
          <option value="dobles">Dobles</option>
          <option value="trio">Trio</option>
          <option value="grupal">Grupal</option>
        </select>
      )}
      <select
        name="weeks_count"
        defaultValue="1"
        className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900"
      >
        <option value="1">Solo esta clase</option>
        <option value="4">4 semanas</option>
        <option value="8">8 semanas</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Reservando..." : "Reservar"}
      </button>
      {state.error ? (
        <p className="whitespace-pre-line rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
          <p className="font-semibold">Reserva enviada. Aguardando confirmacion del profesor.</p>
          <p className="mt-1 whitespace-pre-line">{state.success}</p>
        </div>
      ) : null}
    </form>
  );
}
