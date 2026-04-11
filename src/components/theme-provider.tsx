"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Tema = "dark" | "light";

interface TemaContextValue {
  tema: Tema;
  toggleTema: () => void;
}

const TemaContext = createContext<TemaContextValue>({
  tema: "dark",
  toggleTema: () => {},
});

export function useTema() {
  return useContext(TemaContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>("dark");

  // Lee el tema guardado en localStorage al montar
  useEffect(() => {
    const guardado = localStorage.getItem("misu-tema") as Tema | null;
    if (guardado === "light" || guardado === "dark") {
      setTema(guardado);
    }
  }, []);

  // Aplica el atributo al elemento <html> y guarda en localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (tema === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem("misu-tema", tema);
  }, [tema]);

  function toggleTema() {
    setTema((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <TemaContext.Provider value={{ tema, toggleTema }}>
      {children}
    </TemaContext.Provider>
  );
}
