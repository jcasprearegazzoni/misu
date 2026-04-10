"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  abandonarClubAction,
  createPlaceholderClubAction,
  deleteClubAction,
  type ClubActionState,
  updateClubCostAction,
  updatePlaceholderClubAction,
} from "./club-actions";

type Club = {
  id: number;
  nombre: string;
  direccion: string | null;
  deporte: "tenis" | "padel" | "ambos";
  is_placeholder: boolean;
  court_cost_mode: "fixed_per_hour" | "per_student_percentage";
  court_cost_per_hour: number | null;
  court_percentage_per_student: number | null;
  cp_status: "pendiente" | "activo" | "inactivo";
};

type ClubsManagerProps = {
  clubs: Club[];
};

const initialActionState: ClubActionState = {
  error: null,
  success: null,
};

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Sin definir";
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatModeLabel(club: Club) {
  if (club.court_cost_mode === "fixed_per_hour") {
    return `Cancha por hora: ${formatCurrency(club.court_cost_per_hour)}`;
  }

  return `% por alumno: ${club.court_percentage_per_student ?? 0}%`;
}

function getStatusLabel(status: Club["cp_status"]) {
  if (status === "pendiente") {
    return "Pendiente";
  }

  if (status === "inactivo") {
    return "Inactivo";
  }

  return "Activo";
}

function PlaceholderClubFields({
  defaultValues,
  disabled,
}: {
  defaultValues: {
    nombre: string;
    direccion: string;
  };
  disabled: boolean;
}) {
  return (
    <>
      <label className="label">
        <span>Nombre del club</span>
        <input
          type="text"
          name="nombre"
          defaultValue={defaultValues.nombre}
          className="input"
          placeholder="Ej: Club del Lago"
          required
          disabled={disabled}
        />
      </label>

      <label className="label">
        <span>
          Dirección <span style={{ color: "var(--muted-2)", fontWeight: 400 }}>(opcional)</span>
        </span>
        <input
          type="text"
          name="direccion"
          defaultValue={defaultValues.direccion}
          className="input"
          placeholder="Ej: Av. del Libertador 1234"
          disabled={disabled}
        />
      </label>

    </>
  );
}

function ClubCostFields({
  defaultMode,
  defaultPerHour,
  defaultPercentage,
  disabled,
}: {
  defaultMode: "fixed_per_hour" | "per_student_percentage";
  defaultPerHour: number | null;
  defaultPercentage: number | null;
  disabled: boolean;
}) {
  const [mode, setMode] = useState(defaultMode);
  return (
    <>
      <label className="label">
        <span>Modalidad de cobro de cancha</span>
        <select
          name="court_cost_mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className="select"
          disabled={disabled}
        >
          <option value="fixed_per_hour">Costo fijo por hora</option>
          <option value="per_student_percentage">Porcentaje por alumno</option>
        </select>
      </label>
      {mode === "fixed_per_hour" ? (
        <label className="label">
          <span>Costo de cancha por hora ($)</span>
          <input
            type="number"
            name="court_cost_per_hour"
            defaultValue={defaultPerHour ?? ""}
            min="0"
            step="0.01"
            className="input"
            placeholder="Ej: 8000"
            disabled={disabled}
          />
        </label>
      ) : (
        <label className="label">
          <span>Porcentaje por alumno (%)</span>
          <input
            type="number"
            name="court_percentage_per_student"
            defaultValue={defaultPercentage ?? ""}
            min="0"
            max="100"
            step="0.1"
            className="input"
            placeholder="Ej: 30"
            disabled={disabled}
          />
        </label>
      )}
    </>
  );
}

function CreateClubForm() {
  const [state, formAction, isPending] = useActionState(createPlaceholderClubAction, initialActionState);

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <PlaceholderClubFields
        defaultValues={{
          nombre: "",
          direccion: "",
        }}
        disabled={isPending}
      />

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Agregar club"}
        </button>
      </div>
    </form>
  );
}

function PlaceholderClubEditor({ club }: { club: Club }) {
  const [state, formAction, isPending] = useActionState(updatePlaceholderClubAction, initialActionState);

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <input type="hidden" name="club_id" value={club.id} />

      <div>
        <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Datos del club
        </h4>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
          Como es un placeholder creado por vos, podés editar su nombre y dirección.
        </p>
      </div>

      <PlaceholderClubFields
        defaultValues={{
          nombre: club.nombre,
          direccion: club.direccion ?? "",
        }}
        disabled={isPending}
      />

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-secondary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar datos del club"}
        </button>
      </div>
    </form>
  );
}

