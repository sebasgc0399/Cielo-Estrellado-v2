# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 1. Project Overview

Cielo Estrellado v4 is a collaborative "emotional sky" web app where users create personal skies with meaningful stars, images, messages, and memories.

Current repository state:

- Next.js 15 with App Router is the active runtime base.
- React 19 and TypeScript are in place.
- `/demo` is the visual baseline and current working reference.
- `SkyEngine.ts` is preserved as the current Canvas 2D rendering core.
- Auth, secure sessions, CRUD for skies, invitations, runtime Firebase integration, and Firebase Storage uploads are not implemented yet.

Legacy status:

- Fase 0 is closed at the audit/specification level.
- Confirmed legacy audit: 27 stars, 2 creators, 26 referenced images that migrate, 1 orphan asset in `stars/` excluded from automatic import, and 53 Cloudinary assets outside migration scope (`samples/**` or root assets).
- Real migration should not start before the official Firestore backup to GCS is completed and documented.

Operational priority right now:

1. Official Firestore backup to GCS
2. Referenced image migration script: Cloudinary -> Firebase Storage
3. Legacy star import script to the new schema
4. Post-migration validation script

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
```

## 3. Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Firebase Admin SDK for scripts, Firebase client/runtime integration planned for later phases, plain CSS.

**Path alias:** `@/*` -> `./src/*`

### Source layout

- `src/app/`: Next.js App Router. Home redirects to `/demo`.
- `src/app/demo/`: demo route and loader for the visual baseline.
- `src/components/sky/`: React UI layer around the sky renderer.
- `src/engine/SkyEngine.ts`: Canvas 2D visual engine and animation loop.
- `scripts/`: audit scripts and JSON reports for legacy inspection.
- `docs/`: master document and migration checklist.

### Rendering architecture

The sky renderer is fully client-side. React owns the shell and UI state, while `SkyEngine` owns drawing, animation, pointer effects, and layered canvas behavior.

### State management

- Pure React hooks
- No external state library
- No runtime data fetching yet

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
- `FIREBASE_SERVICE_ACCOUNT_PATH` apunta a un JSON local y nunca debe committearse
- `NEXT_PUBLIC_FIREBASE_*` ya existe como contrato, pero todavia no se consume en runtime
- Cloudinary solo es necesario para auditoria y migracion legacy

## 6. Key Product and Data Decisions

- `sky` is the root entity; stars must belong to a sky.
- The legacy `stars` collection stays intact during migration.
- Legacy coordinates are preserved approximately as normalized values:
  - `xNormalized = clamp(x / 100, 0, 1)`
  - `yNormalized = clamp(y / 100, 0, 1)`
- Canvas 2D is the MVP rendering choice. WebGL is post-MVP evaluation.
- Firebase is the long-term ecosystem for auth, data, storage, and real-time features.
- Cloudinary is a legacy source, not the target media platform.
- Only the 26 images referenced by Firestore are candidates for automatic migration.
- The orphan asset `stars/vnpubgfatrjzrepaccrz` stays excluded pending review.
- Backup before migration is mandatory:
  - official Firestore export to GCS
  - local audit snapshots kept current

## 7. Working Rules for Claude Code

- Read `docs/documento-maestro-cielo-estrellado.md` before proposing architecture, roadmap, migration, or product-flow changes.
- Keep `README.md` aligned with the real runtime state. Do not present planned features as implemented.
- Treat the legacy checklist as an operational gate, not as optional documentation.
- Never write to the legacy collection as part of exploratory work.
- Migration scripts must be idempotent, traceable, and safe to re-run.
- If changing migration behavior, update the master document and checklist in the same turn when appropriate.
- Prefer repository-consistent solutions: Next.js App Router, focused modules, plain CSS, minimal abstractions.

## 8. Current Phase and Priorities

The repository has a working visual scaffold, but the next practical priority is not auth yet.

Current sequence should be:

1. Complete and record the official Firestore backup to GCS
2. Implement the script that copies the 26 referenced images to Firebase Storage
3. Implement the star import script to the new schema
4. Implement post-migration validation
5. Continue with auth, sessions, skies, permissions, and collaboration flows

For full product, data, and roadmap context, use `docs/documento-maestro-cielo-estrellado.md` as the main decision document.
