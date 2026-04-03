"use client";

import { useActionState, useMemo, useState } from "react";
import { responderInvitacionAction, type InvitacionActionState } from "./invitaciones-actions";

type Invitacion = {
  id: number;
  club: { nombre: string; direccion: string | null };
  invited_at: string;
};

type ClubPropio = {
  id: number;
  nombre: string;
};

type Props = {
  invitaciones: Invitacion[];
  clubsPropios: ClubPropio[];
};

const initialState: InvitacionActionState = {
  error: null,
  success: null,
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-AR");
}

function InvitacionCard({
  invitacion,
  clubsPropios,
}: {
  invitacion: Invitacion;
  clubsPropios: ClubPropio[];
}) {
  const [state, formAction, pending] = useActionState(responderInvitacionAction, initialState);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const options = useMemo(() => clubsPropios, [clubsPropios]);

  return (
    <article
      className="rounded-lg border p-4"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <div className="flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {invitacion.club.nombre}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {invitacion.club.direccion ?? "Sin dirección"} · Invitado el {formatDate(invitacion.invited_at)}
          </p>
        </div>

        <label className="label">
          <span>¿Vincular con un club creado?</span>
          <select
            className="select"
            value={selectedClub}
            onChange={(event) => setSelectedClub(event.target.value)}
          >
            <option value="">No vincular</option>
            {options.map((club) => (
              <option key={club.id} value={String(club.id)}>
                {club.nombre}
              </option>
            ))}
          </select>
        </label>

        {state.error ? <p className="alert-error">{state.error}</p> : null}
        {state.success ? <p className="alert-success">{state.success}</p> : null}

        <div className="flex flex-wrap gap-2">
          <form action={formAction}>
            <input type="hidden" name="club_profesores_id" value={String(invitacion.id)} />
            <input type="hidden" name="respuesta" value="aceptar" />
            {selectedClub ? (
              <input type="hidden" name="merge_club_id" value={selectedClub} />
            ) : null}
            <button type="submit" className="btn-primary" disabled={pending}>
              Aceptar
            </button>
          </form>
          <form action={formAction}>
            <input type="hidden" name="club_profesores_id" value={String(invitacion.id)} />
            <input type="hidden" name="respuesta" value="rechazar" />
            <button type="submit" className="btn-ghost" disabled={pending}>
              Rechazar
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}

export function InvitacionesManager({ invitaciones, clubsPropios }: Props) {
  if (invitaciones.length === 0) {
    return (
      <div className="rounded-lg border px-4 py-6 text-sm" style={{ borderColor: "var(--border)" }}>
        <p style={{ color: "var(--muted)" }}>No tenés invitaciones pendientes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {invitaciones.map((invitacion) => (
        <InvitacionCard
          key={invitacion.id}
          invitacion={invitacion}
          clubsPropios={clubsPropios}
        />
      ))}
    </div>
  );
}
