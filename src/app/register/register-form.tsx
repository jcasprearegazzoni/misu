"use client";

import { useActionState } from "react";
import { registerAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-7 grid gap-4">
      {/* Nombre */}
      <label className="label">
        <span>Nombre completo</span>
        <input
          type="text"
          name="name"
          className="input"
          placeholder="Tu nombre"
          required
          autoComplete="name"
        />
      </label>

      {/* Rol */}
      <label className="label">
        <span>¿Cuál es tu rol?</span>
        <select name="role" className="select" defaultValue="alumno">
          <option value="alumno">Alumno</option>
          <option value="profesor">Profesor</option>
        </select>
      </label>

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
          placeholder="Mínimo 6 caracteres"
          required
          autoComplete="new-password"
        />
      </label>

      {state.error ? (
        <div className="alert-error">{state.error}</div>
      ) : null}

      {state.success ? (
        <div className="alert-success">
          <p>{state.success}</p>
          <a href="/login" className="text-link mt-2 inline-block font-semibold text-sm">
            Ir a iniciar sesión →
          </a>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary mt-2 w-full"
        style={{ padding: "0.75rem", fontSize: "0.9375rem", justifyContent: "center" }}
      >
        {isPending ? "Creando cuenta..." : "Crear cuenta gratis"}
      </button>

      <p className="text-center text-xs" style={{ color: "var(--muted-2)" }}>
        Al registrarte aceptás los términos de uso de misu.
      </p>
    </form>
  );
}
