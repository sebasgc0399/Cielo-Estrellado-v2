# Legacy Migration Checklist

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

## Backups requeridos antes de migrar

- [ ] Export oficial de Firestore a GCS completado.
- [ ] Ruta del backup GCS registrada fuera del repo.
- [ ] `scripts/audit-report.json` vigente.
- [ ] `scripts/cloudinary-report.json` vigente.
- [ ] `scripts/migration-crossref-report.json` vigente.

## Checklist go / no-go

- [ ] Conteo esperado de estrellas: `27`.
- [ ] Conteo esperado de assets migrables: `26`.
- [ ] Conteo esperado de estrellas sin imagen: `1`.
- [ ] Conteo esperado de assets huerfanos en `stars/`: `1`.
- [ ] Cero estrellas con `imageMigrationStatus = missing_in_cloudinary_report`.
- [ ] Cero coordenadas normalizadas fuera de `0..1`.
- [ ] Conteo por `createdBy` confirmado para crear un cielo importado por autor.
- [ ] Politica de exclusiones documentada y aprobada.

## Cola de implementacion

1. Script de cruce Firestore -> Cloudinary -> reporte.
2. Script de migracion de imagenes referenciadas a Firebase Storage.
3. Script de migracion de estrellas a nuevo esquema con `xNormalized` y `yNormalized`.
4. Script de validacion post-migracion con diff de conteos y media.

## Comandos de referencia

```bash
npm run build
npm run lint
npm run typecheck
npm run audit:firestore
npm run audit:cloudinary
npm run audit:crossref
```
