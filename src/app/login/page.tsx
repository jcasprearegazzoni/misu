import Link from "next/link";
import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{ redirectTo?: string; verified?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = resolvedSearchParams?.redirectTo ?? null;
  const verifiedStatus = resolvedSearchParams?.verified ?? null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <Link href="/" className="mb-6 inline-block text-xl font-bold tracking-tight text-misu">misu</Link>
      <h1 className="text-2xl font-semibold text-zinc-900">Iniciar sesion</h1>
      <p className="mt-2 text-sm text-zinc-600">Ingresa con email y contrasena.</p>

      {verifiedStatus === "1" ? (
        <p className="mt-4 rounded-lg border border-emerald-300 bg-emerald-100 px-3 py-2 text-sm text-emerald-800">
          Email confirmado correctamente. Ya puedes iniciar sesion.
        </p>
      ) : null}

      {verifiedStatus === "0" ? (
        <p className="mt-4 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-800">
          No se pudo confirmar el email. Intenta nuevamente desde el enlace recibido.
        </p>
      ) : null}

      <LoginForm redirectTo={redirectTo} />

      <p className="mt-4 text-sm">
        <Link href="/reset-password" className="font-medium text-zinc-900 underline">
          Olvidaste tu contrasena?
        </Link>
      </p>

      <p className="mt-6 text-sm text-zinc-600">
        No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          Registrate
        </Link>
      </p>
    </main>
  );
}
