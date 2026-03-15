/**
 * @deprecated ARCHIVO HISTÓRICO — Auditoría pre-migración completada (Fase 0, 2026).
 * Solo-lectura. Conservado para trazabilidad.
 * Ver docs/legacy-migration-checklist.md.
 *
 * Script de auditoría de la colección legacy 'stars' en Firestore.
 *
 * Uso:
 *   1. Crea un .env.local en la raiz del repo o usa .env
 *   2. Define FIREBASE_SERVICE_ACCOUNT_PATH con la ruta local al JSON
 *   3. Ejecuta: npm run audit:firestore
 *
 * Genera un reporte con:
 *   - Total de documentos
 *   - Valores únicos de createdBy y conteo por cada uno
 *   - Cuántas tienen imagen de Cloudinary
 *   - Rango de fechas (createdAt min/max)
 *   - Campos faltantes o inconsistentes
 *   - Distribución de coordenadas x, y
 */

import './load-env'

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Configuración ---
const SERVICE_ACCOUNT_PATH = resolve(
  process.cwd(),
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./scripts/serviceAccountKey.json"
);
const COLLECTION_NAME = "stars";
const OUTPUT_PATH = resolve(__dirname, "audit-report.json");

// --- Inicializar Firebase Admin ---
let serviceAccount: object;
if (!existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(
    "❌ No se encontro el archivo de service account.\n" +
    `   Ruta esperada: ${SERVICE_ACCOUNT_PATH}\n` +
    "   Define FIREBASE_SERVICE_ACCOUNT_PATH en .env.local o mueve el JSON a scripts/serviceAccountKey.json"
  );
  process.exit(1);
}

