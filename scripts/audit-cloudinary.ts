/**
 * Script de inventario de imágenes en Cloudinary.
 *
 * Uso:
 *   1. Crea un .env.local en la raiz del repo o usa .env
 *      CLOUDINARY_CLOUD_NAME=tu_cloud_name
 *      CLOUDINARY_API_KEY=tu_api_key
 *      CLOUDINARY_API_SECRET=tu_api_secret
 *   2. Ejecuta: npm run audit:cloudinary
 *
 * Genera un reporte con:
 *   - Total de imágenes
 *   - Peso total en MB
 *   - Formatos y dimensiones
 *   - Lista completa de URLs para cruzar con Firestore
 */

import './load-env'

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "cloudinary-report.json");

// --- Configuración ---
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error(
    "❌ Faltan variables de entorno de Cloudinary.\n" +
    "   Configura: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET\n" +
    "   Usa .env.local o .env en la raiz del repo y ejecuta: npm run audit:cloudinary"
  );
  process.exit(1);
}

// --- Tipos ---
interface CloudinaryResource {
  public_id: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
  created_at: string;
  resource_type: string;
}

interface CloudinaryReport {
  totalImages: number;
  totalSizeMB: number;
  formats: Record<string, number>;
  dimensionRanges: {
    widthMin: number | null;
    widthMax: number | null;
    heightMin: number | null;
    heightMax: number | null;
  };
  images: Array<{
    public_id: string;
    url: string;
    format: string;
    sizeMB: number;
    width: number;
    height: number;
    created_at: string;
  }>;
}

// --- Fetch de recursos con paginación ---
async function fetchAllResources(): Promise<CloudinaryResource[]> {
  const all: CloudinaryResource[] = [];
  let nextCursor: string | undefined;
  const authHeader = "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");

  do {
    const url = new URL(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image`);
    url.searchParams.set("max_results", "500");
    if (nextCursor) url.searchParams.set("next_cursor", nextCursor);

    const res = await fetch(url.toString(), {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      throw new Error(`Cloudinary API error: ${res.status} ${await res.text()}`);
    }

    const data = (await res.json()) as { resources: CloudinaryResource[]; next_cursor?: string };
    all.push(...data.resources);
    nextCursor = data.next_cursor;

    console.log(`  Obtenidas ${all.length} imágenes...`);
  } while (nextCursor);

  return all;
}

// --- Auditoría ---
async function audit() {
  console.log(`📊 Inventariando imágenes en Cloudinary (${CLOUD_NAME})...\n`);

  const resources = await fetchAllResources();

  if (resources.length === 0) {
    console.log("⚠️  No se encontraron imágenes.");
    return;
  }

  const formats: Record<string, number> = {};
  let totalBytes = 0;
  let wMin = Infinity, wMax = -Infinity;
  let hMin = Infinity, hMax = -Infinity;

  const images = resources.map((r) => {
    formats[r.format] = (formats[r.format] || 0) + 1;
    totalBytes += r.bytes;
    if (r.width < wMin) wMin = r.width;
    if (r.width > wMax) wMax = r.width;
    if (r.height < hMin) hMin = r.height;
    if (r.height > hMax) hMax = r.height;

    return {
      public_id: r.public_id,
      url: r.secure_url,
      format: r.format,
      sizeMB: Math.round((r.bytes / 1024 / 1024) * 100) / 100,
      width: r.width,
      height: r.height,
      created_at: r.created_at,
    };
  });

  const report: CloudinaryReport = {
    totalImages: resources.length,
    totalSizeMB: Math.round((totalBytes / 1024 / 1024) * 100) / 100,
    formats,
    dimensionRanges: {
      widthMin: wMin === Infinity ? null : wMin,
      widthMax: wMax === -Infinity ? null : wMax,
      heightMin: hMin === Infinity ? null : hMin,
      heightMax: hMax === -Infinity ? null : hMax,
    },
    images,
  };

  // Mostrar resumen
  console.log("=== INVENTARIO CLOUDINARY ===\n");
  console.log(`Total de imágenes: ${report.totalImages}`);
  console.log(`Peso total: ${report.totalSizeMB} MB`);
  console.log("\nFormatos:");
  Object.entries(formats).forEach(([fmt, count]) => {
    console.log(`  - ${fmt}: ${count}`);
  });
  console.log(`\nAncho: [${report.dimensionRanges.widthMin}px, ${report.dimensionRanges.widthMax}px]`);
  console.log(`Alto: [${report.dimensionRanges.heightMin}px, ${report.dimensionRanges.heightMax}px]`);

  // Guardar reporte
  writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n✅ Reporte guardado en: ${OUTPUT_PATH}`);
}

audit().catch((err) => {
  console.error(
    "Error durante el inventario:",
    err instanceof Error ? err.message : err
  );
  process.exit(1);
});
