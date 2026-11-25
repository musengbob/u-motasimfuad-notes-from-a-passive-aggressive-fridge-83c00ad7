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

// The note, kept as its three beats so each clause can be read (and edited)
// on its own; joined with single spaces, the line is exactly the entry.
const NOTE_SEGMENTS = [
  "Day 6 of guarding your leftovers.",
  "You threw them out without even tasting them.",
  "The yogurt and I have discussed this.",
] as const;

function buildEntryLine(): string {
  return NOTE_SEGMENTS.join(" ");
}

// Code points, not UTF-16 units or bytes: the gate counts characters.
function countChars(text: string): number {
  return [...text].length;
}

// Every gate condition from RULES.txt, collected as problems instead of
// failing on the first one — so a bad entry reports everything wrong with it.
function checkGate(line: string, readBack: string): string[] {
  const problems: string[] = [];
  const chars = countChars(readBack);

  if (readBack !== line) {
    problems.push("entry.txt is not byte-identical to the line.");
  }
  if (chars < GATE.MIN_CHARS || chars > GATE.MAX_CHARS) {
    problems.push(
      `${chars} characters, must be ${GATE.MIN_CHARS}-${GATE.MAX_CHARS}.`,
    );
  }
  if (readBack.trim().length === 0) {
    problems.push("line is only whitespace.");
  }
  if (readBack.includes("\n")) {
    problems.push("entry must be a single line.");
  }
  return problems;
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

// Write the line, read it back, and check the bytes actually written —
// a mismatch fails loudly instead of shipping a bad entry.
function writeEntry(line: string, outDir: string): string {
  const outPath = path.join(outDir, GATE.OUTPUT_FILE);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, line, "utf8");
  return fs.readFileSync(outPath, "utf8");
}

function reportEntry(line: string, readBack: string, outDir: string): void {
  const chars = countChars(readBack);
  const bytes = Buffer.byteLength(readBack, "utf8");
  console.log(
    `Wrote ${chars} characters (${bytes} bytes) to ${path.join(outDir, GATE.OUTPUT_FILE)}:`,
  );
  console.log(readBack);
  console.log(
    `Validation passed: byte-identical, single line, within ${GATE.MIN_CHARS}-${GATE.MAX_CHARS} characters.`,
  );
}

function main(): void {
  const line = buildEntryLine();
  const outDir = resolveOutputDir();
  const readBack = writeEntry(line, outDir);

  const problems = checkGate(line, readBack);
  if (problems.length > 0) {
    throw new Error(`Validation failed: ${problems.join(" ")}`);
  }

  reportEntry(line, readBack, outDir);
}

main();
