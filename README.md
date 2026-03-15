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
  - `/app/legacy` redirige al cielo legacy importado
- Stars runtime implementado en `/app/cielos/[skyId]`:
  - lectura de estrellas
  - creacion con coordenadas opcionales
  - edicion de titulo, mensaje y posicion
  - soft-delete
  - canvas visual con motor SkyEngine (nebula, twinkling, estrellas atmosfericas)
  - estrellas reales del usuario renderizadas en el canvas con coordenadas persistentes
  - seleccion de estrellas en canvas con scroll a card
  - picker de coordenadas integrado en el canvas durante create/edit, con inputs manuales como fallback accesible
- Pendiente actual:
  - interaccion avanzada en canvas (drag-and-drop de estrellas, create directo)
  - media con Firebase Storage
  - invitaciones estandar y onboarding
  - realtime mas adelante

## Estado legacy

- El dataset legacy ya fue importado y validado en `masmelito-f209c`.
- El cielo importado existe como `shared-legacy-v1`.
- Ese cielo ya tiene ownership directa asignada.
- El claim legacy ya no es un frente activo del producto.
- El tooling legacy se conserva solo para validacion operativa y archivo futuro.
- La Fase 3 de limpieza/archivo legacy sigue pendiente y no es prioridad actual.

## Arranque local y comandos

1. Instala dependencias: `npm install`
2. Crea y ajusta `.env.local` a partir de `.env.example`
3. Inicia el proyecto: `npm run dev`

Comandos base:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

Tooling legacy:

- `npm run audit:firestore`
- `npm run audit:cloudinary`
- `npm run audit:crossref`
- `npm run migrate:images`
- `npm run migrate:stars`
- `npm run validate:migration`

No reejecutes `migrate:* --execute` casualmente despues de una corrida validada.

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
- Cloudinary legacy:
  - `CLOUDINARY_*`

Notas:

- `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON local y no debe versionarse.
- Cloudinary solo es necesario para auditoria y migracion legacy.
- `firestore.indexes.json` versiona el indice requerido para `collectionGroup('members')`.

## Siguiente frente

Orden recomendado:

1. Interaccion avanzada en canvas (drag-and-drop, create directo sobre lienzo)
3. Media runtime con Firebase Storage
4. Invitaciones estandar y onboarding

Documento principal de decisiones: `docs/documento-maestro-cielo-estrellado.md`
