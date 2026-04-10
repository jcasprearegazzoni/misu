"use client";

import { useActionState, useEffect, useState } from "react";
import { ZonaSelector } from "@/components/zona-selector";
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

  useEffect(() => {
    setProvincia(initialValues.provincia);
    setMunicipio(initialValues.municipio);
    setLocalidad(initialValues.localidad);
  }, [initialValues.localidad, initialValues.municipio, initialValues.provincia]);

  return (
    <form action={formAction} className="mt-4 grid gap-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_300px] lg:items-start">
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              <span>Nombre</span>
              <input type="text" name="name" defaultValue={initialValues.name} className="input" required />
            </label>
            <label className="label">
              <span>Deporte</span>
              <select name="sport" defaultValue={initialValues.sport} className="select">
                <option value="tenis">Tenis</option>
                <option value="padel">Pádel</option>
                <option value="ambos">Ambos</option>
              </select>
            </label>
          </div>

          <ZonaSelector
            provincia={provincia}
            municipio={municipio}
            onProvinciaChange={setProvincia}
            onMunicipioChange={setMunicipio}
          />

          {provincia !== "caba" ? (
            <label className="label">
              <span>Localidad</span>
              <input
                type="text"
                name="localidad"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Ej: Palermo, San Isidro..."
                className="input"
              />
            </label>
          ) : null}
        </div>

        <div className="grid content-start gap-4">
          {initialValues.username ? (
            <div className="label">
              <span>Username</span>
              <p className="input" style={{ color: "var(--muted)", cursor: "default", userSelect: "all" }}>
                {initialValues.username}
              </p>
              <small style={{ color: "var(--muted-2)" }}>
                URL pública: misu.app/p/<strong>{initialValues.username}</strong>
              </small>
            </div>
          ) : (
            <div className="label">
              <span>Username</span>
              <p className="input" style={{ color: "var(--muted-2)", cursor: "default" }}>
                Se generará automáticamente al guardar.
              </p>
            </div>
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
              placeholder="Contá brevemente sobre vos"
            />
          </label>
        </div>
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
