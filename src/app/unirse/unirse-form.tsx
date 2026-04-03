"use client";

import { useActionState, useEffect, useState } from "react";
import { enviarSolicitudClubAction } from "./actions";

type FormValues = {
  nombre: string;
  direccion: string;
  cuit: string;
  email: string;
  telefono: string;
  mensaje: string;
};

export function UnirseForm() {
  const [state, formAction, isPending] = useActionState(enviarSolicitudClubAction, {
    error: null,
    success: false,
    invalidField: null,
  });
  const [values, setValues] = useState<FormValues>({
    nombre: "",
    direccion: "",
    cuit: "",
    email: "",
    telefono: "",
    mensaje: "",
  });

  useEffect(() => {
    if (!state.invalidField) {
      return;
    }

    const invalidField = state.invalidField as keyof FormValues;

    setValues((current) => ({
      ...current,
      [invalidField]: "",
    }));
  }, [state.invalidField]);

  if (state.success) {
    return (
      <div
        className="rounded-xl border p-8 text-center"
        style={{ borderColor: "var(--success-border)", background: "var(--success-bg)" }}
      >
        <p className="text-lg font-semibold" style={{ color: "var(--success)" }}>
          ¡Solicitud enviada!
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Vamos a validar tu solicitud y te contactaremos al mail que ingresaste para contarte cómo sumar tu club a la plataforma.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <label className="label">
        <span>Nombre del club</span>
        <input
          type="text"
          name="nombre"
          className="input"
          value={values.nombre}
          onChange={(event) => setValues((current) => ({ ...current, nombre: event.target.value }))}
          required
        />
      </label>

      <label className="label">
        <span>Dirección</span>
        <input
          type="text"
          name="direccion"
          className="input"
          value={values.direccion}
          onChange={(event) => setValues((current) => ({ ...current, direccion: event.target.value }))}
          required
        />
      </label>

      <label className="label">
        <span>CUIT</span>
        <input
          type="text"
          name="cuit"
          className="input"
          maxLength={13}
          value={values.cuit}
          onChange={(event) => setValues((current) => ({ ...current, cuit: event.target.value }))}
          required
        />
      </label>

      <label className="label">
        <span>Email de contacto</span>
        <input
          type="email"
          name="email"
          className="input"
          value={values.email}
          onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </label>

      <label className="label">
        <span>Teléfono</span>
        <input
          type="text"
          name="telefono"
          className="input"
          value={values.telefono}
          onChange={(event) => setValues((current) => ({ ...current, telefono: event.target.value }))}
          required
        />
      </label>

      <label className="label">
        <span>
          ¿Algo que quieras contarnos? <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(opcional)</span>
        </span>
        <textarea
          name="mensaje"
          rows={4}
          className="input"
          value={values.mensaje}
          onChange={(event) => setValues((current) => ({ ...current, mensaje: event.target.value }))}
        />
      </label>

      {state.error ? <p className="alert-error">{state.error}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Enviando..." : "Enviar solicitud"}
        </button>
      </div>
    </form>
  );
}
