# CLAUDE.md

Guia corta para Claude Code en este repositorio.

## 1. Rol de Claude Code

Claude Code planifica o implementa segun el prompt recibido.

Reglas base:

- respetar el alcance exacto del prompt
- no reabrir migracion, claim o limpieza legacy si no estan en scope
- no mezclar fases distintas en un mismo corte sin necesidad real

## 2. Snapshot del repo

- Stack base: Next.js 15, React 19, TypeScript y CSS plano.
- `/demo` es la referencia visual.
- `SkyEngine.ts` sigue preservado como motor visual de referencia.
- Runtime ya implementado:
  - `/login` con auth
  - cookies HTTP-only de sesion
  - `/app` lista cielos reales del usuario
  - `POST /api/skies` crea cielo privado + membership `owner`
  - `/app/cielos/[skyId]` valida membresia activa server-side
  - `/app/legacy` redirige al cielo legacy
- Stars runtime completo:
  - read, create, edit, soft-delete
  - canvas visual con SkyEngine (nebula, twinkling, estrellas atmosfericas)
  - coordenadas persistentes y drag-and-drop
  - imagenes por estrella (Firebase Storage + fallback Cloudinary)
  - realtime via Firestore onSnapshot
- Invitaciones implementadas:
  - owner genera enlace copiable (token unico, 7 dias)
  - pagina publica `/invite/[token]` con preview
  - panel de colaboradores con miembros y pendientes
  - revocacion transaccional
- Pendiente actual:
  - presence/cursores (Realtime Database)
  - mejoras de onboarding
  - optimizaciones de producto
- Legacy:
  - `shared-legacy-v1` ya fue importado y validado
  - el cielo legacy ya tiene ownership directa
  - claim legacy superado, no es frente activo
  - Fase 3 archivada: tooling conservado solo como archivo historico

## 3. Reglas de trabajo

- grounding primero: leer el estado real antes de proponer cambios
- mantener cambios pequenos, correctos y acotados al prompt
- si cambia el runtime o el roadmap visible, mantener `README.md` alineado cuando corresponda
- usar `docs/documento-maestro-cielo-estrellado.md` para decisiones de producto, arquitectura y migracion
- no tocar scripts legacy salvo scope explicito
- no reejecutar `migrate:* --execute` salvo evento operativo explicito

## 4. Comandos utiles

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- Tooling legacy (archivo historico, no tooling activo del modelo): `audit:*`, `migrate:*`, `validate:migration`

## 5. MCPs disponibles

- `firebase`: consultar o verificar Firestore/Firebase del proyecto `masmelito-f209c`
- `magicuidesign-mcp`: buscar componentes UI/animaciones reutilizables
- `shadcn`: consultar o agregar componentes de shadcn/ui
- `frontend-design`: apoyo para criterios y propuestas de interfaz

Regla simple: si un MCP resuelve el caso mejor que una consulta manual o un script ad hoc, usar el MCP primero.
