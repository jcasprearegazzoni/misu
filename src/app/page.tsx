import Link from "next/link";

const features = [
  {
    title: "Agenda semanal",
    description: "Configurá tu disponibilidad una vez. misu genera los turnos automáticamente.",
  },
  {
    title: "Reservas en segundos",
    description: "Tus alumnos reservan desde el celular sin llamadas ni mensajes de WhatsApp.",
  },
  {
    title: "Cobros y paquetes",
    description: "Registrá pagos, cargá paquetes de clases y controlá deudas sin planillas.",
  },
  {
    title: "Notificaciones automáticas",
    description: "Cancelaciones, confirmaciones y decisiones llegan sin que tengas que hacer nada.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="text-lg font-bold tracking-tight text-misu">misu</span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-misu px-4 py-2 text-sm font-semibold text-white hover:bg-misu-dark"
          >
            Registrarme
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-5 pb-20 pt-16 sm:px-8 sm:pt-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-misu/20 bg-misu-warm px-3 py-1 text-xs font-medium text-misu">
              <span className="h-1.5 w-1.5 rounded-full bg-misu" />
              Tenis y pádel · Argentina
            </div>

            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-6xl">
              Tu agenda,<br />
              <span className="text-misu">sin el caos.</span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-500 sm:text-lg">
              misu te ayuda a gestionar clases, reservas y cobros desde el celular.
              Pensado para profesores de tenis y pádel que quieren organizarse sin perder tiempo.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-misu px-6 py-3 text-sm font-semibold text-white hover:bg-misu-dark"
              >
                Empezar gratis
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Ya tengo cuenta
              </Link>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              Sin tarjeta de crédito. Primer mes gratis.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-zinc-100 bg-misu-warm">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-widest text-misu">
              Todo en un lugar
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 sm:text-3xl">
              Lo que necesitás, sin lo que no.
            </h2>

            <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-orange-100 bg-orange-100 sm:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="bg-white p-6 sm:p-8">
                  <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-7">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-misu">Profesores</p>
              <h3 className="mt-3 text-xl font-bold text-zinc-900">Control total de tu negocio</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Agenda semanal, confirmación de reservas, cobros, deudas y paquetes.
                Todo sin salir de la app.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex rounded-full bg-misu px-4 py-2 text-xs font-semibold text-white hover:bg-misu-dark"
              >
                Crear cuenta de profesor
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-7">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Alumnos</p>
              <h3 className="mt-3 text-xl font-bold text-zinc-900">Reservá en segundos</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Entrá al perfil de tu profesor, elegí un horario y confirmá la reserva.
                Sin llamadas, sin mensajes, sin confusiones.
              </p>
              <Link
                href="/register"
                className="mt-5 inline-flex rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Crear cuenta de alumno
              </Link>
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="border-t border-zinc-100 bg-misu-warm">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="rounded-2xl bg-zinc-900 px-8 py-12 text-center sm:px-16">
              <p className="text-xs font-semibold uppercase tracking-widest text-misu">misu</p>
              <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                Empezá hoy, gratis.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                Creá tu cuenta en menos de un minuto y empezá a organizar tus clases sin planillas ni WhatsApps.
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/register"
                  className="inline-flex rounded-full bg-misu px-6 py-3 text-sm font-semibold text-white hover:bg-misu-dark"
                >
                  Crear cuenta gratis
                </Link>
                <Link
                  href="/login"
                  className="inline-flex rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  Iniciar sesión
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-5 py-6 text-center">
        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-misu">misu</span>
          {" "}· Hecho para profesores de tenis y pádel en Argentina.
        </p>
      </footer>
    </div>
  );
}
