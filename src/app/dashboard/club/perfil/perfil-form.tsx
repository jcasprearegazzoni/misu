"use client";

import { useActionState } from "react";
import type { CurrentClub } from "@/lib/auth/get-current-club";
import { updateClubPerfilAction } from "./actions";

type ClubPerfilFormProps = {
  club: CurrentClub;
};

export function ClubPerfilForm({ club }: ClubPerfilFormProps) {
  const [state, formAction, isPending] = useActionState(updateClubPerfilAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="grid gap-6">
      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Datos generales
        </h2>

        <div className="mt-4 grid gap-4">
          <label className="label">
            <span>Nombre del club</span>
            <input type="text" name="nombre" defaultValue={club.nombre} className="input" required />
          </label>

          <label className="label">
            <span>Usuario público</span>
            <input
              type="text"
              name="username"
              defaultValue={club.username ?? ""}
              className="input"
              placeholder={club.username ?? "Se genera automáticamente"}
            />
            <small style={{ color: "var(--muted)" }}>
              Tu URL pública: misu.app/clubes/<strong>{club.username ?? "usuario"}</strong>. Si lo dejás vacío se genera a partir del nombre.
            </small>
          </label>

          <label className="label">
            <span>Dirección</span>
            <input type="text" name="direccion" defaultValue={club.direccion ?? ""} className="input" />
          </label>

          <label className="label">
            <span>Teléfono</span>
            <input type="text" name="telefono" defaultValue={club.telefono ?? ""} className="input" />
          </label>

          <label className="label">
            <span>Email de contacto</span>
            <input type="email" name="email_contacto" defaultValue={club.email_contacto ?? ""} className="input" />
          </label>

          <label className="label">
            <span>Website</span>
            <input type="text" name="website" defaultValue={club.website ?? ""} className="input" />
          </label>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Servicios
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="tiene_bar" defaultChecked={club.tiene_bar} />
            Tiene bar
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="tiene_estacionamiento" defaultChecked={club.tiene_estacionamiento} />
            Tiene estacionamiento
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="alquila_paletas" defaultChecked={club.alquila_paletas} />
            Alquila paletas
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="alquila_raquetas" defaultChecked={club.alquila_raquetas} />
            Alquila raquetas
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="tiene_vestuario" defaultChecked={club.tiene_vestuario} />
            Tiene vestuario
          </label>
          <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
            <input type="checkbox" name="tiene_parrilla" defaultChecked={club.tiene_parrilla} />
            Tiene parrilla
          </label>
        </div>
      </section>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
