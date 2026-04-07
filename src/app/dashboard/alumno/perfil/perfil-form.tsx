"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ZonaSelector } from "@/components/zona-selector";
import { saveAlumnoProfileAction } from "./actions";

type AlumnoPerfilFormProps = {
  redirectTo?: string | null;
  successMessage?: string | null;
  initialValues: {
    name: string;
    sport: "tenis" | "padel" | "ambos";
    category_padel:
    | "Principiante"
    | "8va"
    | "7ma"
    | "6ta"
    | "5ta"
    | "4ta"
    | "3ra"
    | "2da"
    | "1ra"
    | null;
    category_tenis: "Principiante" | "Intermedio" | "Avanzado" | null;
    branch: "Caballero" | "Dama";
    provincia: string;
    municipio: string;
    localidad: string;
    celular: string;
    has_paleta: boolean;
    has_raqueta: boolean;
  };
};

export function AlumnoPerfilForm({ initialValues, redirectTo, successMessage }: AlumnoPerfilFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado local de errores y éxito — gestionado 100% en el cliente
  const [errors, setErrors] = useState<string[]>([]);

  // Estado controlado de todos los campos — inicializado una sola vez desde props
  const [name, setName] = useState(initialValues.name);
  const [sport, setSport] = useState<"tenis" | "padel" | "ambos">(initialValues.sport);
  const [branch, setBranch] = useState<"Caballero" | "Dama">(initialValues.branch);
  const [categoryPadel, setCategoryPadel] = useState(initialValues.category_padel ?? "");
  const [categoryTenis, setCategoryTenis] = useState(initialValues.category_tenis ?? "");
  const [provincia, setProvincia] = useState(initialValues.provincia);
  const [municipio, setMunicipio] = useState(initialValues.municipio);
  const [localidad, setLocalidad] = useState(initialValues.localidad);
  const [celular, setCelular] = useState(initialValues.celular);
  const [hasPaleta, setHasPaleta] = useState(initialValues.has_paleta);
  const [hasRaqueta, setHasRaqueta] = useState(initialValues.has_raqueta);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Construir FormData con los valores actuales del estado (no del DOM)
    const formData = new FormData();
    formData.set("name", name);
    formData.set("sport", sport);
    formData.set("branch", branch);
    formData.set("category_padel", categoryPadel);
    formData.set("category_tenis", categoryTenis);
    formData.set("provincia", provincia);
    formData.set("municipio", municipio);
    formData.set("localidad", localidad);
    formData.set("celular", celular);
    if (hasPaleta) formData.set("has_paleta", "on");
    if (hasRaqueta) formData.set("has_raqueta", "on");
    if (redirectTo) formData.set("redirectTo", redirectTo);

    startTransition(async () => {
      const result = await saveAlumnoProfileAction(formData);

      if (result.errors.length > 0) {
        // Solo actualizamos los errores — el estado del form NO cambia
        setErrors(result.errors);
        return;
      }

      // Éxito: navegar a la ruta de confirmación
      setErrors([]);
      router.push(result.redirectTo ?? "/dashboard/alumno/perfil?updated=1");
    });
  }

  const visibleSuccessMessage = errors.length === 0 ? successMessage : null;

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {/* Nombre */}
      <label className="label">
        <span>Nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </label>

      {/* Rama */}
      <label className="label">
        <span>Rama</span>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value as "Caballero" | "Dama")}
          className="select"
        >
          <option value="Caballero">Caballero</option>
          <option value="Dama">Dama</option>
        </select>
      </label>

      {/* Deporte */}
      <label className="label">
        <span>Deporte</span>
        <select
          value={sport}
          onChange={(e) => {
            setSport(e.target.value as "tenis" | "padel" | "ambos");
            setCategoryPadel("");
            setCategoryTenis("");
          }}
          className="select"
        >
          <option value="tenis">Tenis</option>
          <option value="padel">Pádel</option>
          <option value="ambos">Tenis y Pádel</option>
        </select>
      </label>

      {/* Categoría pádel */}
      {sport === "padel" || sport === "ambos" ? (
        <label className="label">
          <span>Categoría pádel</span>
          <select
            value={categoryPadel}
            onChange={(e) => setCategoryPadel(e.target.value)}
            className="select"
          >
            <option value="">Seleccioná una categoría</option>
            <option value="Principiante">Principiante</option>
            <option value="8va">8va</option>
            <option value="7ma">7ma</option>
            <option value="6ta">6ta</option>
            <option value="5ta">5ta</option>
            <option value="4ta">4ta</option>
            <option value="3ra">3ra</option>
            <option value="2da">2da</option>
            <option value="1ra">1ra</option>
          </select>
        </label>
      ) : null}

      {/* Categoría tenis */}
      {sport === "tenis" || sport === "ambos" ? (
        <label className="label">
          <span>Categoría tenis</span>
          <select
            value={categoryTenis}
            onChange={(e) => setCategoryTenis(e.target.value)}
            className="select"
          >
            <option value="">Seleccioná una categoría</option>
            <option value="Principiante">Principiante</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </label>
      ) : null}

      {/* Zona */}
      <ZonaSelector
        provincia={provincia}
        municipio={municipio}
        onProvinciaChange={(nuevaProvincia) => {
          setProvincia(nuevaProvincia);
          // Al cambiar a CABA, limpiar localidad (ya no aplica)
          if (nuevaProvincia === "caba") setLocalidad("");
        }}
        onMunicipioChange={setMunicipio}
      />

      {/* Localidad: solo se muestra fuera de CABA (en CABA el barrio lo reemplaza) */}
      {provincia !== "caba" ? (
        <label className="label">
          <span>Localidad</span>
          <input
            type="text"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            placeholder="Ej: Palermo, Recoleta, San Isidro..."
            className="input"
          />
        </label>
      ) : null}

      {/* Celular */}
      <label className="label">
        <span>Celular</span>
        <input
          type="text"
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          placeholder="Ej: 1134567890"
          className="input"
        />
      </label>

      {/* Tengo paleta */}
      {sport === "padel" || sport === "ambos" ? (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <input
            type="checkbox"
            checked={hasPaleta}
            onChange={(e) => setHasPaleta(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-orange-500"
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tengo paleta propia
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              El profesor podrá ver este dato al revisar tu perfil.
            </p>
          </div>
        </label>
      ) : null}

      {/* Tengo raqueta */}
      {sport === "tenis" || sport === "ambos" ? (
        <label
          className="flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <input
            type="checkbox"
            checked={hasRaqueta}
            onChange={(e) => setHasRaqueta(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-orange-500"
          />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tengo raqueta propia
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              El profesor podrá ver este dato al revisar tu perfil.
            </p>
          </div>
        </label>
      ) : null}

      {/* Errores */}
      {errors.length > 0 ? (
        <div className="alert-error">
          <p className="mb-1 font-medium">Corregí los siguientes campos:</p>
          <ul className="list-disc pl-4">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {visibleSuccessMessage ? <p className="alert-success">{visibleSuccessMessage}</p> : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full justify-center sm:w-auto disabled:opacity-60"
        >
          {isPending ? "Guardando..." : "Guardar perfil"}
        </button>
      </div>
    </form>
  );
}
