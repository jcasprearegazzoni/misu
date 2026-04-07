"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PROVINCIAS } from "@/lib/geo/argentina";

type DeporteFiltro = "todos" | "tenis" | "padel" | "ambos";

type ProfesorRow = {
  user_id: string;
  name: string;
  username: string | null;
  sport: "tenis" | "padel" | "ambos" | null;
  provincia: string | null;
  zone: string | null;
  price_individual: number | null;
  price_dobles: number | null;
  price_trio: number | null;
  price_grupal: number | null;
};

type ReservarTabProps = {
  profesores: ProfesorRow[];
  misProfesoresIds: string[];
};

function formatPrecio(n: number | null): string | null {
  if (!n || n <= 0) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function matchesDeporte(sport: ProfesorRow["sport"], filtro: DeporteFiltro) {
  if (filtro === "todos") return true;
  if (filtro === "ambos") return sport === "ambos";
  return sport === filtro || sport === "ambos";
}

function SportBadge({ sport }: { sport: ProfesorRow["sport"] }) {
  if (!sport) return null;
  const label = sport === "tenis" ? "Tenis" : sport === "padel" ? "Pádel" : "Tenis · Pádel";
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: "var(--misu-subtle)", color: "var(--misu)", border: "1px solid var(--border-misu)" }}
    >
      {label}
    </span>
  );
}

