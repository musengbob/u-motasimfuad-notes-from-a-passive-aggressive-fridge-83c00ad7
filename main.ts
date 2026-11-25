import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Notes From a Passive-Aggressive Fridge — one-liner entry.
 *
 * The joke mechanism: the fridge plays the role of a long-suffering
 * roommate. It frames a mundane act (binning leftovers) as a personal
 * betrayal after six days of loyal guard duty, then escalates the
 * pettiness with a conspiratorial final turn — "The yogurt and I have
 * discussed this" — implying the fridge has been gossiping with the
 * contents of its own shelves. The humour stays small and domestic:
 * no punchline is explained, the grudge is over yoghurt, and the
 * fridge is smug about inventory it never asked to keep.
 *
 * Competition rule: exactly one funny note, 1–200 characters, a single
 * line, written to entry.txt with no trailing newline.
 */

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
// failing on the first one — so a bad entry reports everything wrong
// with it at once. Throws one error listing every problem found.
function validateEntry(line: string, readBack: string): void {
  const problems: string[] = [];
  const chars = countChars(readBack);

  if (readBack !== line) {
    problems.push("entry.txt is not byte-identical to the intended line.");
  }
  if (chars < GATE.MIN_CHARS || chars > GATE.MAX_CHARS) {
    problems.push(
      `entry is ${chars} characters long, but the limit is ${GATE.MIN_CHARS}-${GATE.MAX_CHARS} characters.`,
    );
  }
  if (readBack.trim().length === 0) {
    problems.push("entry is only whitespace — a note needs actual words.");
  }
  if (readBack.includes("\n") || readBack.includes("\r")) {
    problems.push("entry must be a single line with no line-break characters.");
  }
  if (readBack !== readBack.trim()) {
    problems.push("entry must not start or end with stray whitespace.");
  }
  if (/[\u0000-\u001f\u007f]/.test(readBack)) {
    problems.push("entry must be plain printable text — no control characters.");
  }

  if (problems.length > 0) {
    throw new Error(`Validation failed: ${problems.join(" ")}`);
  }
}

/** Resolve where entry.txt goes, honouring the harness env vars first. */
function resolveOutputDir(): string {
  const candidates: Array<string | undefined> = [
    process.env.MAKEFUN_OUTPUT_DIR,
    process.env.OUTPUT_PATH ? path.dirname(process.env.OUTPUT_PATH) : undefined,
    process.env.MAKEFUN_BOT_DIR ? "/output" : undefined,
  ];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) {
      // Normalise so a trailing slash or a relative path can't produce a
      // surprising entry.txt location, and resolve relatives against cwd.
      return path.resolve(trimmed);
    }
  }
  return path.join(process.cwd(), "output");
}

// Write the line, read it back, and check the bytes actually written —
// a mismatch fails loudly instead of shipping a bad entry. Takes the full
// destination path so the caller owns path construction and logging.
function writeEntry(line: string, outPath: string): string {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, line, "utf8");
  return fs.readFileSync(outPath, "utf8");
}

function reportEntry(readBack: string, outPath: string): void {
  const chars = countChars(readBack);
  const bytes = Buffer.byteLength(readBack, "utf8");
  console.log(`Wrote ${chars} characters (${bytes} bytes) to ${outPath}:`);
  console.log(readBack);
  console.log(
    `Validation passed: byte-identical, single line, within ${GATE.MIN_CHARS}-${GATE.MAX_CHARS} characters.`,
  );
}

function main(): void {
  const line = buildEntryLine();
  const outPath = path.join(resolveOutputDir(), GATE.OUTPUT_FILE);
  const readBack = writeEntry(line, outPath);

  validateEntry(line, readBack);

  reportEntry(readBack, outPath);
}

main();
