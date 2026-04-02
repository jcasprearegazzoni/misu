"use client";

import { useState } from "react";
import { PROVINCIAS, getMunicipiosByProvincia } from "@/lib/geo/argentina";

type ZonaSelectorProps = {
  defaultProvincia?: string;
  defaultMunicipio?: string;
};

export function ZonaSelector({ defaultProvincia, defaultMunicipio }: ZonaSelectorProps) {
  const initialProvincia = defaultProvincia ?? "";
  const [provinciaId, setProvinciaId] = useState(initialProvincia);

  const municipios = provinciaId ? getMunicipiosByProvincia(provinciaId) : [];

  // Si el municipio guardado no está en la lista de la provincia actual, lo reseteamos.
  const defaultMunicipioValido = municipios.includes(defaultMunicipio ?? "") ? defaultMunicipio : "";

  function handleProvinciaChange(event: React.ChangeEvent<HTMLSelectElement>) {
    setProvinciaId(event.target.value);
  }

  return (
    <div className="grid gap-4">
      <label className="label">
        <span>Provincia</span>
        <select name="provincia" value={provinciaId} onChange={handleProvinciaChange} className="select" required>
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

      <label className="label">
        <span>Municipio / Partido</span>
        {provinciaId === "" ? (
          <select disabled className="select cursor-not-allowed opacity-50">
            <option>Primero seleccioná una provincia</option>
          </select>
        ) : (
          <select
            name="municipio"
            defaultValue={defaultMunicipioValido}
            className="select"
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
