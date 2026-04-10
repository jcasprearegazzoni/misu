"use client";

import { useMemo, useState } from "react";
import { DisponibilidadManager, type DeporteConfiguracion } from "./disponibilidad-manager";
import { FranjasManager } from "./franjas-manager";

type DisponibilidadItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  apertura: string;
  cierre: string;
  duraciones: number[];
};

type FranjaItem = {
  id: number;
  deporte: DeporteConfiguracion;
  day_of_week: number;
  desde: string;
  hasta: string;
  duracion_minutos: number;
  precio: number;
  cancha_id: number | null;
};

type Props = {
  disponibilidad: DisponibilidadItem[];
  franjas: FranjaItem[];
  canchas: { id: number; nombre: string; deporte: string }[];
};

const deportes: Array<{ value: DeporteConfiguracion; label: string }> = [
  { value: "tenis", label: "Tenis" },
  { value: "padel", label: "Padel" },
  { value: "futbol", label: "Futbol" },
];

function getSportTheme(deporte: DeporteConfiguracion) {
  if (deporte === "tenis") return { activeBg: "#16a34a", border: "rgba(34, 197, 94, 0.4)", softBg: "rgba(22, 163, 74, 0.18)" };
  if (deporte === "padel") return { activeBg: "#d97706", border: "rgba(245, 158, 11, 0.4)", softBg: "rgba(217, 119, 6, 0.18)" };
  return { activeBg: "#2563eb", border: "rgba(59, 130, 246, 0.4)", softBg: "rgba(37, 99, 235, 0.18)" };
}

export function HorariosPreciosManager({ disponibilidad, franjas, canchas }: Props) {
  const defaultSport = useMemo<DeporteConfiguracion>(() => {
    const fromData = [...disponibilidad, ...franjas].find((item) => item.deporte);
    return fromData?.deporte ?? "tenis";
  }, [disponibilidad, franjas]);

  const [selectedDeporte, setSelectedDeporte] = useState<DeporteConfiguracion>(defaultSport);

  return (
    <section className="card p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold sm:text-lg" style={{ color: "var(--foreground)" }}>
          Horarios y precios
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Elegi un deporte y configura disponibilidad y precios en un solo paso.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {deportes.map((deporte) => {
          const theme = getSportTheme(deporte.value);
          const isActive = selectedDeporte === deporte.value;
          return (
            <button
              key={deporte.value}
              type="button"
              onClick={() => setSelectedDeporte(deporte.value)}
              className="rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={
                isActive
                  ? { background: theme.activeBg, color: "#fff" }
                  : {
                      border: `1px solid ${theme.border}`,
                      background: theme.softBg,
                      color: "var(--muted)",
                    }
              }
            >
              {deporte.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold sm:text-base" style={{ color: "var(--foreground)" }}>
            Disponibilidad
          </h3>
          <DisponibilidadManager items={disponibilidad} selectedDeporte={selectedDeporte} />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold sm:text-base" style={{ color: "var(--foreground)" }}>
            Precios por franja
          </h3>
          <FranjasManager
            items={franjas}
            disponibilidadItems={disponibilidad}
            selectedDeporte={selectedDeporte}
            canchas={canchas}
          />
        </div>
      </div>
    </section>
  );
}
