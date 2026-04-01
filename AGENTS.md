# Misu — Instrucciones del proyecto

## Objetivo
Construir una app SaaS web/PWA para profesores de tenis y pádel en Argentina.

## Stack obligatorio
- Next.js con App Router
- TypeScript
- Tailwind CSS
- Supabase
- Zod
- Vitest
- PWA más adelante, no en la primera etapa

## Reglas de trabajo
1. Avanzar módulo por módulo.
2. No implementar el siguiente módulo hasta que el actual funcione.
3. No tomar decisiones de lógica no especificadas: consultar.
4. Comentar el código en español.
5. Mantener el código simple y legible.
6. Preferir Server Components.
7. Usar Client Components solo cuando haya interactividad real.
8. Respetar RLS en todas las operaciones.
9. No hardcodear secrets.
10. Mostrar estados de loading, empty y error.
11. No usar console.error sin manejo.
12. No cambiar archivos no relacionados.

## Estado actual
Módulos core completos. App en preparación para lanzamiento.

## Etapa 0 — Fix críticos (ahora)
- [ ] Renombrar proxy.ts → middleware.ts
- [ ] Commitear actions.ts del alumno
- [ ] Resolver duplicado de rutas de slots del alumno
- [ ] Revisar y limpiar rutas legacy del profesor

## Etapa 1 — MVP lanzamiento (semanas)
- Onboarding mínimo para profesor nuevo
- Link público del profesor para compartir con alumnos
- PWA básica
- Pasarela de pagos: Mercado Pago, mensualidad fija al profesor
  (planes a definir precios)

## Etapa 2 — Post lanzamiento
- Cancha libre / torneos
- Planes y tiers de suscripción
- Rol Club

## Monetización
Mensualidad fija que paga el profesor.
Modelo de planes a definir post-lanzamiento.
El alumno nunca paga a la plataforma.

## Forma de responder
- Explicar qué vas a hacer antes de hacerlo.
- Dividir cambios grandes en pasos pequeños.
- Si hay una duda de implementación, detenerte y consultar.