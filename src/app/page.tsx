import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-14">
      <section className="rounded-2xl border border-zinc-300 bg-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-zinc-700">misu</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight text-zinc-900 sm:text-4xl">
          Organiza clases, reservas y finanzas en un solo lugar
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-zinc-700 sm:text-base">
          misu te ayuda a gestionar clases de tenis y padel de forma simple, clara y pensada
          para usar desde el celular.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex justify-center rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Registrarme
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900">Que podes hacer con misu</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl border border-zinc-300 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Gestion de clases</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Carga disponibilidad semanal y manten tu agenda ordenada.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-300 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Reservas y clases fijas</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Los alumnos reservan en pocos pasos y pueden repetir semanas.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-300 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Finanzas y paquetes</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Registra cobros, deudas y consumo de paquetes sin planillas.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-300 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Notificaciones y automatizacion</h3>
            <p className="mt-1 text-sm text-zinc-700">
              Visualiza eventos importantes y decisiones pendientes en tiempo real de uso.
            </p>
          </article>
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-zinc-300 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Para profesores</h3>
          <p className="mt-2 text-sm text-zinc-700">
            Administra agenda, reservas, cobros, deudas y finanzas desde una vista operativa.
          </p>
        </article>
        <article className="rounded-xl border border-zinc-300 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">Para alumnos</h3>
          <p className="mt-2 text-sm text-zinc-700">
            Reserva clases, sigue tus clases y responde decisiones cuando una clase queda sola.
          </p>
        </article>
      </section>

      <section className="mt-10 rounded-2xl border border-zinc-300 bg-zinc-50 px-5 py-6 sm:px-8">
        <h2 className="text-xl font-semibold text-zinc-900">Empeza hoy</h2>
        <p className="mt-2 text-sm text-zinc-700">
          Crea tu cuenta o inicia sesión para organizar tus clases de forma simple.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex justify-center rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          >
            Registrarme
          </Link>
        </div>
      </section>
    </main>
  );
}
