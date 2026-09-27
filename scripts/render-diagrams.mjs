/**
 * One-off: render docs/diagrams/*.svg to PNG for README embedding.
 * Uses sharp, which is already a backend dependency.
 *
 *   node scripts/render-diagrams.mjs
 */
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(join(here, "..", "backend", "package.json"));
const sharp = require("sharp");

const dir = join(here, "..", "docs", "diagrams");

const svgs = readdirSync(dir).filter((f) => f.endsWith(".svg"));
if (svgs.length === 0) {
  console.error("No SVG files found in docs/diagrams/");
  process.exit(1);
}

for (const file of svgs) {
  const out = join(dir, file.replace(/\.svg$/, ".png"));
  await sharp(join(dir, file), { density: 144 })
    .resize({ width: 1770 }) // ~1.5x for crisp README display
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`rendered ${file} -> ${out.split(/[\\/]/).pop()}`);
}
