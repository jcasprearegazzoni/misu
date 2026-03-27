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
    <form action={formAction} className="mt-4 grid gap-3 rounded-lg border border-zinc-300 bg-white p-4">
      <h2 className="text-lg font-semibold text-zinc-900">Asignar paquete a alumno</h2>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Alumno</span>
        <select
          name="alumno_id"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
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

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Paquete</span>
        <select
          name="package_id"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
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
        <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Asignar paquete"}
      </button>
    </form>
  );
}

