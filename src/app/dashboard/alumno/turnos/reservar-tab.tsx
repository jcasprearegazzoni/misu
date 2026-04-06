"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DeporteFiltro = "todos" | "tenis" | "padel" | "ambos";

type ProfesorRow = {
  user_id: string;
  name: string;
  username: string | null;
  sport: "tenis" | "padel" | "ambos" | null;
};

type ReservarTabProps = {
  profesores: ProfesorRow[];
  misProfesoresIds: string[];
};

const filtros: Array<{ key: DeporteFiltro; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "tenis", label: "Tenis" },
  { key: "padel", label: "Padel" },
  { key: "ambos", label: "Ambos" },
];

function matchesFiltro(sport: ProfesorRow["sport"], filtro: DeporteFiltro) {
  if (filtro === "todos") return true;
  if (filtro === "ambos") return sport === "ambos";
  return sport === filtro || sport === "ambos";
}

function ProfesorItem({ profesor, isMisProfesor }: { profesor: ProfesorRow; isMisProfesor: boolean }) {
  return (
    <li
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)", color: "var(--misu)" }}
        >
          {profesor.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {profesor.name}
          </p>
          {isMisProfesor ? (
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ color: "var(--misu)", border: "1px solid var(--misu)" }}
            >
              Tu profesor
            </span>
          ) : null}
        </div>
      </div>
      {profesor.username ? (
        <Link href={`/p/${profesor.username}`} className="btn-primary text-xs" style={{ padding: "0.4rem 0.9rem" }}>
          Ver semana
        </Link>
      ) : (
        <span
          className="rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--muted-2)" }}
        >
          Sin link publico
        </span>
      )}
    </li>
  );
}

export function ReservarTab({ profesores, misProfesoresIds }: ReservarTabProps) {
  const [deporteActivo, setDeporteActivo] = useState<DeporteFiltro>("todos");
  const misProfesoresSet = useMemo(() => new Set(misProfesoresIds), [misProfesoresIds]);

  const profesoresFiltrados = useMemo(
    () => profesores.filter((profesor) => matchesFiltro(profesor.sport, deporteActivo)),
    [profesores, deporteActivo],
  );

  const misProfesores = profesoresFiltrados.filter((profesor) => misProfesoresSet.has(profesor.user_id));
  const otrosProfesores = profesoresFiltrados.filter((profesor) => !misProfesoresSet.has(profesor.user_id));

  return (
    <section className="mt-6 card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Elegir profesor
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Selecciona un profesor para ver su semana y reservar una clase.
          </p>
        </div>
      </div>

      {profesores.length === 0 ? (
        <div
          className="mt-4 rounded-lg border px-4 py-4 text-center text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          No hay profesores cargados por el momento.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {filtros.map((filtro) => {
              const activo = deporteActivo === filtro.key;
              return (
                <button
                  key={filtro.key}
                  type="button"
                  onClick={() => setDeporteActivo(filtro.key)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold transition"
                  style={
                    activo
                      ? { borderColor: "var(--misu)", color: "var(--misu)", background: "var(--misu-subtle)" }
                      : { borderColor: "var(--border)", color: "var(--muted)", background: "var(--surface-2)" }
                  }
                >
                  {filtro.label}
                </button>
              );
            })}
          </div>

          {profesoresFiltrados.length === 0 ? (
            <div
              className="mt-4 rounded-lg border px-4 py-4 text-center text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
            >
              No hay profesores disponibles para este filtro.
            </div>
          ) : (
            <div className="mt-4 grid gap-4">
              {misProfesores.length > 0 ? (
                <section className="grid gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                    Tus profesores
                  </p>
                  <ul className="grid gap-2">
                    {misProfesores.map((profesor) => (
                      <ProfesorItem key={profesor.user_id} profesor={profesor} isMisProfesor />
                    ))}
                  </ul>
                </section>
              ) : null}

              {otrosProfesores.length > 0 ? (
                <section className="grid gap-2">
                  {misProfesores.length > 0 ? (
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                      Mas profesores
                    </p>
                  ) : null}
                  <ul className="grid gap-2">
                    {otrosProfesores.map((profesor) => (
                      <ProfesorItem key={profesor.user_id} profesor={profesor} isMisProfesor={false} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  );
}
