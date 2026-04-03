"use client";

import { useActionState, useState } from "react";
import { ZonaSelector } from "@/components/zona-selector";
import { saveAlumnoProfileAction } from "./actions";

type AlumnoPerfilFormProps = {
  redirectTo?: string | null;
  successMessage?: string | null;
  initialValues: {
    name: string;
    sport: "tenis" | "padel" | "ambos";
    category_padel:
      | "Principiante"
      | "8va"
      | "7ma"
      | "6ta"
      | "5ta"
      | "4ta"
      | "3ra"
      | "2da"
      | "1ra"
      | null;
    category_tenis: "Principiante" | "Intermedio" | "Avanzado" | null;
    branch: "Caballero" | "Dama";
    provincia: string;
    municipio: string;
    has_paleta: boolean;
    has_raqueta: boolean;
  };
};

export function AlumnoPerfilForm({ initialValues, redirectTo, successMessage }: AlumnoPerfilFormProps) {
  const [state, formAction, isPending] = useActionState(saveAlumnoProfileAction, {
    error: null,
    success: null,
  });
  const [sport, setSport] = useState<"tenis" | "padel" | "ambos">(initialValues.sport);
  const [clientError, setClientError] = useState<string | null>(null);

  const visibleSuccessMessage = !clientError && !state.error ? successMessage : null;

  return (
    <form
      action={formAction}
      className="grid gap-4"
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);
        const categoryPadel = formData.get("category_padel");
        const categoryTenis = formData.get("category_tenis");

        if ((sport === "padel" || sport === "ambos") && !categoryPadel) {
          event.preventDefault();
          setClientError("Seleccioná tu categoría de pádel.");
          return;
        }

        if ((sport === "tenis" || sport === "ambos") && !categoryTenis) {
          event.preventDefault();
          setClientError("Seleccioná tu categoría de tenis.");
          return;
        }

        setClientError(null);
      }}
    >
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}

      <label className="label">
        <span>Nombre</span>
        <input type="text" name="name" defaultValue={initialValues.name} className="input" required />
      </label>

      <label className="label">
        <span>Rama</span>
        <select name="branch" defaultValue={initialValues.branch} className="select">
          <option value="Caballero">Caballero</option>
          <option value="Dama">Dama</option>
        </select>
      </label>

      <label className="label">
        <span>Deporte</span>
        <select
          name="sport"
          value={sport}
          onChange={(event) => {
            setSport(event.target.value as "tenis" | "padel" | "ambos");
            setClientError(null);
          }}
          className="select"
        >
          <option value="tenis">Tenis</option>
          <option value="padel">Pádel</option>
          <option value="ambos">Tenis y Pádel</option>
        </select>
      </label>

      {sport === "padel" || sport === "ambos" ? (
        <label className="label">
          <span>Categoría pádel</span>
          <select
            name="category_padel"
            defaultValue={initialValues.category_padel ?? ""}
            className="select"
            onChange={() => setClientError(null)}
          >
            <option value="" disabled hidden>
              Seleccioná una categoría
            </option>
            <option value="Principiante">Principiante</option>
            <option value="8va">8va</option>
            <option value="7ma">7ma</option>
            <option value="6ta">6ta</option>
            <option value="5ta">5ta</option>
            <option value="4ta">4ta</option>
            <option value="3ra">3ra</option>
            <option value="2da">2da</option>
            <option value="1ra">1ra</option>
          </select>
        </label>
      ) : null}

      {sport === "tenis" || sport === "ambos" ? (
        <label className="label">
          <span>Categoría tenis</span>
          <select
            name="category_tenis"
            defaultValue={initialValues.category_tenis ?? ""}
            className="select"
            onChange={() => setClientError(null)}
          >
            <option value="" disabled hidden>
              Seleccioná una categoría
            </option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </label>
      ) : null}

      <ZonaSelector defaultProvincia={initialValues.provincia} defaultMunicipio={initialValues.municipio} />

      {sport === "padel" || sport === "ambos" ? (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <input
            type="checkbox"
            name="has_paleta"
            defaultChecked={initialValues.has_paleta}
            className="mt-0.5 h-4 w-4 rounded accent-orange-500"
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tengo paleta propia
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              El profesor podrá ver este dato al revisar tu perfil.
            </p>
          </div>
        </label>
      ) : null}

      {sport === "tenis" || sport === "ambos" ? (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <input
            type="checkbox"
            name="has_raqueta"
            defaultChecked={initialValues.has_raqueta}
            className="mt-0.5 h-4 w-4 rounded accent-orange-500"
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tengo raqueta propia
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              El profesor podrá ver este dato al revisar tu perfil.
            </p>
          </div>
        </label>
      ) : null}

      {clientError ? <p className="alert-error">{clientError}</p> : null}
      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {visibleSuccessMessage ? <p className="alert-success">{visibleSuccessMessage}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}
