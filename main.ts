import * as fs from "node:fs";
import * as path from "node:path";

// Competition rule: the entry is one funny passive-aggressive note, 1-200
// characters, that a smart fridge leaves for its owner.
// Why this note should land: it is dry, petty and specific — the fridge has
// kept a six-day guard over leftovers the owner then binned untasted, and
// the sting is the final turn, "The yogurt and I have discussed this":
// the fridge is smug about its inventory, the grudge stays small and
// domestic, and the joke trusts the reader instead of explaining itself.

// The gate, sealed in RULES.txt: /output/entry.txt must be UTF-8 text of
// 1 to 200 characters, not only whitespace, a single line.
const GATE = {
  MIN_CHARS: 1,
  MAX_CHARS: 200,
  OUTPUT_FILE: "entry.txt",
} as const;

// The note itself, built by one function so the line and its gate travel
// together: day 6 of guarding leftovers the owner binned untasted, and the
// yogurt has been consulted.
function buildEntryLine(): string {
  return (
    "Day 6 of guarding your leftovers. " +
    "You threw them out without even tasting them. " +
    "The yogurt and I have discussed this."
  );
}

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

// Every gate condition from RULES.txt, checked against the bytes actually
// written — a mismatch fails loudly instead of shipping a bad entry.
function validateEntry(line: string, readBack: string): void {
  const codePoints = [...readBack].length;
  const bytes = Buffer.byteLength(readBack, "utf8");

  if (readBack !== line) {
    throw new Error("Validation failed: entry.txt is not byte-identical to the line.");
  }
  if (codePoints < GATE.MIN_CHARS || codePoints > GATE.MAX_CHARS) {
    throw new Error(
      `Validation failed: ${codePoints} characters, must be ${GATE.MIN_CHARS}-${GATE.MAX_CHARS}.`,
    );
  }
  if (readBack.trim().length === 0) {
    throw new Error("Validation failed: line is only whitespace.");
  }
  if (readBack.includes("\n")) {
    throw new Error("Validation failed: entry must be a single line.");
  }

  console.log(`Wrote ${codePoints} characters (${bytes} bytes) to ${path.join(resolveOutputDir(), GATE.OUTPUT_FILE)}:`);
  console.log(readBack);
  console.log(
    `Validation passed: byte-identical, single line, within ${GATE.MIN_CHARS}-${GATE.MAX_CHARS} characters.`,
  );
}

function main(): void {
  const line = buildEntryLine();
  const outDir = resolveOutputDir();
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, GATE.OUTPUT_FILE);
  fs.writeFileSync(outPath, line, "utf8");

  const readBack = fs.readFileSync(outPath, "utf8");
  validateEntry(line, readBack);
}

main();
