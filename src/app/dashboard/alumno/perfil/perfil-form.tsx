"use client";

import { useActionState } from "react";
import { ZonaSelector } from "@/components/zona-selector";
import { saveAlumnoProfileAction } from "./actions";

type AlumnoPerfilFormProps = {
  redirectTo?: string | null;
  successMessage?: string | null;
  initialValues: {
    name: string;
    category: "Principiante" | "8va" | "7ma" | "6ta" | "5ta" | "4ta" | "3ra" | "2da" | "1ra";
    branch: "Caballero" | "Dama";
    provincia: string;
    municipio: string;
    has_equipment: boolean;
  };
};

export function AlumnoPerfilForm({ initialValues, redirectTo, successMessage }: AlumnoPerfilFormProps) {
  const [state, formAction, isPending] = useActionState(saveAlumnoProfileAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <label className="label">
        <span>Nombre</span>
        <input type="text" name="name" defaultValue={initialValues.name} className="input" required />
      </label>

      <label className="label">
        <span>Categoría</span>
        <select name="category" defaultValue={initialValues.category} className="select">
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

      <label className="label">
        <span>Rama</span>
        <select name="branch" defaultValue={initialValues.branch} className="select">
          <option value="Caballero">Caballero</option>
          <option value="Dama">Dama</option>
        </select>
      </label>

      <ZonaSelector defaultProvincia={initialValues.provincia} defaultMunicipio={initialValues.municipio} />

      <label
        className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <input
          type="checkbox"
          name="has_equipment"
          defaultChecked={initialValues.has_equipment}
          className="mt-0.5 h-4 w-4 rounded accent-orange-500"
        />
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Tengo paleta o raqueta propia
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
            El profesor podrá ver este dato al revisar tu perfil.
          </p>
        </div>
      </label>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {successMessage ? <p className="alert-success">{successMessage}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}
