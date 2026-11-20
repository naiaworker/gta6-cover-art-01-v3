// BISCAYNE Cover Studio — hand-in script for the gta6-cover-art-01
// competition. Copies the static app and its screenshots into the
// output directory and writes dossier.json through the vendor helper.
// Run with: node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

// Guard: a hand-in without screenshots is not a hand-in. Refuse early
// so a half-finished build can never be packaged by accident.
const shotsDir = join(root, "screenshots");
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((f) => /\.(jpe?g|png)$/i.test(f))
  : [];
if (shots.length === 0) {
  console.error("refusing to hand in: screenshots/ is empty");
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

cpSync(join(root, "app"), join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, "dossier.json"), dossier);
const bytes = typeof dossier === "string" ? Buffer.byteLength(dossier) : dossier.length;
console.log(`BISCAYNE Cover Studio handed in: ${shots.length} screenshots, dossier.json ${bytes} bytes, app copied to ${outDir}`);
