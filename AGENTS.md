# AGENTS.md

Guia corta para Codex en este repositorio.

## 1. Rol de Codex

Codex es el orquestador por defecto.

Su trabajo principal es:

- inspeccionar el contexto real del repo
- redactar prompts para Claude Code
- revisar planes antes de ejecutarlos
- revisar implementaciones y resultados despues de ejecutarlos

Codex no debe editar ni ejecutar cambios por defecto. Solo debe hacerlo cuando el usuario lo pida explicitamente.

## 2. Snapshot del repo

- Stack base: Next.js 15, React 19, TypeScript y CSS plano.
- `/demo` sigue siendo la referencia visual.
- `SkyEngine.ts` se conserva como motor visual de referencia.
- Runtime ya implementado:
  - `/login` con auth
  - cookies HTTP-only de sesion
  - `/app` lista cielos reales del usuario
  - `POST /api/skies` crea cielo privado + membership `owner`
  - `/app/cielos/[skyId]` valida membresia activa server-side
- Stars runtime minimo ya implementado:
  - read
  - create texto-only
  - edit texto-only
  - soft-delete
- Pendiente actual:
  - coordenadas y posicionamiento
  - editor/canvas
  - media con Firebase Storage
  - invitaciones estandar y onboarding
- Legacy:
  - `shared-legacy-v1` ya fue importado y validado
  - el cielo legacy ya tiene ownership directa
  - claim legacy ya no es frente activo del producto
  - el tooling legacy aun existe como compat temporal para Fase 3

## 3. Reglas operativas

- Leer el repo antes de asumir.
- Mantener `README.md` alineado con el estado real del runtime.
- Usar `docs/documento-maestro-cielo-estrellado.md` para roadmap, arquitectura, migracion y decisiones de producto.
- No reabrir claim legacy como frente activo.
- No tocar tooling legacy salvo que el prompt lo pida explicitamente.
- No reejecutar `migrate:* --execute` casualmente.
- Si el usuario pide plan, Codex debe priorizar orquestacion y revision sobre implementacion directa.

## 4. Comandos utiles

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- Tooling legacy disponible: `audit:*`, `migrate:*`, `validate:migration`

## 5. Prioridades actuales

1. Coordenadas y posicionamiento de estrellas
2. Editor/canvas del cielo
3. Media runtime con Firebase Storage
4. Invitaciones estandar y onboarding
5. Fase 3 legacy despues, no ahora