try {
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8")) as object;
} catch (error) {
  console.error(
    "❌ No se pudo leer o parsear el JSON de service account.\n" +
    `   Ruta: ${SERVICE_ACCOUNT_PATH}\n` +
    `   Error: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) });
const db = getFirestore();

// --- Tipos ---
interface StarDoc {
  createdAt?: unknown;
  createdBy?: string;
  image?: string;
  message?: string;
  title?: string;
  x?: number;
  y?: number;
  year?: number;
  [key: string]: unknown;
}

interface AuditReport {
  totalDocuments: number;
  uniqueCreators: Record<string, number>;
  creatorCount: number;
  withCloudinaryImage: number;
  withoutImage: number;
  dateRange: { min: string | null; max: string | null };
  missingFields: Record<string, number>;
  extraFields: string[];
  coordinateStats: {
    xMin: number | null;
    xMax: number | null;
    yMin: number | null;
    yMax: number | null;
    appearsNormalized: boolean;
  };
  sampleDocuments: StarDoc[];
}

// --- Auditoría ---
async function audit() {
  console.log(`📊 Auditando colección '${COLLECTION_NAME}'...\n`);

  const snapshot = await db.collection(COLLECTION_NAME).get();

  if (snapshot.empty) {
    console.log("⚠️  La colección está vacía.");
    return;
  }

  const expectedFields = ["createdAt", "createdBy", "image", "message", "title", "x", "y", "year"];
  const creators: Record<string, number> = {};
  const missingFields: Record<string, number> = {};
  const allFieldsSeen = new Set<string>();
  let cloudinaryCount = 0;
  let noImageCount = 0;
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;
  const samples: StarDoc[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data() as StarDoc;

    // Guardar primeras 3 como muestra
    if (samples.length < 3) {
      samples.push({ _id: doc.id, ...data });
    }

    // Campos presentes
    for (const key of Object.keys(data)) {
      allFieldsSeen.add(key);
    }

    // Campos faltantes
    for (const field of expectedFields) {
      if (data[field] === undefined || data[field] === null) {
        missingFields[field] = (missingFields[field] || 0) + 1;
      }
    }

    // Creadores
    const creator = data.createdBy ?? "(sin createdBy)";
    creators[creator] = (creators[creator] || 0) + 1;

    // Imágenes
    if (data.image && typeof data.image === "string") {
      if (data.image.includes("cloudinary") || data.image.startsWith("http")) {
        cloudinaryCount++;
      }
    } else {
      noImageCount++;
    }

    // Fechas
    let docDate: Date | null = null;
    if (data.createdAt) {
      if (typeof (data.createdAt as { toDate?: () => Date }).toDate === "function") {
        docDate = (data.createdAt as { toDate: () => Date }).toDate();
      } else if (typeof data.createdAt === "string" || typeof data.createdAt === "number") {
        docDate = new Date(data.createdAt as string | number);
      }
    }
    if (docDate && !isNaN(docDate.getTime())) {
      if (!minDate || docDate < minDate) minDate = docDate;
      if (!maxDate || docDate > maxDate) maxDate = docDate;
    }

    // Coordenadas
    if (typeof data.x === "number") {
      if (data.x < xMin) xMin = data.x;
      if (data.x > xMax) xMax = data.x;
    }
    if (typeof data.y === "number") {
      if (data.y < yMin) yMin = data.y;
      if (data.y > yMax) yMax = data.y;
    }
  }

  // Detectar campos extra (no esperados)
  const extraFields = [...allFieldsSeen].filter((f) => !expectedFields.includes(f));

  // Determinar si las coordenadas parecen normalizadas
  const appearsNormalized = xMax <= 1 && yMax <= 1 && xMin >= 0 && yMin >= 0;

  const report: AuditReport = {
    totalDocuments: snapshot.size,
    uniqueCreators: creators,
    creatorCount: Object.keys(creators).length,
    withCloudinaryImage: cloudinaryCount,
    withoutImage: noImageCount,
    dateRange: {
      min: minDate?.toISOString() ?? null,
      max: maxDate?.toISOString() ?? null,
    },
    missingFields,
    extraFields,
    coordinateStats: {
      xMin: xMin === Infinity ? null : xMin,
      xMax: xMax === -Infinity ? null : xMax,
      yMin: yMin === Infinity ? null : yMin,
      yMax: yMax === -Infinity ? null : yMax,
      appearsNormalized,
    },
    sampleDocuments: samples,
  };

  // Mostrar resumen en consola
  console.log("=== REPORTE DE AUDITORÍA ===\n");
  console.log(`Total de estrellas: ${report.totalDocuments}`);
  console.log(`Creadores únicos: ${report.creatorCount}`);
  Object.entries(creators)
    .sort((a, b) => b[1] - a[1])
    .forEach(([creator, count]) => {
      console.log(`  - ${creator}: ${count} estrellas`);
    });
  console.log(`\nCon imagen (Cloudinary/URL): ${report.withCloudinaryImage}`);
  console.log(`Sin imagen: ${report.withoutImage}`);
  console.log(`\nRango de fechas: ${report.dateRange.min ?? "N/A"} → ${report.dateRange.max ?? "N/A"}`);
  console.log(`\nCoordenadas X: [${report.coordinateStats.xMin}, ${report.coordinateStats.xMax}]`);
  console.log(`Coordenadas Y: [${report.coordinateStats.yMin}, ${report.coordinateStats.yMax}]`);
  console.log(`Parecen normalizadas [0,1]: ${report.coordinateStats.appearsNormalized}`);

  if (Object.keys(missingFields).length > 0) {
    console.log("\nCampos faltantes:");
    Object.entries(missingFields).forEach(([field, count]) => {
      console.log(`  - ${field}: falta en ${count} documentos`);
    });
  }

  if (extraFields.length > 0) {
    console.log(`\nCampos extra encontrados: ${extraFields.join(", ")}`);
  }

  console.log("\nMuestra de documentos:");
  samples.forEach((s, i) => {
    console.log(`  [${i + 1}]`, JSON.stringify(s, null, 2).split("\n").join("\n      "));
  });

  // Guardar reporte completo
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n✅ Reporte guardado en: ${OUTPUT_PATH}`);
}

audit().catch((err) => {
  console.error("Error durante la auditoría:", err);
  process.exit(1);
});
