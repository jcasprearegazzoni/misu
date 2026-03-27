import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-zinc-600">Ingresa con email y contraseña.</p>

      <LoginForm />

      <p className="mt-4 text-sm">
        <Link href="/reset-password" className="font-medium text-zinc-900 underline">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>

      <p className="mt-6 text-sm text-zinc-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-zinc-900 underline">
          Regístrate
        </Link>
      </p>
    </main>
  );
}
