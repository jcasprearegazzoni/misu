"use client";

import { useActionState, useMemo, useState } from "react";
import type { ProgramActionState } from "./actions";

type ProgramFormProps = {
  action: (
    prevState: ProgramActionState,
    formData: FormData,
  ) => Promise<ProgramActionState>;
};

function estimarClases(fechaInicio: string, fechaFin: string, dias: number[]): number {
  if (!fechaInicio || !fechaFin || dias.length === 0) return 0;
  let count = 0;
  const start = new Date(fechaInicio);
  const end = new Date(fechaFin);
  const cur = new Date(start);
  while (cur <= end) {
    if (dias.includes(cur.getDay())) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

const DIAS: Array<{ value: number; label: string }> = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function ProgramForm({ action }: ProgramFormProps) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    success: null,
  });
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [diasSemana, setDiasSemana] = useState<number[]>([]);

  const estimado = useMemo(
    () => estimarClases(fechaInicio, fechaFin, diasSemana),
    [fechaInicio, fechaFin, diasSemana],
  );

  return (
    <form action={formAction} className="grid gap-3">
      <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
        Crear programa
      </h2>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Nombre</span>
        <input
          name="nombre"
          type="text"
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Descripción (opcional)</span>
        <textarea
          name="descripcion"
          className="min-h-20 rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
        />
      </label>

      <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
        <span>Categoría</span>
        <input
          name="categoria"
          type="text"
          placeholder="Ej: Pretemporada, Iniciación..."
          className="rounded-lg px-3 py-2 text-sm outline-none transition"
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--foreground)",
          }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Deporte</span>
          <select
            name="deporte"
            defaultValue="tenis"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          >
            <option value="tenis">Tenis</option>
            <option value="padel">Pádel</option>
            <option value="ambos">Ambos</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Nivel</span>
          <select
            name="nivel"
            defaultValue="libre"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          >
            <option value="libre">Libre</option>
            <option value="principiante">Principiante</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Tipo de clase</span>
          <select
            name="tipo_clase"
            defaultValue="individual"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          >
            <option value="individual">Individual</option>
            <option value="dobles">Dobles</option>
            <option value="trio">Trío</option>
            <option value="grupal">Grupal</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Visibilidad</span>
          <select
            name="visibilidad"
            defaultValue="privado"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          >
            <option value="privado">Privado</option>
            <option value="publico">Público</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Total clases</span>
          <input
            name="total_clases"
            type="number"
            min="1"
            step="1"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Precio</span>
          <input
            name="precio"
            type="number"
            min="0"
            step="0.01"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Cupo máximo (opcional)</span>
          <input
            name="cupo_max"
            type="number"
            min="1"
            step="1"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Fecha inicio</span>
          <input
            name="fecha_inicio"
            type="date"
            onChange={(event) => setFechaInicio(event.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Fecha fin</span>
          <input
            name="fecha_fin"
            type="date"
            onChange={(event) => setFechaFin(event.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
          Días de semana
        </p>
        <div className="flex flex-wrap gap-2">
          {DIAS.map((dia) => {
            const checked = diasSemana.includes(dia.value);
            return (
              <label
                key={dia.value}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: checked ? "var(--misu)" : "var(--border)",
                  background: "var(--surface-2)",
                  color: "var(--foreground)",
                }}
              >
                <input
                  type="checkbox"
                  name="dias_semana"
                  value={dia.value}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setDiasSemana((prev) => Array.from(new Set([...prev, dia.value])));
                    } else {
                      setDiasSemana((prev) => prev.filter((value) => value !== dia.value));
                    }
                  }}
                />
                {dia.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Hora inicio</span>
          <input
            name="hora_inicio"
            type="time"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" style={{ color: "var(--muted)" }}>
          <span>Hora fin</span>
          <input
            name="hora_fin"
            type="time"
            className="rounded-lg px-3 py-2 text-sm outline-none transition"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--foreground)",
            }}
            required
          />
        </label>
      </div>

      <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>
        Se generarán ~{estimado} clases
      </p>

      {state.error ? (
        <p
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            border: "1px solid var(--error)",
            background: "color-mix(in srgb, var(--error) 10%, transparent)",
            color: "var(--error)",
          }}
        >
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{
            border: "1px solid var(--success)",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
            color: "var(--success)",
          }}
        >
          {state.success}
        </p>
      ) : null}

      <button type="submit" disabled={isPending} className="btn-primary w-full justify-center disabled:opacity-60">
        {isPending ? "Creando..." : "Crear programa"}
      </button>
    </form>
  );
}
