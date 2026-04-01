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
    <form action={formAction} className="mt-7 grid gap-4">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      {/* Email */}
      <label className="label">
        <span>Correo electrónico</span>
        <input
          type="email"
          name="email"
          className="input"
          placeholder="email@ejemplo.com"
          required
          autoComplete="email"
        />
      </label>

      {/* Contraseña */}
      <label className="label">
        <span>Contraseña</span>
        <input
          type="password"
          name="password"
          className="input"
          placeholder="Tu contraseña"
          required
          autoComplete="current-password"
        />
      </label>

      {state.error ? (
        <div className="alert-error">{state.error}</div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 w-full"
        style={{ padding: "0.75rem", fontSize: "0.9375rem", justifyContent: "center" }}
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
