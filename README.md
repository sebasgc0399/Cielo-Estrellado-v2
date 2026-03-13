# Cielo Estrellado

Base actual del proyecto para el relanzamiento de Cielo Estrellado. El repositorio ya no usa Vite como runtime principal: hoy corre sobre Next.js 15 con App Router y conserva el motor visual del cielo como referencia para no regresionar la experiencia base.

## Estado actual

- Migracion visual a Next.js completada.
- Ruta de referencia: `/demo`.
- `SkyEngine.ts` se conserva sin cambios funcionales.
- Hardening previo a Fase 2 aplicado:
  - ESLint CLI no interactivo.
  - Scripts de auditoria para Firestore y Cloudinary.
  - Contrato de entorno con `.env.example` y `.env.local`.

Todavia no estan implementados en runtime:

- Autenticacion
- Sesiones seguras
- CRUD de cielos
- Storage en Firebase
- Invitaciones y colaboracion

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

## Variables de entorno

Archivo versionado:

- `.env.example`

Archivo local ignorado por Git:

- `.env.local`

Variables actuales:

- `APP_URL`
- `SESSION_COOKIE_NAME`
- `FIREBASE_SERVICE_ACCOUNT_PATH`
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

- `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON local y no debe versionarse.
- Las variables `NEXT_PUBLIC_*` se dejan preparadas para Fase 2; hoy la app aun no las consume.
- Cloudinary solo es necesario para `audit:cloudinary`.
- Los reportes de auditoria legacy pueden contener contenido real del sistema anterior y deben tratarse como archivos locales sensibles.

## Scripts

- `npm run dev`: levanta Next.js en local.
- `npm run build`: compila produccion y valida tipos.
- `npm run lint`: ejecuta ESLint de forma no interactiva.
- `npm run typecheck`: corre TypeScript sin emitir archivos.
- `npm run audit:firestore`: audita la coleccion legacy `stars` en Firestore.
- `npm run audit:cloudinary`: inventaria imagenes en Cloudinary.
- `npm run audit:crossref`: cruza Firestore con Cloudinary y genera el plan de migracion legacy.

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

Politica actual cerrada:

- Solo se migran assets referenciados por Firestore.
- Los assets en `samples/**`, assets root y el huerfano de `stars/` quedan fuera del import automatico.
- Las coordenadas legacy se preservan de forma aproximada como valores normalizados `0..1`.
- Para este dataset, la importacion se resuelve de forma manual como un unico cielo `shared-legacy-v1`; no se infiere automaticamente por `createdBy`.
- El claim legacy requiere email verificado, revision administrativa y el primer claim aprobado solo habilita acceso limitado como `legacy_claimant`.

## Documentacion

- Documento maestro: [docs/documento-maestro-cielo-estrellado.md](docs/documento-maestro-cielo-estrellado.md)
- Checklist de migracion legacy: [docs/legacy-migration-checklist.md](docs/legacy-migration-checklist.md)

## Siguiente paso recomendado

Antes de entrar a autenticacion y sesiones:

- correr `build`, `lint`, `typecheck` y las tres auditorias
- registrar el backup oficial de Firestore en GCS
- revisar el checklist de migracion legacy
