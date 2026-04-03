"use client";

import { useActionState } from "react";
import { invitarProfesorAction, type InvitarProfesorActionState } from "./actions";

type Props = {
  profesorUserId: string;
};

const initialState: InvitarProfesorActionState = {
  error: null,
  success: null,
};

export function InvitarProfesorForm({ profesorUserId }: Props) {
  const [state, formAction, pending] = useActionState(invitarProfesorAction, initialState);

  if (state.success) {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--success)" }}>
        Invitación enviada
      </span>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="profesor_user_id" value={profesorUserId} />
      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Invitar"}
      </button>
      {state.error ? (
        <span className="text-xs" style={{ color: "var(--error)" }}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
