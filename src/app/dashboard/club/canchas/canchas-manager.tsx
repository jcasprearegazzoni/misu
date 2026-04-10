"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  createCanchaAction,
  deleteCanchaAction,
  toggleCanchaActivaAction,
  updateCanchaAction,
  type CanchaActionState,
} from "./actions";

type Cancha = {
  id: number;
  club_id: number;
  nombre: string;
  deporte: "tenis" | "padel" | "futbol";
  pared: "blindex" | "muro" | "mixto" | null;
  superficie:
    | "sintetico"
    | "polvo_ladrillo"
    | "cemento"
    | "blindex"
    | "f5"
    | "f7"
    | "f8"
    | "f11";
  techada: boolean;
  iluminacion: boolean;
  activa: boolean;
};

type CanchasManagerProps = {
  canchas: Cancha[];
  clubId: number;
  compact?: boolean;
  filterDeporte?: "tenis" | "padel" | "futbol";
};

type CaracteristicaOption = {
  value: Cancha["superficie"];
  label: string;
};

const initialState: CanchaActionState = {
  error: null,
  success: null,
  invalidField: null,
};

function formatDeporte(value: Cancha["deporte"]) {
  if (value === "padel") return "Padel";
  if (value === "tenis") return "Tenis";
  if (value === "futbol") return "Fútbol";
  return "Sin dato";
}

function formatCaracteristica(value: Cancha["superficie"]) {
  if (value === "polvo_ladrillo") return "Polvo de ladrillo";
  if (value === "sintetico") return "Sintético";
  if (value === "cemento") return "Cemento";
  if (value === "blindex") return "Blindex";
  if (value === "f5") return "F5";
  if (value === "f7") return "F7";
  if (value === "f8") return "F8";
  if (value === "f11") return "F11";
  return "Sin dato";
}

function formatPared(value: Cancha["pared"]) {
  if (value === "blindex") return "Blindex";
  if (value === "muro") return "Muro";
  if (value === "mixto") return "Mixto";
  return "Sin pared";
}

function InfoPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "tenis" | "padel" | "futbol";
}) {
  const toneStyles =
    tone === "tenis"
      ? { background: "rgba(16, 185, 129, 0.12)", color: "var(--success)" }
      : tone === "padel"
        ? { background: "rgba(245, 158, 11, 0.15)", color: "var(--warning)" }
        : tone === "futbol"
          ? { background: "rgba(59, 130, 246, 0.15)", color: "var(--info)" }
          : { background: "transparent", color: "var(--muted)" };

  return (
    <span className="pill" style={toneStyles}>
      {label}
    </span>
  );
}

function CompactCheckbox({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 rounded border border-[var(--border)] bg-[var(--surface-1)] accent-orange-500"
      />
      <span>{label}</span>
    </label>
  );
}

function useCaracteristicasOptions(deporte: Cancha["deporte"]) {
  return useMemo<CaracteristicaOption[]>(() => {
    if (deporte === "padel") {
      return [
        { value: "cemento", label: "Cemento" },
        { value: "sintetico", label: "Sintético" },
      ];
    }
    if (deporte === "tenis") {
      return [
        { value: "polvo_ladrillo", label: "Polvo de ladrillo" },
        { value: "cemento", label: "Cemento" },
      ];
    }
    if (deporte === "futbol") {
      return [
        { value: "f5", label: "F5" },
        { value: "f7", label: "F7" },
        { value: "f8", label: "F8" },
        { value: "f11", label: "F11" },
      ];
    }
    return [{ value: "cemento", label: "Cemento" }];
  }, [deporte]);
}

type ParedSelectValue = NonNullable<Cancha["pared"]> | "";

function getNextAutoCourtName(
  deporte: Cancha["deporte"] | "",
  canchas: Array<Pick<Cancha, "nombre" | "deporte">>,
) {
  if (deporte === "") return "";
  const max = canchas.reduce((acc, cancha) => {
    if (cancha.deporte !== deporte) return acc;
    const match = /^cancha\s+(\d+)$/i.exec(cancha.nombre.trim());
    if (!match) return acc;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return acc;
    return value > acc ? value : acc;
  }, 0);
  return `Cancha ${max + 1}`;
}

