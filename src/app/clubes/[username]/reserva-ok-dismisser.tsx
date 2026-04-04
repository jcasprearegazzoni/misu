"use client";

import { useEffect } from "react";

/**
 * Elimina el parámetro `reserva_ok` de la URL al montar el componente,
 * de modo que si el usuario recarga la página el bloque no reaparece.
 */
export function ReservaOkDismisser() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("reserva_ok")) {
      url.searchParams.delete("reserva_ok");
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return null;
}