function ClubCostEditor({
  club,
  onSaved,
}: {
  club: Club;
  onSaved: (mode: Club["court_cost_mode"], perHour: number | null, percentage: number | null) => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ClubActionState, formData: FormData) => {
      const result = await updateClubCostAction(prev, formData);
      if (!result.error) {
        const newMode = formData.get("court_cost_mode") as Club["court_cost_mode"];
        const perHour = newMode === "fixed_per_hour" ? Number(formData.get("court_cost_per_hour")) || null : null;
        const pct = newMode === "per_student_percentage" ? Number(formData.get("court_percentage_per_student")) || null : null;
        onSaved(newMode, perHour, pct);
      }
      return result;
    },
    initialActionState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
      <input type="hidden" name="club_id" value={club.id} />

      <div>
        <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Costos de cancha
        </h4>
        <p className="mt-1 text-xs" style={{ color: "var(--muted-2)" }}>
          Estos costos son propios de tu relación con este club.
        </p>
      </div>

      <ClubCostFields
        defaultMode={club.court_cost_mode}
        defaultPerHour={club.court_cost_per_hour}
        defaultPercentage={club.court_percentage_per_student}
        disabled={isPending}
      />

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-secondary w-full justify-center sm:w-auto disabled:opacity-60">
          {isPending ? "Guardando..." : "Guardar costo"}
        </button>
      </div>
    </form>
  );
}

function AbandonarClubButton({ clubId, clubNombre }: { clubId: number; clubNombre: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(abandonarClubAction, initialActionState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="club_id" value={clubId} />
      <button
        type="submit"
        disabled={isPending}
        className="btn-ghost"
        style={{ color: "var(--error)" }}
        onClick={(event) => {
          if (!window.confirm(`¿Querés abandonar el club "${clubNombre}"?`)) {
            event.preventDefault();
          }
        }}
      >
        {isPending ? "..." : "Abandonar"}
      </button>
      {state.error ? <p className="alert-error mt-1 text-xs">{state.error}</p> : null}
    </form>
  );
}

function ClubCard({ club }: { club: Club }) {
  const [isEditing, setIsEditing] = useState(false);
  const pillStyle =
    club.cp_status === "activo"
      ? { background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)" }
      : club.cp_status === "pendiente"
        ? { background: "var(--warning-bg)", color: "var(--warning)" }
        : { background: "var(--muted-2)", color: "var(--muted)" };
  // Costo local para reflejar cambios sin esperar rerender del server.
  const [localCost, setLocalCost] = useState({
    court_cost_mode: club.court_cost_mode,
    court_cost_per_hour: club.court_cost_per_hour,
    court_percentage_per_student: club.court_percentage_per_student,
  });
  const displayClub = { ...club, ...localCost };

  return (
    <article className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {club.nombre}
            </h3>
            <span
              className="pill"
              style={pillStyle}
            >
              {getStatusLabel(club.cp_status)}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {club.direccion?.trim() ? club.direccion : "Sin dirección cargada"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: "var(--muted-2)" }}>
            <span className="rounded-full border px-2 py-1" style={{ borderColor: "var(--border)" }}>
              {formatModeLabel(displayClub)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary" onClick={() => setIsEditing((value) => !value)}>
            {isEditing ? "Cerrar edición" : "Editar"}
          </button>
          {club.is_placeholder ? (
            <form action={deleteClubAction}>
              <input type="hidden" name="club_id" value={club.id} />
              <button
                type="submit"
                className="btn-ghost"
                style={{ color: "var(--error)" }}
                onClick={(event) => {
                  if (!window.confirm(`¿Querés eliminar el club "${club.nombre}"?`)) {
                    event.preventDefault();
                  }
                }}
              >
                Eliminar
              </button>
            </form>
          ) : (
            <AbandonarClubButton clubId={club.id} clubNombre={club.nombre} />
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-4 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          {club.is_placeholder ? <PlaceholderClubEditor club={club} /> : null}
          <ClubCostEditor
            key={`${localCost.court_cost_mode}-${localCost.court_cost_per_hour}-${localCost.court_percentage_per_student}`}
            club={displayClub}
            onSaved={(mode, perHour, pct) =>
              setLocalCost({ court_cost_mode: mode, court_cost_per_hour: perHour, court_percentage_per_student: pct })
            }
          />
        </div>
      ) : null}
    </article>
  );
}

export function ClubsManager({ clubs }: ClubsManagerProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="mt-4 grid gap-4">
      <div className="grid gap-3">
        {clubs.length === 0 ? (
          <div className="alert-info">
            Todavía no tenés clubes asociados. Agregá el primero para poder usarlo en disponibilidad.
          </div>
        ) : (
          clubs.map((club) => <ClubCard key={club.id} club={club} />)
        )}
      </div>

      {!isCreating ? (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors"
          style={{ borderColor: "var(--border-hover)", color: "var(--muted)" }}
        >
          <span>+</span>
          <span>Agregar club</span>
        </button>
      ) : (
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Nuevo club
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs"
              style={{ color: "var(--muted)" }}
            >
              Cancelar
            </button>
          </div>
          <CreateClubForm />
        </div>
      )}
    </div>
  );
}
