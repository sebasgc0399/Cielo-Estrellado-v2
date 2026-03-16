# Cielo Estrellado

Cielo Estrellado v4 es el relanzamiento del producto sobre Next.js 15 con App Router. El repo conserva `/demo` como baseline visual y evoluciona el runtime real en `/app` sobre Firebase.

## Estado actual

- Stack base: Next.js 15, React 19, TypeScript y CSS plano.
- Rutas publicas:
  - `/` redirige a `/demo`
  - `/demo` como referencia visual
  - `/login` para autenticacion
- Auth y sesion ya implementados:
  - email/password y Google
  - cookies HTTP-only via `/api/auth/session` y `/api/auth/logout`
  - `middleware.ts` protege `/app/**`
- Runtime privado ya implementado:
  - `/app` lista los cielos reales del usuario
  - `POST /api/skies` crea un cielo privado y su membership `owner`
  - `/app/cielos/[skyId]` valida membresia activa server-side
- Stars runtime implementado en `/app/cielos/[skyId]`:
  - lectura de estrellas
  - creacion con coordenadas opcionales
  - edicion de titulo, mensaje y posicion
  - soft-delete
  - canvas visual con motor SkyEngine (nebula, twinkling, estrellas atmosfericas)
  - estrellas reales del usuario renderizadas en el canvas con coordenadas persistentes
  - seleccion de estrellas en canvas con scroll a card
  - picker de coordenadas integrado en el canvas durante create/edit, con inputs manuales como fallback accesible
  - reposicionamiento de estrellas ya posicionadas por drag-and-drop en el canvas (mouse/trackpad/pen)
  - click/tap en espacio vacio del canvas abre el create form con coordenadas precargadas
  - render de imagen por estrella: imagePath (Firebase Storage)
  - attach de primera imagen desde el edit form cuando la estrella no tiene imagen Storage
  - actualizacion en tiempo real via Firestore onSnapshot: carga inicial SSR + suscripcion en vivo; cambios de cualquier colaborador se reflejan sin recargar la pagina
- Invitaciones implementadas en `/app/cielos/[skyId]`:
  - owner genera un enlace copiable (token unico, 7 dias de vigencia)
  - pagina publica `/invite/[token]` con preview del cielo y rol asignado
  - flujo logged-out: preview → login → volver al invite → aceptar
  - aceptacion crea membresia activa; invite queda marcado como `accepted`
- Panel de colaboradores en `/app/cielos/[skyId]` (solo owner):
  - lista de miembros activos con nombre, email y rol
  - lista de invitaciones pendientes (no expiradas) con fecha de expiracion
  - revocacion de invitaciones pendientes (transaccional, con manejo de race conditions)
  - generacion de nuevos enlaces de invitacion integrada en el mismo panel
- Onboarding minimo: estado vacio en `/app` con CTA "Crear mi primer cielo"

## Arranque local y comandos

1. Instala dependencias: `npm install`
2. Crea y ajusta `.env.local` a partir de `.env.example`
3. Inicia el proyecto: `npm run dev`

Comandos base:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

## Variables y entorno

- Archivo versionado: `.env.example`
- Archivo local: `.env.local`

Grupos relevantes:

- App y sesion:
  - `APP_URL`
  - `SESSION_COOKIE_NAME`
- Firebase server/admin:
  - `FIREBASE_SERVICE_ACCOUNT_PATH`
  - `FIREBASE_STORAGE_BUCKET`
- Firebase client:
  - `NEXT_PUBLIC_FIREBASE_*`

Notas:

- `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON local y no debe versionarse.
- `firestore.indexes.json` versiona los indices requeridos para `collectionGroup('members')` y la coleccion `invites`.

## Siguiente frente

Proximos frentes por definir: presence/cursores (Realtime Database), mejoras de onboarding, optimizaciones de producto.

Documento principal de decisiones: `docs/documento-maestro-cielo-estrellado.md`
