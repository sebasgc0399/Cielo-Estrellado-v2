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
  - reposicionamiento de estrellas ya posicionadas por drag-and-drop en el canvas (mouse/trackpad/pen)
  - click/tap en espacio vacio del canvas abre el create form con coordenadas precargadas
  - render de imagen por estrella: imagePath (Firebase Storage) con fallback a legacyUrl (Cloudinary)
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
## Estado legacy

- El dataset legacy fue importado y validado en `masmelito-f209c`.
- El cielo `shared-legacy-v1` tiene ownership directo asignado. Claim legacy superado.
- Fase 3 (limpieza/archivo) completada: dominio limpio, tooling conservado solo como archivo historico.
- El tooling en `scripts/` refleja el checkpoint de importacion, no el estado runtime actual.

## Arranque local y comandos

1. Instala dependencias: `npm install`
2. Crea y ajusta `.env.local` a partir de `.env.example`
3. Inicia el proyecto: `npm run dev`

Comandos base:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`

Tooling legacy (archivo historico — no es tooling activo del modelo):

- `npm run audit:firestore` — auditoria pre-migracion (solo lectura)
- `npm run audit:cloudinary` — inventario Cloudinary pre-migracion (solo lectura)
- `npm run audit:crossref` — cruce Firestore/Cloudinary pre-migracion (solo lectura)
- `npm run migrate:images` — migracion imagenes completada; no reejecutar con `--execute`
- `npm run migrate:stars` — migracion estrellas completada; no reejecutar con `--execute`
- `npm run validate:migration` — validador del checkpoint historico de importacion;
  fallara contra el estado runtime actual (esperado: el cielo ya tiene owner)

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
- `firestore.indexes.json` versiona los indices requeridos para `collectionGroup('members')` y la coleccion `invites`.

## Siguiente frente

Realtime de stars en `/app/cielos/[skyId]` ya implementado (Firestore onSnapshot).

Proximos frentes por definir: presence/cursores (Realtime Database), mejoras de onboarding, optimizaciones de producto.

Documento principal de decisiones: `docs/documento-maestro-cielo-estrellado.md`
