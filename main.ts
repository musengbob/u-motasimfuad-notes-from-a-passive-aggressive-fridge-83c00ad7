import * as fs from "node:fs";
import * as path from "node:path";

// Competition rule: the entry is one funny passive-aggressive note, 1-200
// characters, that a smart fridge leaves for its owner.
// Why this note should land: it is dry, petty and specific — the fridge has
// kept a six-day guard over leftovers the owner then binned untasted, and
// the sting is the final turn, "The yogurt and I have discussed this":
// the fridge is smug about its inventory, the grudge stays small and
// domestic, and the joke trusts the reader instead of explaining itself.

const LINE =
  "Day 6 of guarding your leftovers. You threw them out without even tasting them. The yogurt and I have discussed this.";

const MAX_CHARS = 200;

function resolveOutputDir(): string {
  if (process.env.MAKEFUN_OUTPUT_DIR && process.env.MAKEFUN_OUTPUT_DIR.trim() !== "") {
    return process.env.MAKEFUN_OUTPUT_DIR;
  }
  if (process.env.OUTPUT_PATH && process.env.OUTPUT_PATH.trim() !== "") {
    return path.dirname(process.env.OUTPUT_PATH);
  }
  if (process.env.MAKEFUN_BOT_DIR && process.env.MAKEFUN_BOT_DIR.trim() !== "") {
    return "/output";
  }
  return path.join(process.cwd(), "output");
}

const outDir = resolveOutputDir();
fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, "entry.txt");
fs.writeFileSync(outPath, LINE, "utf8");

const readBack = fs.readFileSync(outPath, "utf8");
const codePoints = [...readBack].length;
const bytes = Buffer.byteLength(readBack, "utf8");

if (readBack !== LINE) {
  console.error("Validation failed: entry.txt is not byte-identical to the line.");
  process.exit(1);
}
if (codePoints < 1 || codePoints > MAX_CHARS) {
  console.error(`Validation failed: ${codePoints} characters, must be 1-${MAX_CHARS}.`);
  process.exit(1);
}
if (readBack.trim().length === 0) {
  console.error("Validation failed: line is only whitespace.");
  process.exit(1);
}
if (readBack.includes("\n")) {
  console.error("Validation failed: entry must be a single line.");
  process.exit(1);
}

console.log(`Wrote ${codePoints} characters (${bytes} bytes) to ${outPath}:`);
console.log(readBack);
console.log("Validation passed: byte-identical, single line, within 1-200 characters.");
