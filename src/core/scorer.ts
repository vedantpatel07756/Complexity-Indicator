import { FileMetrics } from './metrics';

export interface ScoreResult {
  score: number;       // 0–100 (higher = more complex / worse)
  grade: string;       // A / B / C / D / F
  label: string;       // Low / Medium / High / Very High
  maintainability: number; // 0–100 (higher = better, Microsoft MI style)
}

export function getScore(metrics: FileMetrics): ScoreResult {
  const { loc, cyclomaticComplexity, maxNestingDepth, avgParams, commentRatio, functions } = metrics;

  // ── Maintainability Index (Microsoft formula, normalised 0–100) ───────────
  // MI = MAX(0, (171 - 5.2*ln(HV) - 0.23*CC - 16.2*ln(LOC)) * 100 / 171)
  // We approximate Halstead Volume with loc * imports factor; keep it simple.
  const safeLoc = Math.max(loc, 1);
  const rawMI = 171
    - 0.23 * cyclomaticComplexity
    - 16.2 * Math.log(safeLoc)
    + (commentRatio > 0 ? 50 * Math.sqrt(2.46 * (commentRatio / 100)) : 0);
  const maintainability = Math.min(100, Math.max(0, Math.round((rawMI / 171) * 100)));

  // ── Complexity Score (0–100, lower is better) ─────────────────────────────
  // Weighted from individual signals, each normalised to 0–1 range then scaled.
  const ccNorm    = Math.min(cyclomaticComplexity / 50, 1);   // CC rarely exceeds 50
  const nestNorm  = Math.min(maxNestingDepth / 8, 1);         // >8 is extreme
  const paramNorm = Math.min(avgParams / 8, 1);               // >8 params is extreme
  const locNorm   = Math.min(loc / 500, 1);                   // >500 LOC is large
  const fnNorm    = Math.min(functions / 20, 1);              // >20 fns is large

  const score = Math.round(
    (ccNorm   * 0.35 +
     nestNorm * 0.25 +
     locNorm  * 0.20 +
     paramNorm * 0.12 +
     fnNorm   * 0.08) * 100
  );

  // ── Grade & Label ─────────────────────────────────────────────────────────
  let grade: string;
  let label: string;

  if (score <= 20) {
    grade = 'A'; label = 'Low';
  } else if (score <= 40) {
    grade = 'B'; label = 'Medium';
  } else if (score <= 60) {
    grade = 'C'; label = 'High';
  } else if (score <= 80) {
    grade = 'D'; label = 'Very High';
  } else {
    grade = 'F'; label = 'Critical';
  }

  return { score, grade, label, maintainability };
}
