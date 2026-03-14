# Cielo Estrellado

Base actual del proyecto para el relanzamiento de Cielo Estrellado. El repositorio ya no usa Vite como runtime principal: hoy corre sobre Next.js 15 con App Router y conserva el motor visual del cielo como referencia para no regresionar la experiencia base.

## Estado actual

### Runtime actual

- Migracion visual a Next.js completada.
- Rutas publicas actuales:
  - `/` redirige a `/demo`
  - `/demo` como baseline visual
  - `/login` para autenticacion
- `SkyEngine.ts` se conserva sin cambios funcionales.
- Hardening base aplicado:
  - ESLint CLI no interactivo.
  - Scripts de auditoria y migracion legacy.
  - Contrato de entorno con `.env.example` y `.env.local`.
- Auth runtime base ya implementada:
  - Firebase Auth client con email/password y Google
  - cookies HTTP-only via `/api/auth/session` y `/api/auth/logout`
  - `middleware.ts` para proteger rutas privadas
  - sincronizacion de `users/{uid}` en Firestore al iniciar sesion
- Shell autenticado minimo ya implementado:
  - `/app`
  - `/app/perfil`
  - `/app/legacy`
- Integracion runtime minima con Firebase ya implementada:
  - Auth client en navegador
  - Firebase Admin en rutas server
  - lectura server-side de `users/{uid}` en `/app/perfil`
  - lectura server-side de cielos del usuario en `/app`
  - creacion de cielos privados y membresia owner en Firestore via `/api/skies`
  - ruta detalle de cielo en `/app/cielos/[skyId]` con validacion server-side de membresia activa
  - la ruta detalle muestra metadata del cielo (titulo, rol, privacy, source, fecha) y un placeholder honesto para stars

Todavia no estan implementados en runtime:

- Stars runtime (lectura, creacion y edicion de estrellas en cielos)
- Editor runtime del cielo (comportamiento de edicion de metadatos y canvas)
- Flujo runtime de invitaciones
- Flujo runtime de claim legacy
- Integracion runtime de media con Firebase Storage
- Reenvio de verificacion de email y onboarding completo post-login

### Estado legacy verificado en el entorno actual (`masmelito-f209c`)

- La migracion legacy base ya fue ejecutada y validada en el entorno Firebase actual.
- El dataset legacy actual quedo importado como un unico cielo manual `shared-legacy-v1`.
- Se preservaron los identificadores brutos `legacyCreatorKeys`.
- Se migraron `26` imagenes referenciadas a Firebase Storage.
- Se migraron `27` estrellas al esquema nuevo bajo `skies/shared-legacy-v1/stars`.
- La validacion post-migracion cerro con `0` errores.
- El cielo importado permanece en `claimStatus = unclaimed` y `ownerUserId = null`.
- El primer claim aprobado sigue resolviendose como `legacy_claimant`, no como `owner`.
- La corrida validada uso backup oficial a GCS registrado fuera del repo.

## Requisitos locales

- Node.js 20 LTS recomendado
- npm

## Primer arranque

1. Instala dependencias:

```bash
npm install
```

2. Revisa `.env.example` y ajusta `.env.local`.

3. Inicia el proyecto:

```bash
npm run dev
```

4. Abre `http://localhost:3000/demo`.

Tambien puedes abrir `http://localhost:3000/login` para probar auth y el shell privado en `/app`.

## Variables de entorno

Archivo versionado:

- `.env.example`

Archivo local ignorado por Git:

- `.env.local`

Variables actuales:

- `APP_URL`
- `SESSION_COOKIE_NAME`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
- `FIREBASE_STORAGE_BUCKET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Notas:

- `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON local y no debe versionarse; hoy lo usan scripts legacy y runtime server para auth/sesion.
- `FIREBASE_STORAGE_BUCKET` es script-only para tooling admin (`migrate:*`, `validate:migration`) y no debe acoplarse a `NEXT_PUBLIC_*`.
- Las variables `NEXT_PUBLIC_*` ya se consumen en runtime para Firebase Auth.
- `SESSION_COOKIE_NAME` ya se consume en runtime para la cookie de sesion HTTP-only.
- `firestore.indexes.json` versiona el indice compuesto necesario para cargar cielos del usuario con `collectionGroup('members')`; debes aplicarlo en el proyecto Firebase antes de usar `/app` en un entorno nuevo.
- Cloudinary solo es necesario para `audit:cloudinary` y migracion legacy.
- Los reportes de auditoria y migracion legacy pueden contener contenido real o metadata sensible del sistema anterior y deben tratarse como archivos locales sensibles.

## Scripts

- `npm run dev`: levanta Next.js en local.
- `npm run build`: compila produccion y valida tipos.
- `npm run start`: levanta la build de produccion local.
- `npm run lint`: ejecuta ESLint de forma no interactiva.
- `npm run typecheck`: corre TypeScript sin emitir archivos.
- `npm run audit:firestore`: audita la coleccion legacy `stars` en Firestore.
- `npm run audit:cloudinary`: inventaria imagenes en Cloudinary.
- `npm run audit:crossref`: cruza Firestore con Cloudinary y genera un preview del plan de migracion legacy.
- `npm run migrate:images`: migra media legacy referenciada a Firebase Storage (dry-run por defecto).
- `npm run migrate:stars`: migra estrellas legacy al esquema `skies/shared-legacy-v1/stars` (dry-run por defecto).
- `npm run validate:migration`: valida Firestore + Storage post-migracion contra reportes.