function ProfesorCard({ profesor, isMisProfesor }: { profesor: ProfesorRow; isMisProfesor: boolean }) {
  const provinciaNombre = profesor.provincia
    ? (PROVINCIAS.find((p) => p.id === profesor.provincia)?.nombre ?? null)
    : null;

  const precios = [
    { label: "Individual", valor: formatPrecio(profesor.price_individual) },
    { label: "Dobles", valor: formatPrecio(profesor.price_dobles) },
    { label: "Trío", valor: formatPrecio(profesor.price_trio) },
    { label: "Grupal", valor: formatPrecio(profesor.price_grupal) },
  ].filter((p) => p.valor !== null);

  return (
    <li
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
    >
      {/* Header: avatar + info + acción */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black"
            style={{ background: "var(--misu-subtle)", border: "1px solid var(--border-misu)", color: "var(--misu)" }}
          >
            {profesor.name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                {profesor.name}
              </p>
              {isMisProfesor ? (
                <span
                  className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ background: "rgba(230,128,25,0.15)", color: "var(--misu)", border: "1px solid var(--misu)" }}
                >
                  Tu profesor
                </span>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <SportBadge sport={profesor.sport} />
              {provinciaNombre ? (
                <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                  📍 {profesor.zone ? `${profesor.zone}, ` : ""}{provinciaNombre}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Acción — en el header */}
        {profesor.username ? (
          <Link
            href={`/p/${profesor.username}`}
            className="btn-primary shrink-0 text-xs"
            style={{ padding: "0.45rem 1rem" }}
          >
            Ver disponibilidad →
          </Link>
        ) : (
          <span className="shrink-0 text-xs" style={{ color: "var(--muted-2)" }}>
            Sin link
          </span>
        )}
      </div>

      {/* Precios */}
      {precios.length > 0 ? (
        <div
          className="mx-4 mb-4 rounded-xl px-3 py-2.5"
          style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
            Precios por clase
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
            {precios.map((p) => (
              <div key={p.label}>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{p.label}</p>
                <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{p.valor}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mx-4 mb-4 text-xs" style={{ color: "var(--muted-2)" }}>Precios no configurados</p>
      )}
    </li>
  );
}

// ─── Componente de filtro con label ─────────────────────────────────────────

function FiltroSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
}) {
  const activo = value !== "";
  return (
    <div className="grid gap-1.5">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select"
        style={{
          borderColor: activo ? "var(--misu)" : undefined,
          boxShadow: activo ? "0 0 0 2px var(--misu-glow)" : undefined,
          fontSize: "0.8125rem",
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

// ─── Componente principal ────────────────────────────────────────────────────

export function ReservarTab({ profesores, misProfesoresIds }: ReservarTabProps) {
  const [deporteActivo, setDeporteActivo] = useState<DeporteFiltro>("todos");
  const [provinciaFiltro, setProvinciaFiltro] = useState<string>("");
  const [zoneFiltro, setZoneFiltro] = useState<string>("");
  const [ordenPrecio, setOrdenPrecio] = useState<"" | "asc" | "desc">("");

  const misProfesoresSet = useMemo(() => new Set(misProfesoresIds), [misProfesoresIds]);

  // Provincias únicas con al menos un profesor
  const provinciasDisponibles = useMemo(() => {
    const ids = new Set(profesores.map((p) => p.provincia).filter(Boolean) as string[]);
    return PROVINCIAS.filter((p) => ids.has(p.id));
  }, [profesores]);

  // Zonas disponibles para la provincia seleccionada
  const zonasDisponibles = useMemo(() => {
    if (!provinciaFiltro) return [];
    const zonas = new Set(
      profesores
        .filter((p) => p.provincia === provinciaFiltro && p.zone)
        .map((p) => p.zone as string),
    );
    return Array.from(zonas).sort((a, b) => a.localeCompare(b, "es"));
  }, [profesores, provinciaFiltro]);

  const zonaLabel = provinciaFiltro === "caba" ? "Barrio" : "Municipio / Partido";

  // Filtrado y ordenamiento combinados
  const profesoresFiltrados = useMemo(() => {
    const filtrados = profesores.filter((p) => {
      if (!matchesDeporte(p.sport, deporteActivo)) return false;
      if (provinciaFiltro && p.provincia !== provinciaFiltro) return false;
      if (zoneFiltro && p.zone !== zoneFiltro) return false;
      return true;
    });
    if (ordenPrecio === "asc") {
      // Sin precio van al final
      return [...filtrados].sort((a, b) => {
        const pa = a.price_individual ?? Infinity;
        const pb = b.price_individual ?? Infinity;
        return pa - pb;
      });
    }
    if (ordenPrecio === "desc") {
      // Sin precio van al final
      return [...filtrados].sort((a, b) => {
        const pa = a.price_individual ?? -Infinity;
        const pb = b.price_individual ?? -Infinity;
        return pb - pa;
      });
    }
    return filtrados;
  }, [profesores, deporteActivo, provinciaFiltro, zoneFiltro, ordenPrecio]);

  const misProfesoresFiltrados = profesoresFiltrados.filter((p) => misProfesoresSet.has(p.user_id));
  const otrosProfesores = profesoresFiltrados.filter((p) => !misProfesoresSet.has(p.user_id));

  const hayFiltrosActivos = deporteActivo !== "todos" || provinciaFiltro !== "" || zoneFiltro !== "" || ordenPrecio !== "";

  function handleProvinciaChange(id: string) {
    setProvinciaFiltro(id);
    setZoneFiltro("");
  }

  function limpiarFiltros() {
    setDeporteActivo("todos");
    setProvinciaFiltro("");
    setZoneFiltro("");
    setOrdenPrecio("");
  }

  return (
    <section className="mt-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          Elegir profesor
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Buscá por deporte o zona y reservá una clase.
        </p>
      </header>

      {profesores.length === 0 ? (
        <div
          className="rounded-xl border px-4 py-8 text-center text-sm"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
        >
          No hay profesores cargados por el momento.
        </div>
      ) : (
        <>
          {/* Panel de filtros */}
          <div
            className="mb-5 rounded-2xl p-4"
            style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Deporte */}
              <FiltroSelect
                label="Deporte"
                value={deporteActivo === "todos" ? "" : deporteActivo}
                onChange={(v) => setDeporteActivo((v || "todos") as DeporteFiltro)}
                placeholder="Todos los deportes"
                options={[
                  { value: "tenis", label: "Tenis" },
                  { value: "padel", label: "Pádel" },
                  { value: "ambos", label: "Ambos" },
                ]}
              />

              {/* Provincia */}
              <FiltroSelect
                label="Provincia"
                value={provinciaFiltro}
                onChange={handleProvinciaChange}
                placeholder="Todas las provincias"
                options={provinciasDisponibles.map((p) => ({ value: p.id, label: p.nombre }))}
              />

              {/* Zona */}
              <FiltroSelect
                label={zonaLabel}
                value={zoneFiltro}
                onChange={setZoneFiltro}
                placeholder={provinciaFiltro ? `Todos los ${zonaLabel === "Barrio" ? "barrios" : "municipios"}` : "Primero elegí provincia"}
                options={zonasDisponibles.map((z) => ({ value: z, label: z }))}
              />

              {/* Ordenar por precio */}
              <FiltroSelect
                label="Ordenar por precio"
                value={ordenPrecio}
                onChange={(v) => setOrdenPrecio(v as "" | "asc" | "desc")}
                placeholder="Sin ordenar"
                options={[
                  { value: "asc", label: "Más barato primero" },
                  { value: "desc", label: "Más caro primero" },
                ]}
              />
            </div>

            {hayFiltrosActivos ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-xs font-medium transition"
                  style={{ color: "var(--muted-2)" }}
                >
                  Limpiar filtros ✕
                </button>
              </div>
            ) : null}
          </div>

          {/* Resultados */}
          {profesoresFiltrados.length === 0 ? (
            <div
              className="rounded-xl border px-4 py-8 text-center text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--muted)" }}
            >
              No hay profesores disponibles para estos filtros.
            </div>
          ) : (
            <div className="grid gap-5">
              {misProfesoresFiltrados.length > 0 ? (
                <section>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                    Tus profesores
                  </p>
                  <ul className="grid gap-3">
                    {misProfesoresFiltrados.map((p) => (
                      <ProfesorCard key={p.user_id} profesor={p} isMisProfesor />
                    ))}
                  </ul>
                </section>
              ) : null}

              {otrosProfesores.length > 0 ? (
                <section>
                  {misProfesoresFiltrados.length > 0 ? (
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
                      Más profesores
                    </p>
                  ) : null}
                  <ul className="grid gap-3">
                    {otrosProfesores.map((p) => (
                      <ProfesorCard key={p.user_id} profesor={p} isMisProfesor={false} />
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
