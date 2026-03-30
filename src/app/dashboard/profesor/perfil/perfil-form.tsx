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
    <form action={formAction} className="mt-6 grid gap-5">
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Nombre</span>
        <input
          type="text"
          name="name"
          defaultValue={initialValues.name}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Deporte</span>
        <select
          name="sport"
          defaultValue={initialValues.sport}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
        >
          <option value="tenis">Tenis</option>
          <option value="padel">Padel</option>
          <option value="ambos">Ambos</option>
        </select>
      </label>

      <ZonaSelector
        defaultProvincia={initialValues.provincia}
        defaultMunicipio={initialValues.municipio}
      />

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>
          Username{" "}
          <span className="font-normal text-zinc-500">(opcional)</span>
        </span>
        <span className="text-xs font-normal text-zinc-500">
          Se usará para tu link público que compartís con alumnos. Solo letras, números y guiones bajos.
        </span>
        <input
          type="text"
          name="username"
          defaultValue={initialValues.username}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="ej: profe_juan"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>
          Bio{" "}
          <span className="font-normal text-zinc-500">(opcional)</span>
        </span>
        <textarea
          name="bio"
          defaultValue={initialValues.bio}
          rows={3}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20"
          placeholder="Contanos brevemente sobre vos"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
