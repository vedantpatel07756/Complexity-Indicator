export interface FileMetrics {
  loc: number;           // Non-blank, non-comment lines
  totalLines: number;    // Raw line count
  imports: number;       // Import statements
  functions: number;     // Function / method declarations
  cyclomaticComplexity: number;  // Decision points + 1
  maxNestingDepth: number;       // Deepest control-flow nesting
  avgParams: number;     // Average parameters per function
  commentRatio: number;  // 0–100 percentage
}

export function calculateMetrics(text: string): FileMetrics {
  const lines = text.split('\n');
  const totalLines = lines.length;

  // ── Basic line counts ─────────────────────────────────────────────────────
  let commentLines = 0;
  let inBlockComment = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (inBlockComment) {
      commentLines++;
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*') || line.startsWith('/**')) {
      commentLines++;
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }
    if (line.startsWith('//') || line.startsWith('*')) {
      commentLines++;
    }
  }

  const blankLines = lines.filter(l => l.trim().length === 0).length;
  const loc = totalLines - blankLines - commentLines;
  const commentRatio = totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

  // ── Imports ───────────────────────────────────────────────────────────────
  const imports = lines.filter(l => l.trim().startsWith('import ')).length;

  // ── Function declarations ─────────────────────────────────────────────────
  // Matches Dart/JS/TS style: `void foo(`, `Future<X> bar(`, `function baz(`
  const funcRegex = /(?:^|\s)(?:void|Future|String|int|double|bool|List|Map|Widget|dynamic|async\s+function|function)\s+\w+\s*\(|(?:^|\s)\w+\s+\w+\s*\([^)]*\)\s*(?:async\s*)?\{/gm;
  const functionMatches = text.match(funcRegex) ?? [];
  const functions = functionMatches.length;

  // ── Average parameters per function ──────────────────────────────────────
  // Grab each function signature and count comma-separated params
  const paramCounts: number[] = [];
  const sigRegex = /\w+\s*\(([^)]*)\)\s*(?:async\s*)?\{/g;
  let m: RegExpExecArray | null;
  while ((m = sigRegex.exec(text)) !== null) {
    const inner = m[1].trim();
    if (inner.length === 0) {
      paramCounts.push(0);
    } else {
      paramCounts.push(inner.split(',').length);
    }
  }
  const avgParams = paramCounts.length > 0
    ? Math.round(paramCounts.reduce((a, b) => a + b, 0) / paramCounts.length * 10) / 10
    : 0;

  // ── Cyclomatic Complexity ─────────────────────────────────────────────────
  // Start at 1; +1 for every decision point
  const decisionKeywords = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bdo\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\./g,        // null-safe operator
    /\?\?/g,        // null-coalescing
    /\?\s/g,        // ternary
    /&&/g,
    /\|\|/g,
  ];
  let cyclomaticComplexity = 1;
  for (const pattern of decisionKeywords) {
    const matches = text.match(pattern);
    if (matches) cyclomaticComplexity += matches.length;
  }

  // ── Maximum Nesting Depth ─────────────────────────────────────────────────
  let depth = 0;
  let maxNestingDepth = 0;
  const nestingKeywords = /\b(if|else|for|while|do|switch|try|catch|finally)\b/;

  for (const raw of lines) {
    const line = raw.trim();
    // Only count structural braces following a control keyword
    if (nestingKeywords.test(line) && line.endsWith('{')) {
      depth++;
      if (depth > maxNestingDepth) maxNestingDepth = depth;
    } else if (line === '}' || line === '};' || line === '},') {
      // Only decrement if we opened a nesting block (heuristic)
      if (depth > 0) depth--;
    }
  }

  return { loc, totalLines, imports, functions, cyclomaticComplexity, maxNestingDepth, avgParams, commentRatio };
}
