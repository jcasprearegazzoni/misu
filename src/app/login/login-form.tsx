"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

type LoginFormProps = {
  redirectTo?: string | null;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
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
          placeholder="Tu contraseña"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
