"use client";

import { useActionState } from "react";
import { assignPackageToStudentAction } from "./actions";

type AlumnoOption = {
  user_id: string;
  name: string;
};

type PackageOption = {
  id: number;
  name: string;
  total_classes: number;
};

type AssignPackageFormProps = {
  alumnos: AlumnoOption[];
  packages: PackageOption[];
};

export function AssignPackageForm({ alumnos, packages }: AssignPackageFormProps) {
  const [state, formAction, isPending] = useActionState(assignPackageToStudentAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-3">
      <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
        Asignar paquete
      </h2>

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
        <span>Paquete</span>
        <select
          name="package_id"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        >
          <option value="">Seleccionar paquete</option>
          {packages.map((pack) => (
            <option key={pack.id} value={pack.id}>
              {pack.name} ({pack.total_classes} clases)
            </option>
          ))}
        </select>
      </label>

      {state.error ? (
        <p className="rounded-lg px-3 py-2 text-sm font-medium" style={{ border: "1px solid var(--error-border)", background: "var(--error-bg)", color: "#fca5a5" }}>
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg px-3 py-2 text-sm font-medium" style={{ border: "1px solid var(--success-border)", background: "var(--success-bg)", color: "#86efac" }}>
          {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center disabled:opacity-60">
        {isPending ? "Guardando..." : "Asignar paquete"}
      </button>
    </form>
  );
}
