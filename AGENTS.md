# Misu — Instrucciones del proyecto

## Objetivo
Construir una app SaaS web/PWA para profesores de tenis y pádel y clubes.

---

## Stack obligatorio
- Next.js con App Router
- TypeScript
- Tailwind CSS
- Supabase
- Zod
- Vitest

---

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

---

## 🧠 PRODUCT RULES (CRÍTICO)

### Principio general
La app se organiza por dominios claros, con una única fuente de verdad por responsabilidad.
Se prioriza: claridad, simplicidad, consistencia y separación de responsabilidades.

---

### 1. Onboarding

- El onboarding tiene una única fuente de verdad: `Perfil`.
- Ningún otro módulo puede recalcularlo.
- Se modela por hitos con estados:
  - pendiente
  - en_progreso
  - completo
  - bloqueado
- Vive dentro de `Perfil/Ajustes`.

#### Accesibilidad
- Puede ser accesible desde `Clases` como entry point.
- Otros módulos solo pueden mostrar indicadores pasivos.

#### Prohibido
- Duplicar onboarding en múltiples pantallas
- Recalcular estado en otros módulos
- Mostrar progreso completo fuera de Perfil

---

### 2. Navegación

Navbar fija (no condicional):

- Clases
- Disponibilidad
- Paquetes
- Finanzas
- Perfil/Ajustes

#### Reglas
- No cambia según estado del usuario
- Configuración no es sección independiente
- No hay items dinámicos

---

### 3. Dominios (separación estricta)

- Clases → calendario y reservas
- Disponibilidad → horarios y bloqueos
- Finanzas → dinero y reportes
- Paquetes → paquetes y asignaciones
- Perfil → datos, configuración y onboarding

#### Regla clave
Ningún módulo invade el dominio de otro.

---

### 4. Finanzas

- No puede contener onboarding
- No banners ni CTAs de configuración

#### Estructura
- Resumen (lectura rápida)
- Detalle (tablas y trazabilidad)

---

### 5. Contrato entre módulos

Otros módulos solo pueden consumir:

```ts
is_ready: boolean
missing_requirements: string[]