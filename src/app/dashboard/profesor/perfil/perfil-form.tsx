"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ZonaSelector } from "@/components/zona-selector";
import { getLocalidadesByMunicipio } from "@/lib/geo/argentina";
import { saveProfesorProfileAction } from "./actions";

type PerfilFormProps = {
  successMessage?: string | null;
  initialValues: {
    name: string;
    username: string;
    bio: string;
    sport: "tenis" | "padel" | "ambos";
    provincia: string;
    municipio: string;
    localidad: string;
  };
};

export function PerfilForm({ initialValues, successMessage }: PerfilFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorProfileAction, {
    error: null,
    success: null,
  });

  // Estado controlado para provincia y municipio
  const [provincia, setProvincia] = useState(initialValues.provincia);
  const [municipio, setMunicipio] = useState(initialValues.municipio);
  const [localidad, setLocalidad] = useState(initialValues.localidad);

  const localidadesDisponibles = useMemo(
    () => (provincia && municipio ? getLocalidadesByMunicipio(provincia, municipio) : []),
    [provincia, municipio],
  );

  useEffect(() => {
    setProvincia(initialValues.provincia);
    setMunicipio(initialValues.municipio);
    setLocalidad(initialValues.localidad);
  }, [initialValues.localidad, initialValues.municipio, initialValues.provincia]);

  return (
    <form action={formAction} className="mt-4 grid gap-6">
      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="label">
              <span>Nombre</span>
              <input type="text" name="name" defaultValue={initialValues.name} className="input" required />
            </label>
            <small style={{ color: "var(--muted-2)" }}>
              URL y username:{" "}
              {initialValues.username ? (
                <>
                  misu.app/p/<strong>{initialValues.username}</strong>
                </>
              ) : (
                "se generara automaticamente al guardar"
              )}
            </small>
          </div>

          <label className="label">
            <span>Deporte</span>
            <select name="sport" defaultValue={initialValues.sport} className="select">
              <option value="tenis">Tenis</option>
              <option value="padel">Padel</option>
              <option value="ambos">Ambos</option>
            </select>
          </label>
        </div>

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

        <label className="label">
          <span>
            Bio <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(opcional)</span>
          </span>
          <textarea
            name="bio"
            defaultValue={initialValues.bio}
            rows={4}
            className="input"
            placeholder="Conta brevemente sobre vos"
          />
        </label>
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {successMessage ? <p className="alert-success">{successMessage}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}

