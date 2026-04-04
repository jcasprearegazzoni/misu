"use client";

import { useActionState } from "react";
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
  };
};

export function PerfilForm({ initialValues, successMessage }: PerfilFormProps) {
  const [state, formAction, isPending] = useActionState(saveProfesorProfileAction, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <label className="label">
        <span>Nombre</span>
        <input
          type="text"
          name="name"
          defaultValue={initialValues.name}
          className="input"
          required
        />
      </label>

      <label className="label">
        <span>Deporte</span>
        <select name="sport" defaultValue={initialValues.sport} className="select">
          <option value="tenis">Tenis</option>
          <option value="padel">Pádel</option>
          <option value="ambos">Ambos</option>
        </select>
      </label>

      <ZonaSelector defaultProvincia={initialValues.provincia} defaultMunicipio={initialValues.municipio} />

      <label className="label">
        <span>Username</span>
        <input
          type="text"
          name="username"
          defaultValue={initialValues.username}
          className="input"
          placeholder={initialValues.username || "Se genera automáticamente"}
        />
        <small style={{ color: "var(--muted)" }}>
          Tu URL pública: misu.app/p/<strong>{initialValues.username || "usuario"}</strong>. Si lo dejás vacío se genera a partir del nombre.
        </small>
      </label>

      <label className="label">
        <span>
          Bio <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(opcional)</span>
        </span>
        <textarea
          name="bio"
          defaultValue={initialValues.bio}
          rows={3}
          className="input"
          placeholder="Contá brevemente sobre vos"
        />
      </label>

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
