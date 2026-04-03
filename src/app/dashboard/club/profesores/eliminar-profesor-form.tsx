"use client";

import { useActionState } from "react";
import { eliminarProfesorAction, type EliminarProfesorActionState } from "./actions";

type Props = {
  profesorId: string;
  profesorNombre: string;
};

const initialState: EliminarProfesorActionState = {
  error: null,
  success: null,
};

export function EliminarProfesorForm({ profesorId, profesorNombre }: Props) {
  const [state, formAction, pending] = useActionState(eliminarProfesorAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="profesor_id" value={profesorId} />
      <button
        type="submit"
        disabled={pending}
        className="btn-ghost text-xs"
        style={{ color: "var(--error)" }}
        onClick={(event) => {
          if (!window.confirm(`¿Querés eliminar a ${profesorNombre} del club?`)) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "..." : "Eliminar"}
      </button>
      {state.error ? <span className="text-xs" style={{ color: "var(--error)" }}>{state.error}</span> : null}
    </form>
  );
}