function CreateCanchaForm({
  existingCanchas,
  onSuccess,
}: {
  existingCanchas: Cancha[];
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createCanchaAction, initialState);
  const [nombre, setNombre] = useState("");
  const [deporte, setDeporte] = useState<Cancha["deporte"] | "">("");
  const [autoName, setAutoName] = useState(true);
  const caracteristicas = useCaracteristicasOptions(deporte === "" ? "tenis" : deporte);
  const [superficie, setSuperficie] = useState<Cancha["superficie"] | "">("");
  const [pared, setPared] = useState<ParedSelectValue>("");
  const [techada, setTechada] = useState(false);
  const [iluminacion, setIluminacion] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const autoNamePreview = useMemo(
    () => getNextAutoCourtName(deporte, existingCanchas),
    [deporte, existingCanchas],
  );

  useEffect(() => {
    if (state.invalidField === "nombre") setNombre("");
    if (state.invalidField === "superficie") {
      setSuperficie(deporte === "padel" ? "" : (caracteristicas[0]?.value ?? "cemento"));
    }
    if (state.invalidField === "pared" && deporte === "padel") {
      setPared("");
    }
  }, [state.invalidField, caracteristicas, deporte]);

  useEffect(() => {
    if (submitted && !isPending && !state.error) {
      setNombre("");
      setDeporte("");
      setAutoName(true);
      setSuperficie("");
      setPared("");
      setTechada(false);
      setIluminacion(false);
      setSubmitted(false);
      onSuccess?.();
    }
  }, [submitted, isPending, state.error, onSuccess]);

  return (
    <form action={formAction} className="mt-4 grid gap-4" onSubmit={() => setSubmitted(true)}>
      <CompactCheckbox
        name="nombre_auto"
        checked={autoName}
        onChange={() => setAutoName((prev) => !prev)}
        label="Crear con orden numerico automatico"
      />

      <label className="label">
        <span>Nombre</span>
        <input
          type="text"
          name="nombre"
          className="input"
          value={autoName ? autoNamePreview : nombre}
          onChange={(event) => setNombre(event.target.value)}
          readOnly={autoName}
          required={!autoName}
          placeholder={autoName ? "Seleccionar deporte" : undefined}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          <span>Deporte</span>
          <select
            name="deporte"
            className="select"
            value={deporte}
            onChange={(event) => {
              const next = event.target.value as Cancha["deporte"] | "";
              setDeporte(next);
              if (next === "") {
                setSuperficie("");
                return;
              }
              setSuperficie("");
              if (next === "padel") setPared("");
            }}
          >
            <option value="" disabled hidden>
              Seleccionar deporte
            </option>
            <option value="tenis">Tenis</option>
            <option value="padel">Padel</option>
            <option value="futbol">Fútbol</option>          </select>
        </label>

        {deporte === "padel" ? (
          <label className="label">
            <span>Pared</span>
            <select
              name="pared"
              className="select"
              value={pared}
              onChange={(event) => setPared(event.target.value as ParedSelectValue)}
            >
              <option value="" disabled hidden>
                Elegir muro
              </option>
              <option value="blindex">Blindex</option>
              <option value="muro">Muro</option>
              <option value="mixto">Mixto</option>
            </select>
          </label>
        ) : null}

        <label className="label">
          <span>Superficie</span>
          <select
            name="superficie"
            className="select"
            value={superficie}
            onChange={(event) => setSuperficie(event.target.value as Cancha["superficie"])}
            disabled={deporte === ""}
          >
            <option value="" disabled hidden>
              Elegir superficie
            </option>
            {caracteristicas.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CompactCheckbox name="techada" checked={techada} onChange={() => setTechada(!techada)} label="Techada" />
        <CompactCheckbox
          name="iluminacion"
          checked={iluminacion}
          onChange={() => setIluminacion(!iluminacion)}
          label="Iluminación"
        />
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-primary w-full justify-center sm:w-auto">
          {isPending ? "Guardando" : "Agregar cancha"}
        </button>
      </div>
    </form>
  );
}

function EditCanchaForm({ cancha }: { cancha: Cancha }) {
  const [state, formAction, isPending] = useActionState(updateCanchaAction, initialState);
  const [nombre, setNombre] = useState(cancha.nombre);
  const [deporte, setDeporte] = useState<Cancha["deporte"]>(cancha.deporte);
  const caracteristicas = useCaracteristicasOptions(deporte);
  const [superficie, setSuperficie] = useState<Cancha["superficie"] | "">(cancha.superficie);
  const [pared, setPared] = useState<ParedSelectValue>(cancha.pared ?? "");
  const [techada, setTechada] = useState(cancha.techada);
  const [iluminacion, setIluminacion] = useState(cancha.iluminacion);

  useEffect(() => {
    if (state.invalidField === "nombre") setNombre("");
    if (state.invalidField === "superficie") {
      setSuperficie(deporte === "padel" ? "" : (caracteristicas[0]?.value ?? "cemento"));
    }
    if (state.invalidField === "pared" && deporte === "padel") {
      setPared("");
    }
  }, [state.invalidField, caracteristicas, deporte]);

  return (
    <form action={formAction} className="mt-4 grid gap-4">
      <input type="hidden" name="cancha_id" value={cancha.id} />
      <label className="label">
        <span>Nombre</span>
        <input
          type="text"
          name="nombre"
          className="input"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          <span>Deporte</span>
          <select
            name="deporte"
            className="select"
            value={deporte}
            onChange={(event) => {
              const next = event.target.value as Cancha["deporte"];
              setDeporte(next);
              setSuperficie("");
              if (next === "padel") setPared("");
            }}
          >
            <option value="tenis">Tenis</option>
            <option value="padel">Padel</option>
            <option value="futbol">Fútbol</option>          </select>
        </label>

        {deporte === "padel" ? (
          <label className="label">
            <span>Pared</span>
            <select
              name="pared"
              className="select"
              value={pared}
              onChange={(event) => setPared(event.target.value as ParedSelectValue)}
            >
              <option value="" disabled hidden>
                Elegir muro
              </option>
              <option value="blindex">Blindex</option>
              <option value="muro">Muro</option>
              <option value="mixto">Mixto</option>
            </select>
          </label>
        ) : null}

        <label className="label">
          <span>Superficie</span>
          <select
            name="superficie"
            className="select"
            value={superficie}
            onChange={(event) => setSuperficie(event.target.value as Cancha["superficie"])}
          >
            <option value="" disabled hidden>
              Elegir superficie
            </option>
            {caracteristicas.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <CompactCheckbox name="techada" checked={techada} onChange={() => setTechada(!techada)} label="Techada" />
        <CompactCheckbox
          name="iluminacion"
          checked={iluminacion}
          onChange={() => setIluminacion(!iluminacion)}
          label="Iluminación"
        />
      </div>

      {state.error ? <p className="alert-error">{state.error}</p> : null}
      {state.success ? <p className="alert-success">{state.success}</p> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="btn-secondary w-full justify-center sm:w-auto">
          {isPending ? "Guardando" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function CanchaCard({
  cancha,
  showSport,
  compact = false,
  sportBorderColor,
}: {
  cancha: Cancha;
  showSport: boolean;
  compact?: boolean;
  sportBorderColor?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const actionTone = cancha.activa ? "text-[var(--foreground)]" : "text-[var(--muted)]";
  const confirmDelete = () =>
    window.confirm("¿Querés eliminar esta cancha? Esta acción no se puede deshacer.");
  const confirmToggle = () =>
    window.confirm(
      cancha.activa ? "¿Querés desactivar esta cancha?" : "¿Querés activar esta cancha?",
    );
  const inactiveStyles = !cancha.activa
    ? { opacity: 0.8, filter: "saturate(0.85)" }
    : undefined;

  if (compact) {
    return (
      <>
        <article
          className="min-w-0 h-[168px] rounded-xl border p-2.5"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", ...inactiveStyles }}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-2">
              <h3 className="line-clamp-2 text-base font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
                {cancha.nombre}
              </h3>
              <span className="text-sm font-medium" style={{ color: cancha.activa ? "var(--success)" : "var(--muted)" }}>
                {cancha.activa ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-1">
              {showSport ? (
                <span className="rounded-full border px-2 py-0.5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  {formatDeporte(cancha.deporte)}
                </span>
              ) : null}
              {cancha.deporte === "padel" ? (
                <span className="rounded-full border px-2 py-0.5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                  {formatPared(cancha.pared)}
                </span>
              ) : null}
              <span className="rounded-full border px-2 py-0.5 text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                {formatCaracteristica(cancha.superficie)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap gap-1 text-sm" style={{ color: "var(--muted)" }}>
              <span>{cancha.techada ? "Techada" : "Sin techo"}</span>
              <span>·</span>
              <span>{cancha.iluminacion ? "Iluminación" : "Sin luz"}</span>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 pt-1.5">
              <button
                type="button"
                aria-label={isEditing ? "Cerrar edición" : "Editar cancha"}
                title={isEditing ? "Cerrar edición" : "Editar cancha"}
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 ${actionTone}`}
                style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
                onClick={() => setIsEditing((prev) => !prev)}
              >
                <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  {isEditing ? (
                    <path
                      fillRule="evenodd"
                      d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.26l-3 1a.75.75 0 0 1-.95-.95l1-3a1 1 0 0 1 .26-.44l8.5-8.5Z" />
                  )}
                </svg>
              </button>

              <form
                action={toggleCanchaActivaAction}
                onSubmit={(event) => (!confirmToggle() ? event.preventDefault() : undefined)}
              >
                <input type="hidden" name="cancha_id" value={cancha.id} />
                <input type="hidden" name="activa" value={String(cancha.activa)} />
                <button
                  type="submit"
                  aria-label={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
                  title={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                  style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    {cancha.activa ? (
                      <path
                        fillRule="evenodd"
                        d="M4.5 10a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 4.5 10Z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 4.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4A.75.75 0 0 1 10 4.5Z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                </button>
              </form>

              <form action={deleteCanchaAction} onSubmit={(event) => (!confirmDelete() ? event.preventDefault() : undefined)}>
                <input type="hidden" name="cancha_id" value={cancha.id} />
                <button
                  type="submit"
                  aria-label="Eliminar cancha"
                  title="Eliminar cancha"
                  className="flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                  style={{ borderColor: "var(--border)", color: "var(--error)", background: "var(--surface-1)" }}
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.5 2.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4h4a.75.75 0 0 1 0 1.5h-.764l-.7 9.1A2 2 0 0 1 13.04 16.5H6.96a2 2 0 0 1-1.996-1.9l-.7-9.1H3.5a.75.75 0 0 1 0-1.5h4V2.75Zm1.5 1.25h2V3.5H9V4Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </article>

        {isEditing ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3"
            onClick={() => setIsEditing(false)}
          >
            <div
              className="w-full max-w-2xl rounded-xl border p-4 sm:p-5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Editar {cancha.nombre}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-2)" }}
                  aria-label="Cerrar edición"
                  title="Cerrar edición"
                >
                  <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <EditCanchaForm cancha={cancha} />
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <article
      className="min-w-0 rounded-xl border p-4"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface-2)",
        ...(sportBorderColor ? { borderLeft: `3px solid ${sportBorderColor}` } : {}),
        ...inactiveStyles,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold truncate" style={{ color: "var(--foreground)" }}>
            {cancha.nombre}
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {showSport ? <InfoPill label={formatDeporte(cancha.deporte)} tone={cancha.deporte} /> : null}
            {cancha.deporte === "padel" ? <InfoPill label={formatPared(cancha.pared)} /> : null}
            <InfoPill label={formatCaracteristica(cancha.superficie)} />
            {cancha.techada ? <InfoPill label="Techada" /> : null}
            {cancha.iluminacion ? <InfoPill label="Iluminación" /> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="pill"
            style={{
              background: cancha.activa ? "var(--success-bg)" : "var(--surface-2)",
              color: cancha.activa ? "var(--success)" : "var(--muted)",
              border: `1px solid ${cancha.activa ? "var(--success-border)" : "var(--border)"}`,
            }}
          >
            {cancha.activa ? "Activa" : "Inactiva"}
          </span>
          <form
            action={toggleCanchaActivaAction}
            onSubmit={(event) => (!confirmToggle() ? event.preventDefault() : undefined)}
          >
            <input type="hidden" name="cancha_id" value={cancha.id} />
            <input type="hidden" name="activa" value={String(cancha.activa)} />
            <button
              type="submit"
              aria-label={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
              title={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
              className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
              style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
            >
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                {cancha.activa ? (
                  <path
                    fillRule="evenodd"
                    d="M4.5 10a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 4.5 10Z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M10 4.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4A.75.75 0 0 1 10 4.5Z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          aria-label={isEditing ? "Cerrar edición" : "Editar cancha"}
          title={isEditing ? "Cerrar edición" : "Editar cancha"}
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95 ${actionTone}`}
          style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
          onClick={() => setIsEditing((prev) => !prev)}
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            {isEditing ? (
              <path
                fillRule="evenodd"
                d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.26l-3 1a.75.75 0 0 1-.95-.95l1-3a1 1 0 0 1 .26-.44l8.5-8.5Z" />
            )}
          </svg>
        </button>
        <form action={deleteCanchaAction} onSubmit={(event) => (!confirmDelete() ? event.preventDefault() : undefined)}>
          <input type="hidden" name="cancha_id" value={cancha.id} />
          <button
            type="submit"
            aria-label="Eliminar cancha"
            title="Eliminar cancha"
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
            style={{ borderColor: "var(--border)", color: "var(--error)", background: "var(--surface-1)" }}
          >
            <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M7.5 2.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4h4a.75.75 0 0 1 0 1.5h-.764l-.7 9.1A2 2 0 0 1 13.04 16.5H6.96a2 2 0 0 1-1.996-1.9l-.7-9.1H3.5a.75.75 0 0 1 0-1.5h4V2.75Zm1.5 1.25h2V3.5H9V4Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>

      {isEditing ? (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
          <EditCanchaForm cancha={cancha} />
        </div>
      ) : null}
    </article>
  );
}

export function CanchasManager({ canchas, compact = false, filterDeporte }: CanchasManagerProps) {
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [isAddingCancha, setIsAddingCancha] = useState(false);
  const grouped = useMemo(() => {
    const base = {
      tenis: [] as Cancha[],
      padel: [] as Cancha[],
      futbol: [] as Cancha[],
    };
    canchas.forEach((cancha) => {
      if (cancha.deporte === "tenis" || cancha.deporte === "padel" || cancha.deporte === "futbol") {
        base[cancha.deporte].push(cancha);
      }
    });
    return base;
  }, [canchas]);
  const displayList = filterDeporte ? canchas.filter((c) => c.deporte === filterDeporte) : null;
  const sportBorderColor =
    filterDeporte === "tenis"
      ? "rgba(34, 197, 94, 0.6)"
      : filterDeporte === "padel"
        ? "rgba(245, 158, 11, 0.6)"
        : filterDeporte === "futbol"
          ? "rgba(59, 130, 246, 0.6)"
          : undefined;

  return (
    <div className="grid gap-6">
      {filterDeporte ? (
        displayList!.length === 0 ? (
          <div className="alert-info">No hay canchas cargadas para este deporte.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ color: "var(--muted)" }}>
                  <th className="px-3 py-2 text-left font-medium">Cancha</th>
                  <th className="px-3 py-2 text-left font-medium">Superficie</th>
                  <th className="px-3 py-2 text-left font-medium">Pared</th>
                  <th className="px-3 py-2 text-left font-medium">Techo</th>
                  <th className="px-3 py-2 text-left font-medium">Iluminación</th>
                  <th className="px-3 py-2 text-left font-medium">Estado</th>
                  <th className="px-3 py-2 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayList!.map((cancha) => (
                  <tr key={cancha.id} className="border-t align-middle" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2 font-semibold" style={{ color: "var(--foreground)" }}>
                      {cancha.nombre}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--foreground)" }}>
                      {formatCaracteristica(cancha.superficie)}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--foreground)" }}>
                      {cancha.deporte === "padel" ? formatPared(cancha.pared) : "-"}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--foreground)" }}>
                      {cancha.techada ? "Techada" : "Sin techo"}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--foreground)" }}>
                      {cancha.iluminacion ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="pill text-xs"
                        style={{
                          background: cancha.activa ? "var(--success-bg)" : "var(--surface-1)",
                          color: cancha.activa ? "var(--success)" : "var(--muted)",
                          border: `1px solid ${cancha.activa ? "var(--success-border)" : "var(--border)"}`,
                        }}
                      >
                        {cancha.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          aria-label={editingRowId === cancha.id ? "Cerrar edición" : "Editar cancha"}
                          title={editingRowId === cancha.id ? "Cerrar edición" : "Editar cancha"}
                          className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                          style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-1)" }}
                          onClick={() => setEditingRowId((prev) => (prev === cancha.id ? null : cancha.id))}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a1 1 0 0 1-.44.26l-3 1a.75.75 0 0 1-.95-.95l1-3a1 1 0 0 1 .26-.44l8.5-8.5Z" />
                          </svg>
                        </button>
                        <form
                          action={toggleCanchaActivaAction}
                          onSubmit={(event) => {
                            if (!window.confirm(cancha.activa ? "¿Querés desactivar esta cancha?" : "¿Querés activar esta cancha?")) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="cancha_id" value={cancha.id} />
                          <input type="hidden" name="activa" value={String(cancha.activa)} />
                          <button
                            type="submit"
                            aria-label={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
                            title={cancha.activa ? "Desactivar cancha" : "Activar cancha"}
                            className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                            style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
                          >
                            <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              {cancha.activa ? (
                                <path
                                  fillRule="evenodd"
                                  d="M4.5 10a.75.75 0 0 1 .75-.75h9.5a.75.75 0 0 1 0 1.5h-9.5A.75.75 0 0 1 4.5 10Z"
                                  clipRule="evenodd"
                                />
                              ) : (
                                <path
                                  fillRule="evenodd"
                                  d="M10 4.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4A.75.75 0 0 1 10 4.5Z"
                                  clipRule="evenodd"
                                />
                              )}
                            </svg>
                          </button>
                        </form>
                        <form
                          action={deleteCanchaAction}
                          onSubmit={(event) => {
                            if (!window.confirm("¿Querés eliminar esta cancha? Esta acción no se puede deshacer.")) {
                              event.preventDefault();
                            }
                          }}
                        >
                          <input type="hidden" name="cancha_id" value={cancha.id} />
                          <button
                            type="submit"
                            aria-label="Eliminar cancha"
                            title="Eliminar cancha"
                            className="flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 hover:scale-105 hover:shadow-md active:scale-95"
                            style={{ borderColor: "var(--border)", color: "var(--error)", background: "var(--surface-1)" }}
                          >
                            <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M7.5 2.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75V4h4a.75.75 0 0 1 0 1.5h-.764l-.7 9.1A2 2 0 0 1 13.04 16.5H6.96a2 2 0 0 1-1.996-1.9l-.7-9.1H3.5a.75.75 0 0 1 0-1.5h4V2.75Zm1.5 1.25h2V3.5H9V4Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {editingRowId ? (
              (() => {
                const editingCancha = displayList!.find((item) => item.id === editingRowId);
                if (!editingCancha) return null;
                return (
                  <div className="border-t p-3" style={{ borderColor: "var(--border)" }}>
                    <EditCanchaForm cancha={editingCancha} />
                  </div>
                );
              })()
            ) : null}
          </div>
        )
      ) : canchas.length === 0 ? (
        <div className="alert-info">Todavía no cargaste canchas.</div>
      ) : (
        <div className="grid gap-4"> 
          {(["tenis", "padel", "futbol"] as const).map((sport) => {
            const list = grouped[sport];
            if (list.length === 0) return null;
            return (
              <div key={sport}>
                <div className="mb-3 flex items-center gap-3">
                  <InfoPill label={formatDeporte(sport)} tone={sport} />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {list.length} {list.length === 1 ? "cancha" : "canchas"}
                  </span>
                  <div className="flex-1 border-t" style={{ borderColor: "var(--border)" }} />
                </div>
                <div className={compact ? "grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7" : "grid gap-3"}>
                  {list.map((cancha) => (
                    <CanchaCard
                      key={cancha.id}
                      cancha={cancha}
                      showSport={false}
                      compact={compact}
                      sportBorderColor={sportBorderColor}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div>
        {isAddingCancha ? (
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Nueva cancha
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCancha(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-1)" }}
                aria-label="Cancelar"
              >
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <CreateCanchaForm existingCanchas={canchas} onSuccess={() => setIsAddingCancha(false)} />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCancha(true)}
            className="w-full rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            + Agregar cancha
          </button>
        )}
      </div>
    </div>
  );
}