Estado verificado del entorno actual:

- `migrate:images` ya fue ejecutado con `uploaded = 26` y `failed = 0`.
- `migrate:stars` ya fue ejecutado con `upserted = 27` y `failed = 0`.
- `validate:migration` ya fue ejecutado con `errors = 0`.

## Auditoria legacy

### Firestore

Prerequisitos:

- Un JSON de service account local.
- `FIREBASE_SERVICE_ACCOUNT_PATH` configurado en `.env.local`, o bien el archivo en `scripts/serviceAccountKey.json`.

Ejecutar:

```bash
npm run audit:firestore
```

Salida:

- `scripts/audit-report.json`

### Cloudinary

Prerequisitos:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Ejecutar:

```bash
npm run audit:cloudinary
```

Salida:

- `scripts/cloudinary-report.json`

### Cruce Firestore - Cloudinary

Prerequisitos:

- `scripts/audit-report.json` vigente.
- `scripts/cloudinary-report.json` vigente.
- `FIREBASE_SERVICE_ACCOUNT_PATH` accesible.

Ejecutar:

```bash
npm run audit:crossref
```

Salida:

- `scripts/migration-crossref-report.json`

Notas:

- `npm run audit:crossref` no ejecuta la migracion real ni escribe en Firestore o Storage; solo prepara y valida el preview del import.
- El reporte generado por `audit:crossref` sigue siendo preparatorio, aun cuando la corrida base ya se haya ejecutado en el entorno actual.

## Tooling de migracion legacy (admin-only)

La corrida base ya fue ejecutada y validada en el entorno Firebase actual. Esta seccion documenta el tooling y la forma segura de repetirlo solo si existe una necesidad operativa real.

Precondiciones operativas antes de cualquier `--execute`:

- Export oficial de Firestore a GCS completado y registrado fuera del repo.
- `npm run audit:firestore`, `npm run audit:cloudinary` y `npm run audit:crossref` vigentes.
- Baseline del crossref en verde: `27/26/1/1/0` (`stars/referencedAssets/starsWithoutImage/orphaned/missingInCloudinary`).
- `FIREBASE_SERVICE_ACCOUNT_PATH` y `FIREBASE_STORAGE_BUCKET` apuntando al mismo entorno/proyecto.

Comandos:

```bash
npm run migrate:images -- --dry-run
npm run migrate:images -- --execute --backup-uri=gs://...

npm run migrate:stars -- --dry-run
npm run migrate:stars -- --execute --backup-uri=gs://...

npm run validate:migration
```

Salidas locales (gitignored):

- `scripts/migration-images-report.json`
- `scripts/migration-stars-report.json`
- `scripts/migration-validation-report.json`

Gates importantes:

- `migrate:*` requiere `--backup-uri=gs://...` en modo `--execute`.
- `migrate:stars` exige `migration-images-report.json` sin `failed`.
- `validate:migration` retorna codigo no-cero ante faltantes, extras, duplicados o mismatch de contrato.
- Los scripts son idempotentes, pero no deben re-ejecutarse casualmente despues de una corrida valida; solo ante una necesidad operativa clara y con backup fresco.

Politica actual cerrada:

- Solo se migran assets referenciados por Firestore.
- Los assets en `samples/**`, assets root y el huerfano de `stars/` quedan fuera del import automatico.
- Las coordenadas legacy se preservan de forma aproximada como valores normalizados `0..1`.
- Para este dataset, la importacion se resuelve de forma manual como un unico cielo `shared-legacy-v1`; no se infiere automaticamente por `createdBy`.
- No existe deteccion automatica de identidad legacy por email, nombre ni heuristicas; cualquier usuario con email verificado y sin claim activo ve el CTA `Solicitar revision de cielo legacy`.
- El claim legacy requiere email verificado, revision administrativa y el primer claim aprobado solo habilita acceso limitado como `legacy_claimant`.
- Solo puede existir un claim activo por combinacion `(skyId, legacyCreatorKey, claimantUserId)`.

## Documentacion

- Documento maestro: [docs/documento-maestro-cielo-estrellado.md](docs/documento-maestro-cielo-estrellado.md)
- Checklist de migracion legacy: [docs/legacy-migration-checklist.md](docs/legacy-migration-checklist.md)

## Siguiente paso recomendado

Siguiente frente de trabajo sobre la base ya migrada, autenticada y con detalle de cielo:

- expandir el detalle de cielo con stars runtime (lectura, creacion y edicion de estrellas)
- integrar soporte runtime de media con Firebase Storage
- construir claim legacy, invitaciones y onboarding sobre la base ya autenticada
- conservar el tooling de migracion solo para validacion operativa o re-ejecuciones justificadas
