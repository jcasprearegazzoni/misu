import Link from "next/link";

export default function PublicProfesorNotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-xl border border-zinc-300 bg-white p-5">
        <h1 className="text-xl font-semibold text-zinc-900">Profesor no encontrado</h1>
        <p className="mt-2 text-sm text-zinc-700">
          El link publico no existe o el profesor todavia no tiene un username configurado.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-800"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
