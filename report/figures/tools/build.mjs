// Usage: node build.mjs [name ...]   (no args = all diagrams)
// Writes figures/src/<name>.drawio, exports figures/<name>.pdf and
// figures/png/<name>.png, and prints overlap / crossing checks.
import fs from "node:fs";
import path from "node:path";
import { FIG_DIR } from "./lib.mjs";

const toolDir = path.join(FIG_DIR, "tools");
const wanted = process.argv.slice(2);
const files = fs.readdirSync(toolDir).filter((f) => /^(ad_|uc_).*\.mjs$/.test(f)).sort();
const report = [];
for (const f of files) {
  const mod = await import(`./${f}`);
  const d = mod.default();
  if (wanted.length && !wanted.includes(d.name)) continue;
  const r = d.save();
  report.push(r);
  console.log(`${r.name}: nodes=${r.nodes} edges=${r.edges} crossings=${r.crossings} issues=${r.issues.length}`);
  for (const i of r.issues) console.log(`   - ${i}`);
}
fs.writeFileSync(path.join(FIG_DIR, "png", "check.json"), JSON.stringify(report, null, 2));
