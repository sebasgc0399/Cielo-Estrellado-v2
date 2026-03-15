# AGENTS.md

This file provides guidance to coding agents working in this repository.

## 1. Project Overview

Cielo Estrellado v4 is a collaborative "emotional sky" web app where users create personal skies with meaningful stars, images, messages, and memories.

Current repository state:

- Next.js 15 with App Router is the active runtime base.
- React 19 and TypeScript are in place.
- `/demo` is the visual baseline and current working reference.
- `SkyEngine.ts` is preserved as the current Canvas 2D rendering core.
- Runtime auth/session is already implemented:
  - `/login` with email/password and Google sign-in
  - HTTP-only session cookies via `/api/auth/session` and `/api/auth/logout`
  - `middleware.ts` protecting `/app/**`
  - authenticated shell in `/app` and `/app/perfil` (`/app/legacy` redirects to the legacy sky detail)
- Minimum runtime sky base is already implemented:
  - `/app` reads the authenticated user's skies from Firestore
  - `POST /api/skies` creates a private sky plus the owner membership
  - `firestore.indexes.json` versions the required `collectionGroup('members')` index
  - `/app/cielos/[skyId]` is a protected detail route that validates active membership server-side and shows sky metadata (title, role, privacy, source, date) with stars runtime: read, create, edit, and soft-delete text-only stars, role-based permissions (owner edits/deletes any star, editor edits/deletes only own stars)
- Stars runtime includes read, create, edit, and soft-delete. Not yet implemented: canvas positioning (coordinates), media uploads, editor/canvas integration, invitations, realtime, and Firebase Storage media flows.

Legacy status:

- Fase 0 is closed at the audit/specification level.
- Confirmed legacy audit: 27 stars, 2 creators, 26 referenced images that migrate, 1 orphan asset in `stars/` excluded from automatic import, and 53 Cloudinary assets outside migration scope (`samples/**` or root assets).
- The base legacy migration has already been executed and validated in the current Firebase environment (`masmelito-f209c`).
- The imported legacy sky exists as `shared-legacy-v1`, with `legacyCreatorKeys` preserved and a clean validation result (`errors = 0`).
- The legacy sky now has direct ownership assigned. The claim legacy flow is superseded as an active product front.
- Any future real migration re-run still requires a fresh official Firestore backup to GCS and the same operational gates.

Operational priority right now:

1. Complete sky runtime behavior: coordinates, canvas positioning, and editor/canvas integration
2. Implement storage/runtime support for media (imagePath, Firebase Storage)
3. Build standard invitation flows (editor/viewer) and onboarding on top of the existing base
4. Keep migration tooling available for operational validation or justified re-runs
5. Do not casually re-run real migration scripts after a valid execution

## 2. Commands

```bash
npm run dev          # Next.js dev server -> http://localhost:3000/demo
npm run build        # Production build
npm run lint         # ESLint, non-interactive, --max-warnings=0
npm run typecheck    # tsc --noEmit

# Legacy audit scripts (require .env.local with service account / Cloudinary creds)
npm run audit:firestore    # -> scripts/audit-report.json
npm run audit:cloudinary   # -> scripts/cloudinary-report.json
npm run audit:crossref     # -> scripts/migration-crossref-report.json

# Legacy migration admin-only scripts
npm run migrate:images     # dry-run by default; execute requires --backup-uri=gs://...
npm run migrate:stars      # dry-run by default; execute requires --backup-uri=gs://...
npm run validate:migration # validates Firestore + Storage against migration reports
```

## 3. Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Firebase client auth, Firebase Admin SDK for scripts and runtime server work, plain CSS.

**Path alias:** `@/*` -> `./src/*`

### Source layout

