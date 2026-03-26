export interface FileMetrics {
  loc: number;
  totalLines: number;
  imports: number;
  functions: number;
  cyclomaticComplexity: number;
  maxNestingDepth: number;
  avgParams: number;
  commentRatio: number;
}

export function calculateMetrics(text: string): FileMetrics {
  const lines = text.split('\n');
  const totalLines = lines.length;

  // ── Comment detection (covers all major languages) ────────────────────────
  // Supports: // (JS/TS/Dart/Java/Kotlin/Go/Swift/C/C++)
  //           #  (Python/Ruby/Shell/YAML)
  //           /* */ block comments
  //           <!-- --> HTML/XML comments
  //           --  SQL/Lua comments
  let commentLines = 0;
  let inBlockComment = false;
  let inHtmlComment = false;

  for (const raw of lines) {
    const line = raw.trim();

    // HTML/XML block comment
    if (inHtmlComment) {
      commentLines++;
      if (line.includes('-->')) { inHtmlComment = false; }
      continue;
    }
    if (line.startsWith('<!--')) {
      commentLines++;
      if (!line.includes('-->')) { inHtmlComment = true; }
      continue;
    }

    // C-style block comment /* */
    if (inBlockComment) {
      commentLines++;
      if (line.includes('*/')) { inBlockComment = false; }
      continue;
    }
    if (line.startsWith('/*') || line.startsWith('/**')) {
      commentLines++;
      if (!line.includes('*/')) { inBlockComment = true; }
      continue;
    }

    // Single-line comment styles
    if (
      line.startsWith('//') ||   // JS/TS/Dart/Java/Kotlin/Go/Swift/C/C++/Rust
      line.startsWith('*')  ||   // continuation inside block comment
      line.startsWith('#')  ||   // Python/Ruby/Shell/YAML/R
      line.startsWith('--') ||   // SQL/Lua/Haskell
      line.startsWith('%')       // MATLAB/LaTeX
    ) {
      commentLines++;
    }
  }

  const blankLines = lines.filter(l => l.trim().length === 0).length;
  const loc = totalLines - blankLines - commentLines;
  const commentRatio = totalLines > 0 ? Math.round((commentLines / totalLines) * 100) : 0;

  // ── Import / dependency statements (all major languages) ──────────────────
  // import  → JS/TS/Dart/Java/Kotlin/Python/Swift/Go
  // require → Node.js / CommonJS
  // include → C/C++/PHP
  // using   → C# / C++
  // from X import → Python
  // use     → Rust / PHP
  // #include→ C/C++
  const importPatterns = [
    /^\s*import\s/,
    /^\s*require\s*\(/,
    /^\s*#include\s/,
    /^\s*include\s/,
    /^\s*using\s/,
    /^\s*use\s/,
    /^\s*from\s+\S+\s+import\s/,
  ];
  const imports = lines.filter(l =>
    importPatterns.some(p => p.test(l))
  ).length;

  // ── Function / method declarations (all major languages) ──────────────────
  // Covers:
  //   function foo(         JS/TS/PHP
  //   const foo = (         JS/TS arrow function
  //   const foo = async (   JS/TS async arrow
  //   void foo(             Java/Kotlin/Dart/C/C++/C#
  //   def foo(              Python/Ruby
  //   func foo(             Go/Swift
  //   fn foo(               Rust
  //   fun foo(              Kotlin
  //   sub foo(              Perl/VBA
  const funcRegex = /(?:^|[\s;{])(?:function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(|(?:public|private|protected|static|async|override|abstract|sealed|virtual|inline)[\s\w]*\s+\w+\s*\(|(?:void|int|float|double|bool|boolean|char|long|short|byte|string|String|auto|var|dynamic|object|Any|Unit|List|Map|Future|Stream|Widget)\s+\w+\s*\(|(?:def|func|fn|fun|sub)\s+\w+\s*\()/gm;
  const functions = (text.match(funcRegex) ?? []).length;

  // ── Average parameters ─────────────────────────────────────────────────────
  const paramCounts: number[] = [];
  const sigRegex = /\w+\s*\(([^)]{0,200})\)\s*(?:->[\w\s<>[\]]+)?\s*[{:]/g;
  let m: RegExpExecArray | null;
  while ((m = sigRegex.exec(text)) !== null) {
    const inner = m[1].trim();
    paramCounts.push(inner.length === 0 ? 0 : inner.split(',').length);
  }
  const avgParams = paramCounts.length > 0
    ? Math.round(paramCounts.reduce((a, b) => a + b, 0) / paramCounts.length * 10) / 10
    : 0;

  // ── Cyclomatic Complexity ─────────────────────────────────────────────────
  // Decision keywords universal across languages
  const decisionKeywords = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\belif\b/g,          // Python
    /\bunless\b/g,        // Ruby/Perl
    /\bfor\b/g,
    /\bforeach\b/g,
    /\bwhile\b/g,
    /\bdo\b/g,
    /\bcase\b/g,
    /\bwhen\b/g,          // Ruby/Kotlin
    /\bcatch\b/g,
    /\brescue\b/g,        // Ruby
    /\bexcept\b/g,        // Python
    /\?\./g,              // null-safe
    /\?\?/g,              // null-coalescing
    /\?\s/g,              // ternary
    /&&/g,
    /\|\|/g,
    /\band\b/g,           // Python/Ruby
    /\bor\b/g,            // Python/Ruby
  ];
  let cyclomaticComplexity = 1;
  for (const pattern of decisionKeywords) {
    const matches = text.match(pattern);
    if (matches) { cyclomaticComplexity += matches.length; }
  }

  // ── Maximum Nesting Depth ─────────────────────────────────────────────────
  // Brace-based (C/Java/JS/TS/Go/Rust etc.) + indent-based (Python)
  let depth = 0;
  let maxNestingDepth = 0;
  const nestingKeywords = /\b(if|else|elif|for|foreach|while|do|switch|try|catch|finally|rescue|except|unless|when|with)\b/;

  for (const raw of lines) {
    const line = raw.trim();
    if (nestingKeywords.test(line) && (line.endsWith('{') || line.endsWith(':'))) {
      depth++;
      if (depth > maxNestingDepth) { maxNestingDepth = depth; }
    } else if (line === '}' || line === '};' || line === '},') {
      if (depth > 0) { depth--; }
    }
  }

  return { loc, totalLines, imports, functions, cyclomaticComplexity, maxNestingDepth, avgParams, commentRatio };
}
