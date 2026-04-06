"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DeporteFiltro = "todos" | "tenis" | "padel" | "futbol";

type ClubItem = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  deportes: Array<"tenis" | "padel" | "futbol">;
};

type ReservasFiltersProps = {
  clubs: ClubItem[];
};

function getDeporteLabel(deporte: "tenis" | "padel" | "futbol") {
  if (deporte === "tenis") return "Tenis";
  if (deporte === "padel") return "Padel";
  return "Fútbol";
}

export function ReservasFilters({ clubs }: ReservasFiltersProps) {
  const [deporteActivo, setDeporteActivo] = useState<DeporteFiltro>("todos");
  const [query, setQuery] = useState("");

  const clubsFiltrados = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return clubs.filter((club) => {
      const matchDeporte = deporteActivo === "todos" ? true : club.deportes.includes(deporteActivo);
      const matchTexto =
        normalizedQuery.length === 0
          ? true
          : `${club.nombre} ${club.direccion ?? ""}`.toLowerCase().includes(normalizedQuery);

      return matchDeporte && matchTexto;
    });
  }, [clubs, deporteActivo, query]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "todos", label: "Todos" },
          { value: "tenis", label: "Tenis" },
          { value: "padel", label: "Padel" },
          { value: "futbol", label: "Fútbol" },
        ].map((item) => {
          const isActive = deporteActivo === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setDeporteActivo(item.value as DeporteFiltro)}
              className="btn-ghost rounded-lg border px-3 py-1.5 text-sm"
              style={{
                borderColor: isActive ? "var(--misu)" : "var(--border)",
                color: isActive ? "var(--misu)" : "var(--foreground)",
                background: "var(--surface-2)",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar club..."
          className="input"
        />
      </div>

      {clubsFiltrados.length === 0 ? (
        <div className="card mt-4 px-4 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          No hay clubes disponibles aún.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clubsFiltrados.map((club) => (
            <Link
              key={club.id}
              href={`/clubes/${club.username}`}
              className="rounded-2xl border p-4 transition-opacity hover:opacity-75"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {club.nombre}
              </p>
              {club.direccion ? (
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {club.direccion}
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {club.deportes.map((deporte) => (
                  <span
                    key={`${club.id}-${deporte}`}
                    className="rounded-full border px-2 py-0.5 text-xs"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--foreground)" }}
                  >
                    {getDeporteLabel(deporte)}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
