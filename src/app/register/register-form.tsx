"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Nombre</span>
        <input
          type="text"
          name="name"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Tu nombre"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Rol</span>
        <select
          name="role"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          defaultValue="alumno"
        >
          <option value="alumno">Alumno</option>
          <option value="profesor">Profesor</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Correo electrónico</span>
        <input
          type="email"
          name="email"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="email@ejemplo.com"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Contraseña</span>
        <input
          type="password"
          name="password"
          className="rounded-lg border border-zinc-400 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-500 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Mínimo 6 caracteres"
          required
        />
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
        {isPending ? "Creando cuenta..." : "Crear cuenta"}
      </button>
    </form>
  );
}
