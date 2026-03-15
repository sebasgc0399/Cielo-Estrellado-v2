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
- Tooling legacy (archivo historico, no tooling activo del modelo): `audit:*`, `migrate:*`, `validate:migration`

## 5. Prioridades actuales

1. Presence/cursores (Realtime Database)
2. Mejoras de onboarding
3. Optimizaciones de producto