- `src/app/`: Next.js App Router. Home redirects to `/demo`.
- `src/app/login/`: runtime auth entrypoint.
- `src/app/app/`: authenticated shell and private pages, including `/app/cielos/[skyId]` for sky detail.
- `src/app/api/skies/`: sky creation (`POST /api/skies`), stars endpoints (`POST`, `PATCH`, `DELETE` under `/api/skies/[skyId]/stars/[starId]`).
- `src/app/api/auth/`: session creation and logout routes.
- `src/app/demo/`: demo route and loader for the visual baseline.
- `src/components/sky/`: React UI layer around the sky renderer.
- `src/domain/contracts.ts`: persisted domain shapes for users, skies, stars, members, and invites (legacy claim types still present, pending cleanup).
- `src/domain/shared-legacy.ts`: source of truth for `shared-legacy-v1` defaults and import config.
- `src/domain/policies.ts`: source of truth for session and anti-abuse policy defaults.
- `src/lib/auth/`: runtime auth/session helpers and client context.
- `src/lib/firebase/`: Firebase client/admin initialization for runtime.
- `src/lib/skies/`: server-side sky queries for authenticated runtime pages (`getUserSkies`, `getSkyWithAccess`, `getSkyStars`).
- `src/engine/SkyEngine.ts`: Canvas 2D visual engine and animation loop.
- `scripts/`: audit scripts and JSON reports for legacy inspection.
- `docs/`: master document and migration checklist.
- `firestore.indexes.json`: versioned Firestore composite indexes required by runtime queries.

### Rendering architecture

The sky renderer is fully client-side. React owns the shell and UI state, while `SkyEngine` owns drawing, animation, pointer effects, and layered canvas behavior.

### State management

- Pure React hooks
- No external state library
- Minimal runtime data fetching exists for auth/session, `users/{uid}` profile reads, authenticated sky list reads, sky detail reads with membership validation, and stars reads per sky

### Important note about deployment assumptions

`firebase.json` still reflects an older SPA-style hosting setup (`dist` + `index.html`). Do not treat that file as a production-ready Next.js deployment definition without revisiting it first.

## 4. Filosofia de Desarrollo: Complejidad Esencial vs. Accidental

### Abrazar la Complejidad Esencial

Si el problema de producto o de negocio es realmente dificil, la solucion puede requerir logica avanzada.

- No sacrifiques robustez, claridad o trazabilidad por "hacerlo corto".
- Prefiere soluciones correctas y mantenibles aunque sean mas extensas.
- Si auth, permisos, migracion legacy, colaboracion o validaciones de ownership requieren mas detalle, documentalo y modelalo bien.

### Eliminar la Complejidad Accidental (prohibido complicar por gusto)

No introducir herramientas, librerias, patrones o abstracciones innecesarias que aumenten el costo de mantenimiento.

Ejemplos en este proyecto:

- No crear capas extra o arquitecturas ceremoniales si Next.js App Router + modulos bien separados resuelven el caso.
- No crear wrappers genericos sobre Firebase Auth, Firestore, Storage o Cloudinary si no aportan seguridad, testabilidad o consistencia real.
- No crear "helpers genericos" o "frameworks internos" prematuros para migracion, rendering o permisos si solo se van a usar una vez.
- No abstraer el motor visual actual antes de tener necesidades reales que justifiquen esa capa.

### Regla de Oro

La solucion mas simple y directa que resuelva el problema real, de forma segura, eficiente y consistente con la arquitectura actual, es la correcta.

### Criterio de decision (para sugerencias)

Antes de proponer un cambio, justificar:

1. Reduce riesgo o errores reales?
2. Mejora legibilidad o mantenibilidad?
3. Evita repetir bugs o inconsistencias?

Si la respuesta es "no" a las 3, no proponerlo.

## 5. Environment

