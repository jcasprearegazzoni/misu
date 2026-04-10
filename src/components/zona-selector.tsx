"use client";

import { useEffect } from "react";
import { PROVINCIAS, getMunicipiosByProvincia } from "@/lib/geo/argentina";

type ZonaSelectorProps = {
  // Modo controlado
  provincia: string;
  municipio: string;
  onProvinciaChange: (value: string) => void;
  onMunicipioChange: (value: string) => void;
};

export function ZonaSelector({ provincia, municipio, onProvinciaChange, onMunicipioChange }: ZonaSelectorProps) {
  const municipios = provincia ? getMunicipiosByProvincia(provincia) : [];

  useEffect(() => {
    if (!provincia) {
      if (municipio) onMunicipioChange("");
      return;
    }

    if (municipio && !municipios.includes(municipio)) {
      onMunicipioChange("");
    }
  }, [municipio, municipios, onMunicipioChange, provincia]);

  function handleProvinciaChange(event: React.ChangeEvent<HTMLSelectElement>) {
    onProvinciaChange(event.target.value);
    // Al cambiar provincia, resetear municipio
    onMunicipioChange("");
  }

  return (
    <div className="grid gap-4">
      {/* Input oculto para enviar provincia al formData */}
      <input type="hidden" name="provincia" value={provincia} />
      {/* Input oculto para enviar municipio al formData */}
      <input type="hidden" name="municipio" value={municipio} />

      <label className="label">
        <span>Provincia</span>
        <select value={provincia} onChange={handleProvinciaChange} className="select" required>
          <option value="" disabled>
            Seleccioná una provincia
          </option>
          {PROVINCIAS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="label">
        <span>{provincia === "caba" ? "Barrio" : "Municipio / Partido"}</span>
        {provincia === "" ? (
          <select disabled className="select cursor-not-allowed opacity-50">
            <option>Primero seleccioná una provincia</option>
          </select>
        ) : (
          <select
            value={municipio}
            onChange={(e) => onMunicipioChange(e.target.value)}
            className="select"
            required
          >
            <option value="" disabled>
              {provincia === "caba" ? "Seleccioná un barrio" : "Seleccioná un municipio"}
            </option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
}
