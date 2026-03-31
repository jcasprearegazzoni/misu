import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register", "/reset-password", "/update-password"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Redirige al login si intenta acceder a rutas protegidas sin sesion activa.
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/alumno");
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !isPublic && !user) {
    const loginUrl = new URL("/login", request.url);
    const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ejecutar en todas las rutas excepto archivos estáticos de Next.js
     * y el favicon. Las rutas públicas se evalúan dentro de la función.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
