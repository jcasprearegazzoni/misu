import Link from "next/link";

const features = [
  {
    icon: "📅",
    title: "Agenda semanal",
    description: "Configurá tu disponibilidad una vez. misu genera los turnos automáticamente.",
  },
  {
    icon: "⚡",
    title: "Reservas en segundos",
    description: "Tus alumnos reservan desde el celular sin llamadas ni mensajes de WhatsApp.",
  },
  {
    icon: "💰",
    title: "Cobros y paquetes",
    description: "Registrá pagos, cargá paquetes de clases y controlá deudas sin planillas.",
  },
  {
    icon: "🔔",
    title: "Notificaciones automáticas",
    description: "Cancelaciones y confirmaciones llegan sin que tengas que hacer nada.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(12, 12, 14, 0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <span
            className="text-xl font-black tracking-tighter logo-glow"
            style={{ color: "var(--misu)" }}
          >
            misu
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="btn-ghost text-sm"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm"
            >
              Registrarme
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative mx-auto max-w-5xl px-5 pb-24 pt-20 sm:px-8 sm:pt-32 overflow-hidden">
          {/* Glow de fondo decorativo */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "700px",
              height: "500px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <div className="relative max-w-3xl animate-fade-in">
            {/* Pill badge */}
            <div
              className="pill mb-6"
              style={{
                background: "var(--misu-subtle)",
                border: "1px solid var(--border-misu)",
                color: "var(--misu-light)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--misu)",
                  display: "inline-block",
                  animation: "pulse-misu 2s infinite",
                }}
              />
              Tenis & Pádel · Argentina
            </div>

            <h1
              className="text-5xl font-black leading-none tracking-tighter sm:text-7xl"
              style={{ color: "var(--foreground)" }}
            >
              Tu agenda,{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, var(--misu) 0%, var(--misu-light) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                sin el caos.
              </span>
            </h1>

            <p
              className="mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              misu es la plataforma pensada para profesores de tenis y pádel que quieren
              organizarse sin perder tiempo. Clases, reservas y cobros en un solo lugar.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="btn-primary" style={{ padding: "0.8rem 1.75rem", fontSize: "1rem" }}>
                Empezar gratis
              </Link>
              <Link href="/login" className="btn-secondary" style={{ padding: "0.8rem 1.75rem", fontSize: "1rem" }}>
                Ya tengo cuenta
              </Link>
            </div>

            <p className="mt-4 text-xs" style={{ color: "var(--muted-2)" }}>
              Sin tarjeta de crédito · Creá tu cuenta hoy
            </p>
          </div>
        </section>


        {/* Features */}
        <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <p
              className="pill mb-3 inline-flex"
              style={{
                background: "var(--misu-subtle)",
                border: "1px solid var(--border-misu)",
                color: "var(--misu-light)",
              }}
            >
              Todo en un lugar
            </p>
            <h2
              className="text-3xl font-black tracking-tight sm:text-4xl"
              style={{ color: "var(--foreground)" }}
            >
              Lo que necesitás,{" "}
              <span style={{ color: "var(--misu)" }}>sin lo que no.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm" style={{ color: "var(--muted)" }}>
              Herramientas simples y directas para profesores que quieren más tiempo en la cancha.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="card p-6 sm:p-7">
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                  style={{
                    background: "var(--misu-subtle)",
                    border: "1px solid var(--border-misu)",
                  }}
                >
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-24">
            <div className="mb-12 text-center">
              <h2
                className="text-3xl font-black tracking-tight sm:text-4xl"
                style={{ color: "var(--foreground)" }}
              >
                Hecho para todos
              </h2>
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                Tanto profesores como alumnos tienen su propio espacio.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {/* Profesor */}
              <div
                className="card p-7 relative overflow-hidden"
                style={{ borderColor: "var(--border-misu)" }}
              >
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "-40px",
                    right: "-40px",
                    width: "200px",
                    height: "200px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                  }}
                />
                <p
                  className="pill"
                  style={{
                    background: "var(--misu-subtle)",
                    border: "1px solid var(--border-misu)",
                    color: "var(--misu)",
                  }}
                >
                  Profesores
                </p>
                <h3
                  className="mt-4 text-2xl font-bold tracking-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  Control total de tu negocio
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  Agenda semanal, confirmación de reservas, cobros, deudas y paquetes.
                  Todo sin salir de la app.
                </p>
                <ul className="mt-5 grid gap-2">
                  {["Configurá tu disponibilidad", "Confirmá o cancelá reservas", "Registrá cobros y paquetes"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                      <span style={{ color: "var(--misu)", fontWeight: 700 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="btn-primary mt-6 w-full text-sm"
                  style={{ justifyContent: "center" }}
                >
                  Crear cuenta de profesor
                </Link>
              </div>

              {/* Alumno */}
              <div className="card p-7">
                <p
                  className="pill"
                  style={{
                    background: "var(--surface-3)",
                    border: "1px solid var(--border-hover)",
                    color: "var(--muted)",
                  }}
                >
                  Alumnos
                </p>
                <h3
                  className="mt-4 text-2xl font-bold tracking-tight"
                  style={{ color: "var(--foreground)" }}
                >
                  Reservá en segundos
                </h3>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  Entrá al perfil de tu profesor, elegí un horario y confirmá la reserva.
                  Sin llamadas, sin mensajes, sin confusiones.
                </p>
                <ul className="mt-5 grid gap-2">
                  {["Elegí día y horario", "Gestioná tus clases", "Seguí tus créditos de paquete"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                      <span style={{ color: "var(--foreground)", fontWeight: 700 }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="btn-secondary mt-6 w-full text-sm"
                  style={{ justifyContent: "center" }}
                >
                  Crear cuenta de alumno
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section
          style={{ borderTop: "1px solid var(--border)" }}
          className="px-5 sm:px-8"
        >
          <div className="mx-auto max-w-5xl py-20 sm:py-24">
            <div
              className="relative overflow-hidden rounded-2xl p-8 text-center sm:p-16"
              style={{
                background: "linear-gradient(135deg, var(--surface-2) 0%, var(--surface-3) 100%)",
                border: "1px solid var(--border-misu)",
              }}
            >
              {/* Decoración de fondo */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 60%)",
                  pointerEvents: "none",
                }}
              />

              <div className="relative">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--misu)" }}
                >
                  misu
                </p>
                <h2
                  className="mt-4 text-3xl font-black tracking-tight sm:text-4xl"
                  style={{ color: "var(--foreground)" }}
                >
                  Empezá hoy,{" "}
                  <span style={{ color: "var(--misu)" }}>gratis.</span>
                </h2>
                <p
                  className="mx-auto mt-4 max-w-md text-sm leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  Creá tu cuenta en menos de un minuto y empezá a organizar tus clases
                  sin planillas ni WhatsApps.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    href="/register"
                    className="btn-primary"
                    style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}
                  >
                    Crear cuenta gratis
                  </Link>
                  <Link href="/login" className="btn-secondary" style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}>
                    Iniciar sesión
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{ borderTop: "1px solid var(--border)" }}
        className="px-5 py-8 text-center"
      >
        <p className="text-xs" style={{ color: "var(--muted-2)" }}>
          © {new Date().getFullYear()}{" "}
          <span className="font-bold" style={{ color: "var(--misu)" }}>
            misu
          </span>
          {" "}· Hecho para profesores de tenis y pádel en Argentina.
        </p>
      </footer>
    </div>
  );
}
