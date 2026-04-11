"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PROVINCIAS } from "@/lib/geo/argentina";

type DeporteFiltro = "todos" | "tenis" | "padel" | "futbol";

type ClubItem = {
  id: number;
  nombre: string;
  username: string;
  direccion: string | null;
  provincia: string | null;
  municipio: string | null;
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

// ─── Select compacto con label ────────────────────────────────────────────────

function FiltroSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  const activo = value !== "";
  return (
    <div className="grid gap-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="select"
        style={{
          fontSize: "0.75rem",
          padding: "0.4rem 1.75rem 0.4rem 0.625rem",
          borderColor: activo ? "var(--misu)" : undefined,
          boxShadow: activo ? "0 0 0 2px var(--misu-glow)" : undefined,
          opacity: disabled ? 0.5 : undefined,
          cursor: disabled ? "not-allowed" : undefined,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ReservasFilters({ clubs }: ReservasFiltersProps) {
  const [deporteActivo, setDeporteActivo] = useState<DeporteFiltro>("todos");
  const [provinciaFiltro, setProvinciaFiltro] = useState("");
  const [municipioFiltro, setMunicipioFiltro] = useState("");

  // Provincias con al menos un club
  const provinciasDisponibles = useMemo(() => {
    const ids = new Set(clubs.map((c) => c.provincia).filter(Boolean) as string[]);
    return PROVINCIAS.filter((p) => ids.has(p.id));
  }, [clubs]);

  // Municipios disponibles para la provincia seleccionada
  const municipiosDisponibles = useMemo(() => {
    if (!provinciaFiltro) return [];
    const munis = new Set(
      clubs
        .filter((c) => c.provincia === provinciaFiltro && c.municipio)
        .map((c) => c.municipio as string),
    );
    return Array.from(munis).sort((a, b) => a.localeCompare(b, "es"));
  }, [clubs, provinciaFiltro]);

  const hayFiltrosActivos = deporteActivo !== "todos" || provinciaFiltro !== "" || municipioFiltro !== "";

  function handleProvinciaChange(id: string) {
    setProvinciaFiltro(id);
    setMunicipioFiltro("");
  }

  function limpiarFiltros() {
    setDeporteActivo("todos");
    setProvinciaFiltro("");
    setMunicipioFiltro("");
  }

  const clubsFiltrados = useMemo(() => {
    return clubs.filter((club) => {
      if (deporteActivo !== "todos" && !club.deportes.includes(deporteActivo)) return false;
      if (provinciaFiltro && club.provincia !== provinciaFiltro) return false;
      if (municipioFiltro && club.municipio !== municipioFiltro) return false;
      return true;
    });
  }, [clubs, deporteActivo, provinciaFiltro, municipioFiltro]);

  return (
    <>
      {/* Panel de filtros */}
      <div
        className="mb-5 rounded-2xl p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap items-end gap-2">
          {/* Deporte */}
          <div className="w-[140px] shrink-0">
            <FiltroSelect
              label="Deporte"
              value={deporteActivo === "todos" ? "" : deporteActivo}
              onChange={(v) => setDeporteActivo((v || "todos") as DeporteFiltro)}
              placeholder="Todos"
              options={[
                { value: "tenis", label: "Tenis" },
                { value: "padel", label: "Padel" },
                { value: "futbol", label: "Fútbol" },
              ]}
            />
          </div>

          {/* Provincia */}
          <div className="w-[160px] shrink-0">
            <FiltroSelect
              label="Provincia"
              value={provinciaFiltro}
              onChange={handleProvinciaChange}
              placeholder="Todas"
              options={provinciasDisponibles.map((p) => ({ value: p.id, label: p.nombre }))}
            />
          </div>

          {/* Municipio / Partido */}
          <div className="w-[160px] shrink-0">
            <FiltroSelect
              label="Municipio / Partido"
              value={municipioFiltro}
              onChange={setMunicipioFiltro}
              placeholder={provinciaFiltro ? "Todos los municipios" : "Primero elegí provincia"}
              options={municipiosDisponibles.map((m) => ({ value: m, label: m }))}
              disabled={!provinciaFiltro}
            />
          </div>

          {/* Limpiar filtros */}
          {hayFiltrosActivos ? (
            <div className="ml-auto">
              <div className="grid gap-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-0">·</p>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs font-medium transition"
                  style={{ color: "var(--muted-2)", padding: "0.4rem 0" }}
                >
                  Limpiar ✕
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Resultados */}
      {clubsFiltrados.length === 0 ? (
        <div className="card px-4 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
          No hay clubes disponibles para estos filtros.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
