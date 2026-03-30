"use client";

import { useState } from "react";
import { PROVINCIAS, getMunicipiosByProvincia } from "@/lib/geo/argentina";

type ZonaSelectorProps = {
  defaultProvincia?: string;
  defaultMunicipio?: string;
};

const selectClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/20";

export function ZonaSelector({ defaultProvincia, defaultMunicipio }: ZonaSelectorProps) {
  const initialProvincia = defaultProvincia ?? "";
  const [provinciaId, setProvinciaId] = useState(initialProvincia);

  const municipios = provinciaId ? getMunicipiosByProvincia(provinciaId) : [];

  // Si el municipio guardado no está en la lista de la provincia actual, lo reseteamos.
  const defaultMunicipioValido =
    municipios.includes(defaultMunicipio ?? "") ? defaultMunicipio : "";

  function handleProvinciaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setProvinciaId(e.target.value);
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Provincia</span>
        <select
          name="provincia"
          value={provinciaId}
          onChange={handleProvinciaChange}
          className={selectClass}
          required
        >
          <option value="" disabled>
            Seleccioná una provincia
          </option>
          {PROVINCIAS.map((provincia) => (
            <option key={provincia.id} value={provincia.id}>
              {provincia.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-sm font-medium text-zinc-800">
        <span>Municipio / Partido</span>
        {provinciaId === "" ? (
          <select disabled className={`${selectClass} cursor-not-allowed opacity-50`}>
            <option>Primero seleccioná una provincia</option>
          </select>
        ) : (
          <select
            name="municipio"
            defaultValue={defaultMunicipioValido}
            className={selectClass}
            required
            key={provinciaId}
          >
            <option value="" disabled>
              Seleccioná un municipio
            </option>
            {municipios.map((municipio) => (
              <option key={municipio} value={municipio}>
                {municipio}
              </option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
}
