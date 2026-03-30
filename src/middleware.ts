import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const DASHBOARD_PREFIX = "/dashboard";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Redirige al login si intenta acceder al dashboard sin sesion activa.
  if (pathname.startsWith(DASHBOARD_PREFIX) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Ejecutar el middleware en todas las rutas excepto:
     * - _next/static  (archivos estáticos de Next.js)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico   (ícono del sitio)
     * - Rutas públicas: /, /login, /register, /reset-password, /update-password
     */
    "/((?!_next/static|_next/image|favicon.ico|$|login|register|reset-password|update-password).*)",
  ],
};
