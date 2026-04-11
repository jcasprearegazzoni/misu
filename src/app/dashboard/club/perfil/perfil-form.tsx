"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { CurrentClub } from "@/lib/auth/get-current-club";
import { ZonaSelector } from "@/components/zona-selector";
import { getLocalidadesByMunicipio } from "@/lib/geo/argentina";
import { updateClubPerfilAction } from "./actions";

type ClubPerfilFormProps = {
  club: CurrentClub;
  configuracion: { confirmacion_automatica: boolean; cancelacion_horas_limite: number };
  successMessage?: string | null;
  returnTo?: string;
};

export function ClubPerfilForm({ club, configuracion, successMessage, returnTo }: ClubPerfilFormProps) {
  const [state, formAction, isPending] = useActionState(updateClubPerfilAction, {
    error: null,
    success: null,
  });
  const [visibleSuccess, setVisibleSuccess] = useState<string | null>(successMessage ?? null);
  const [provincia, setProvincia] = useState(club.provincia ?? "");
  const [municipio, setMunicipio] = useState(club.municipio ?? "");
  const [localidad, setLocalidad] = useState(club.localidad ?? "");
  const [confirmacionAutomatica, setConfirmacionAutomatica] = useState(configuracion.confirmacion_automatica);

  const localidadesDisponibles = useMemo(
    () => (provincia && municipio ? getLocalidadesByMunicipio(provincia, municipio) : []),
    [provincia, municipio],
  );
  const [cancelacionHorasLimite, setCancelacionHorasLimite] = useState(String(configuracion.cancelacion_horas_limite));

  const usernamePreview = useMemo(() => club.username ?? "usuario", [club.username]);

  useEffect(() => {
    setVisibleSuccess(successMessage ?? null);

    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setVisibleSuccess(null);
    }, 3000);

    const url = new URL(window.location.href);
    if (url.searchParams.has("updated")) {
      url.searchParams.delete("updated");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  return (
    <form action={formAction} className="grid gap-6">
      <input type="hidden" name="next" value={returnTo ?? "/dashboard/club/ajustes?section=perfil"} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-4">
          <label className="label">
            <span>Nombre del club</span>
            <input type="text" name="nombre" defaultValue={club.nombre} className="input" required />
            <small style={{ color: "var(--muted)" }}>
              URL de perfil publico: <strong>misu.app/clubes/{usernamePreview}</strong>
            </small>
          </label>

          <label className="label">
            <span>Direccion</span>
            <input type="text" name="direccion" defaultValue={club.direccion ?? ""} className="input" />
          </label>

          <ZonaSelector
            provincia={provincia}
            municipio={municipio}
            onProvinciaChange={setProvincia}
            onMunicipioChange={(m) => { setMunicipio(m); setLocalidad(""); }}
          />

          {provincia && provincia !== "caba" && municipio && localidadesDisponibles.length > 0 ? (
            <label className="label">
              <span>Localidad</span>
              <select
                name="localidad"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                className="select"
              >
                <option value="">Seleccioná una localidad</option>
                {localidadesDisponibles.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="localidad" value={localidad} />
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              <span>Telefono</span>
              <input type="text" name="telefono" defaultValue={club.telefono ?? ""} className="input" />
            </label>
            <label className="label">
              <span>Email de contacto</span>
              <input type="email" name="email_contacto" defaultValue={club.email_contacto ?? ""} className="input" />
            </label>
          </div>

          <input type="hidden" name="website" value={club.website ?? ""} />
        </div>

        <div className="grid content-start gap-5">
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Deportes
            </h3>
            <div className="mt-3 grid gap-2">
              {[
                { name: "tiene_tenis", label: "Tenis", checked: club.tiene_tenis },
                { name: "tiene_padel", label: "Padel", checked: club.tiene_padel },
                { name: "tiene_futbol", label: "Futbol", checked: club.tiene_futbol },
              ].map((item) => (
                <label key={item.name} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked={item.checked}
                    className="h-4 w-4 rounded accent-[var(--misu)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Servicios
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { name: "tiene_bar", label: "Bar", checked: club.tiene_bar },
                { name: "tiene_estacionamiento", label: "Estacionamiento", checked: club.tiene_estacionamiento },
                { name: "tiene_vestuario", label: "Vestuario", checked: club.tiene_vestuario },
                { name: "tiene_parrilla", label: "Parrilla", checked: club.tiene_parrilla },
                { name: "alquila_paletas", label: "Alquila paletas", checked: club.alquila_paletas },
                { name: "alquila_raquetas", label: "Alquila raquetas", checked: club.alquila_raquetas },
              ].map((item) => (
                <label key={item.name} className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                  <input
                    type="checkbox"
                    name={item.name}
                    defaultChecked={item.checked}
                    className="h-4 w-4 rounded accent-[var(--misu)]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Operacion
            </h3>

            <div className="mt-3 grid gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    Confirmacion automatica
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                    Las reservas se confirman sin aprobacion manual.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={confirmacionAutomatica}
                  onClick={() => setConfirmacionAutomatica((prev) => !prev)}
                  className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200"
                  style={{
                    background: confirmacionAutomatica ? "var(--success)" : "var(--surface-1)",
                    borderColor: confirmacionAutomatica ? "var(--success)" : "var(--border)",
                  }}
                >
                  <span
                    className="inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: confirmacionAutomatica ? "translateX(24px)" : "translateX(2px)" }}
                  />
                </button>
                {confirmacionAutomatica ? <input type="hidden" name="confirmacion_automatica" value="on" /> : null}
              </div>

              <div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Cancelacion anticipada
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    name="cancelacion_horas_limite"
                    min={0}
                    max={168}
                    value={cancelacionHorasLimite}
                    onChange={(e) => setCancelacionHorasLimite(e.target.value)}
                    className="input h-9 min-w-[3.5rem] text-center font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    style={{
                      MozAppearance: "textfield",
                      width: `${Math.max(2, cancelacionHorasLimite.length || 1) + 2}ch`,
                    }}
                  />
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    horas antes
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  Los alumnos pueden cancelar hasta ese tiempo antes del inicio.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {visibleSuccess ? <p className="alert-success">{visibleSuccess}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
