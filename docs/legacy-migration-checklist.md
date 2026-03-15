# Legacy Migration Checklist

> **ESTADO: ARCHIVADO** — Migración completada (Fase 0-2, 2026). Fase 3 de limpieza ejecutada.
> Cielo `shared-legacy-v1` bajo ownership directo. Claim legacy superado.
>
> **Sobre el tooling conservado:**
> Los scripts en `scripts/` son archivo histórico con semántica del checkpoint de importación.
> `validate-legacy-migration.ts` valida el estado al momento de importación
> (`claimStatus = 'unclaimed'`, `ownerUserId = null`), NO el estado runtime actual.
> Ejecutarlo hoy producirá fallos esperados — el cielo ya tiene owner y puede haber cambiado.
> No reejecutar `migrate:* --execute` ni `validate:migration` como tooling del modelo activo.
>
> Los reportes JSON en `scripts/*.json` son artefactos gitignored de la migración completada,
> no son source of truth activo.

Checklist operativo para cerrar Fase 0 antes de ejecutar cualquier migracion real sobre datos productivos.

## Hallazgos confirmados

- `27` estrellas legacy en Firestore.
- `2` creadores (`createdBy`) detectados.
- `26` estrellas con imagen y `1` estrella sin imagen.
- Coordenadas legacy interpretables como escala `0-100`.
- `80` assets totales en Cloudinary.
- `26` assets realmente referenciados por Firestore.
- `1` asset huerfano en `stars/`: `stars/vnpubgfatrjzrepaccrz`.
- `53` assets fuera del alcance de migracion automatica (`samples/**` + root assets).

## Politica de migracion cerrada

- Migrar solo assets referenciados por Firestore.
- Excluir `samples/**`, root assets y el huerfano en `stars/`.
- Preservar posicion aproximada de estrellas con:
  - `xNormalized = clamp(x / 100, 0, 1)`
  - `yNormalized = clamp(y / 100, 0, 1)`
- Migrar la estrella sin imagen con `imagePath = null`.
- Mantener la coleccion legacy `stars` intacta hasta validar migracion final.
- Importar este dataset en un unico cielo manual `shared-legacy-v1`.
- Persistir los identificadores brutos observados como `legacyCreatorKeys`, no como una interpretacion de participantes.
- El cielo importado nace con `claimStatus = unclaimed` y sin `owner` asignado.
- `npm run audit:crossref` solo genera el preview del import bajo `shared-legacy-v1`; no escribe en Firestore ni en Storage.
- Tratar `scripts/audit-report.json` y `scripts/migration-crossref-report.json` como archivos locales sensibles.

## Backups requeridos antes de migrar

- [ ] Export oficial de Firestore a GCS completado.
- [ ] Ruta del backup GCS registrada fuera del repo.
- [ ] `scripts/audit-report.json` vigente.
- [ ] `scripts/cloudinary-report.json` vigente.
- [ ] `scripts/migration-crossref-report.json` vigente.

## Tooling admin-only (secuencia operativa)

1. `npm run migrate:images -- --dry-run`
2. `npm run migrate:images -- --execute --backup-uri=gs://...`
3. `npm run migrate:stars -- --dry-run`
4. `npm run migrate:stars -- --execute --backup-uri=gs://...`
5. `npm run validate:migration`

Reportes locales esperados (gitignored):

- `scripts/migration-images-report.json`
- `scripts/migration-stars-report.json`
- `scripts/migration-validation-report.json`

## Checklist go / no-go

- [ ] Conteo esperado de estrellas: `27`.
- [ ] Conteo esperado de assets migrables: `26`.
- [ ] Conteo esperado de estrellas sin imagen: `1`.
- [ ] Conteo esperado de assets huerfanos en `stars/`: `1`.
- [ ] Cero estrellas con `imageMigrationStatus = missing_in_cloudinary_report`.
- [ ] Cero coordenadas normalizadas fuera de `0..1`.
- [ ] `legacyCreatorKeys` confirmados para el cielo manual `shared-legacy-v1`.
- [ ] Politica de exclusiones documentada y aprobada.

## Cola de implementacion

1. Mantener y validar el preview de cruce Firestore -> Cloudinary -> reporte.
2. Script de migracion de imagenes referenciadas a Firebase Storage.
3. Script de migracion de estrellas a nuevo esquema bajo `shared-legacy-v1`, con `xNormalized`, `yNormalized` y `legacyCreatorKey`.
4. Script de validacion post-migracion con diff de conteos y media.

## Comandos de referencia

```bash
npm run build
npm run lint
npm run typecheck
npm run audit:firestore
npm run audit:cloudinary
npm run audit:crossref
npm run migrate:images -- --dry-run
npm run migrate:images -- --execute --backup-uri=gs://...
npm run migrate:stars -- --dry-run
npm run migrate:stars -- --execute --backup-uri=gs://...
npm run validate:migration
```
