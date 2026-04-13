"use client";

import { useActionState } from "react";
import type { ProgramActionState } from "./actions";

type ProgramOption = {
  id: number;
  nombre: string;
};

type AlumnoOption = {
  user_id: string;
  name: string;
};

type AssignProgramFormProps = {
  programs: ProgramOption[];
  alumnos: AlumnoOption[];
  action: (
    prevState: ProgramActionState,
    formData: FormData,
  ) => Promise<ProgramActionState>;
  defaultProgramId?: number;
};

export function AssignProgramForm({
  programs,
  alumnos,
  action,
  defaultProgramId,
}: AssignProgramFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-3">
      <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
        Asignar alumno
      </h3>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Alumno</span>
        <select
          name="alumno_id"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        >
          <option value="">Seleccionar alumno</option>
          {alumnos.map((alumno) => (
            <option key={alumno.user_id} value={alumno.user_id}>
              {alumno.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Programa</span>
        <select
          name="program_id"
          defaultValue={defaultProgramId ? String(defaultProgramId) : ""}
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        >
          <option value="">Seleccionar programa</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.nombre}
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            border: "1px solid var(--error)",
            background: "color-mix(in srgb, var(--error) 10%, transparent)",
            color: "var(--error)",
          }}
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            border: "1px solid var(--success)",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
            color: "var(--success)",
          }}
        >
          {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center disabled:opacity-60">
        {isPending ? "Asignando..." : "Asignar"}
      </button>
    </form>
  );
}
