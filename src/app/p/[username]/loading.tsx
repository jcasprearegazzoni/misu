export default function PublicProfesorLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
      <div className="animate-pulse rounded-xl border border-zinc-300 bg-white p-4">
        <div className="h-3 w-28 rounded bg-zinc-200" />
        <div className="mt-3 h-7 w-56 rounded bg-zinc-200" />
        <div className="mt-3 h-4 w-40 rounded bg-zinc-200" />
      </div>
      <div className="mt-4 h-40 animate-pulse rounded-xl border border-zinc-300 bg-white" />
      <div className="mt-6 h-72 animate-pulse rounded-xl border border-zinc-300 bg-white" />
    </main>
  );
}
