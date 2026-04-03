"use client";

import { useActionState } from "react";
import { adminLoginAction } from "./actions";

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(adminLoginAction, {
    error: null,
  });

  return (
    <form action={formAction} className="mt-7 grid gap-4">
      <label className="label">
        <span>Email</span>
        <input
          type="email"
          name="email"
          className="input"
          placeholder="admin@misu.com"
          required
          autoComplete="email"
        />
      </label>

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

      {state.error ? <div className="alert-error">{state.error}</div> : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 w-full"
        style={{ padding: "0.75rem", fontSize: "0.9375rem", justifyContent: "center" }}
      >
        {isPending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