- Node.js 20 LTS recomendado
- `.env.example` define los nombres de variables
- `.env.local` es local y no debe versionarse
- `FIREBASE_SERVICE_ACCOUNT_PATH` points to a local JSON, must never be committed, and is used by legacy scripts plus runtime server auth/session work
- `FIREBASE_STORAGE_BUCKET` is script-only for admin migration/validation tooling
- `NEXT_PUBLIC_FIREBASE_*` is already consumed by runtime auth
- `SESSION_COOKIE_NAME` is already consumed by the HTTP-only session cookie flow
- Cloudinary solo es necesario para auditoria y migracion legacy
- Legacy audit/migration reports may include real historical content or sensitive metadata and must remain local-only

## 6. Key Product and Data Decisions

- `sky` is the root entity; stars must belong to a sky.
- The legacy `stars` collection stays intact during migration.
- The current legacy dataset is imported by explicit manual rule as one sky: `shared-legacy-v1`.
- The current Firebase environment already contains the validated base import for `shared-legacy-v1`.
- Legacy coordinates are preserved approximately as normalized values:
  - `xNormalized = clamp(x / 100, 0, 1)`
  - `yNormalized = clamp(y / 100, 0, 1)`
- Canvas 2D is the MVP rendering choice. WebGL is post-MVP evaluation.
- Firebase is the long-term ecosystem for auth, data, storage, and real-time features.
- Cloudinary is a legacy source, not the target media platform.
- Only the 26 images referenced by Firestore are candidates for automatic migration.
- The orphan asset `stars/vnpubgfatrjzrepaccrz` stays excluded pending review.
- Legacy creator identifiers are stored as raw `legacyCreatorKeys`.
- The legacy sky `shared-legacy-v1` has direct ownership assigned to the primary user. The claim legacy flow is superseded; collaboration with the second legacy creator will use standard invitations (editor role).
- Invitation acceptance requires verified email.
- Backup before migration is mandatory:
  - official Firestore export to GCS
  - local audit snapshots kept current

## 7. Working Rules for Agents

- Read `docs/documento-maestro-cielo-estrellado.md` before proposing architecture, roadmap, migration, or product-flow changes.
- Keep `README.md` aligned with the real runtime state. Do not present planned features as implemented.
- Treat the legacy checklist as an operational gate, not as optional documentation.
- Never write to the legacy collection as part of exploratory work.
- Migration scripts must be idempotent, traceable, and safe to re-run.
- Keep `firestore.indexes.json` aligned with runtime Firestore queries; do not introduce collectionGroup queries without versioning the required indexes.
- `npm run audit:crossref` is a preview/preparation step; it does not execute the real migration.
- Do not reintroduce import-by-`createdBy` as the active migration rule for the current dataset.
- Do not casually re-run `migrate:* --execute` after a clean validated migration. Treat any new execute run as an explicit operational event.
- If changing migration behavior, update the master document and checklist in the same turn when appropriate.
- Keep `src/domain/contracts.ts`, `src/domain/shared-legacy.ts`, and `src/domain/policies.ts` aligned; they are the source of truth for persisted shapes, shared legacy defaults, and policy defaults.
- Prefer repository-consistent solutions: Next.js App Router, focused modules, plain CSS, minimal abstractions.

## 8. Current Phase and Priorities

The repository has a working visual scaffold, a validated migrated legacy base in the current Firebase environment, a minimum auth/session runtime, a sky creation/listing slice, a sky detail route with membership validation, and stars runtime (read, create, edit, soft-delete text-only stars with role-based permissions). The next front is completing sky runtime behavior (coordinates, canvas positioning, editor integration) and then media, not more migration preparation.

Current sequence should be:

1. Complete sky runtime behavior: coordinates, canvas positioning, and editor/canvas integration on top of the existing `/app/cielos/[skyId]`
2. Implement the storage/runtime support required for media (imagePath, Firebase Storage)
3. Build standard invitation runtime flows (editor/viewer) and onboarding
4. Keep migration validation tooling available for operational checks and re-run real migration only if a concrete operational need appears and backup requirements are met

For full product, data, and roadmap context, use `docs/documento-maestro-cielo-estrellado.md` as the main decision document.
