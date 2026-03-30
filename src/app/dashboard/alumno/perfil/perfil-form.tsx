"use client";

import { useActionState } from "react";
import { ZonaSelector } from "@/components/zona-selector";
import { saveAlumnoProfileAction } from "./actions";

type AlumnoPerfilFormProps = {
  initialValues: {
    name: string;
    category: "Principiante" | "8va" | "7ma" | "6ta" | "5ta" | "4ta" | "3ra" | "2da" | "1ra";
    branch: "Caballero" | "Dama";
    provincia: string;
    municipio: string;
    has_equipment: boolean;
  };
};

export function AlumnoPerfilForm({ initialValues }: AlumnoPerfilFormProps) {
  const [state, formAction, isPending] = useActionState(saveAlumnoProfileAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-6 grid gap-5">
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Nombre</span>
        <input
          type="text"
          name="name"
          defaultValue={initialValues.name}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Categoría</span>
        <select
          name="category"
          defaultValue={initialValues.category}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="Principiante">Principiante</option>
          <option value="8va">8va</option>
          <option value="7ma">7ma</option>
          <option value="6ta">6ta</option>
          <option value="5ta">5ta</option>
          <option value="4ta">4ta</option>
          <option value="3ra">3ra</option>
          <option value="2da">2da</option>
          <option value="1ra">1ra</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Rama</span>
        <select
          name="branch"
          defaultValue={initialValues.branch}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="Caballero">Caballero</option>
          <option value="Dama">Dama</option>
        </select>
      </label>

      <ZonaSelector
        defaultProvincia={initialValues.provincia}
        defaultMunicipio={initialValues.municipio}
      />

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3">
        <input
          type="checkbox"
          name="has_equipment"
          defaultChecked={initialValues.has_equipment}
          className="mt-0.5 h-4 w-4 rounded border-zinc-400 accent-zinc-900"
        />
        <div>
          <p className="text-sm font-medium text-zinc-800">Tengo paleta / raqueta propia</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            El profesor podrá ver este dato al revisar tu perfil.
          </p>
        </div>
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
