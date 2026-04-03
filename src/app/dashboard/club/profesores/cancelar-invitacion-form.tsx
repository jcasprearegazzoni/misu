"use client";

import { useActionState } from "react";
import { cancelarInvitacionAction, type CancelarInvitacionActionState } from "./actions";

type Props = {
  profesorId: string;
};

const initialState: CancelarInvitacionActionState = {
  error: null,
  success: null,
};

export function CancelarInvitacionForm({ profesorId }: Props) {
  const [state, formAction, pending] = useActionState(cancelarInvitacionAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("¿Querés cancelar esta invitación?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="profesor_id" value={profesorId} />
      <button type="submit" className="btn-ghost text-xs" style={{ color: "var(--error)" }} disabled={pending}>
        Cancelar
      </button>
      {state.error ? <span className="sr-only">{state.error}</span> : null}
    </form>
  );
}
