"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var vscode3 = __toESM(require("vscode"));
var path2 = __toESM(require("path"));

// src/core/metrics.ts
function calculateMetrics(text) {
  const lines = text.split("\n");
  const totalLines = lines.length;
  let commentLines = 0;
  let inBlockComment = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (inBlockComment) {
      commentLines++;
      if (line.includes("*/")) inBlockComment = false;
      continue;
    }
    if (line.startsWith("/*") || line.startsWith("/**")) {
      commentLines++;
      if (!line.includes("*/")) inBlockComment = true;
      continue;
    }
    if (line.startsWith("//") || line.startsWith("*")) {
      commentLines++;
    }
  }
  const blankLines = lines.filter((l) => l.trim().length === 0).length;
  const loc = totalLines - blankLines - commentLines;
  const commentRatio = totalLines > 0 ? Math.round(commentLines / totalLines * 100) : 0;
  const imports = lines.filter((l) => l.trim().startsWith("import ")).length;
  const funcRegex = /(?:^|\s)(?:void|Future|String|int|double|bool|List|Map|Widget|dynamic|async\s+function|function)\s+\w+\s*\(|(?:^|\s)\w+\s+\w+\s*\([^)]*\)\s*(?:async\s*)?\{/gm;
  const functionMatches = text.match(funcRegex) ?? [];
  const functions = functionMatches.length;
  const paramCounts = [];
  const sigRegex = /\w+\s*\(([^)]*)\)\s*(?:async\s*)?\{/g;
  let m;
  while ((m = sigRegex.exec(text)) !== null) {
    const inner = m[1].trim();
    if (inner.length === 0) {
      paramCounts.push(0);
    } else {
      paramCounts.push(inner.split(",").length);
    }
  }
  const avgParams = paramCounts.length > 0 ? Math.round(paramCounts.reduce((a, b) => a + b, 0) / paramCounts.length * 10) / 10 : 0;
  const decisionKeywords = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bdo\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\?\./g,
    // null-safe operator
    /\?\?/g,
    // null-coalescing
    /\?\s/g,
    // ternary
    /&&/g,
    /\|\|/g
  ];
  let cyclomaticComplexity = 1;
  for (const pattern of decisionKeywords) {
    const matches = text.match(pattern);
    if (matches) cyclomaticComplexity += matches.length;
  }
  let depth = 0;
  let maxNestingDepth = 0;
  const nestingKeywords = /\b(if|else|for|while|do|switch|try|catch|finally)\b/;
  for (const raw of lines) {
    const line = raw.trim();
    if (nestingKeywords.test(line) && line.endsWith("{")) {
      depth++;
      if (depth > maxNestingDepth) maxNestingDepth = depth;
    } else if (line === "}" || line === "};" || line === "},") {
      if (depth > 0) depth--;
    }
  }
  return { loc, totalLines, imports, functions, cyclomaticComplexity, maxNestingDepth, avgParams, commentRatio };
}

// src/core/scorer.ts
function getScore(metrics) {
  const { loc, cyclomaticComplexity, maxNestingDepth, avgParams, commentRatio, functions } = metrics;
  const safeLoc = Math.max(loc, 1);
  const rawMI = 171 - 0.23 * cyclomaticComplexity - 16.2 * Math.log(safeLoc) + (commentRatio > 0 ? 50 * Math.sqrt(2.46 * (commentRatio / 100)) : 0);
  const maintainability = Math.min(100, Math.max(0, Math.round(rawMI / 171 * 100)));
  const ccNorm = Math.min(cyclomaticComplexity / 50, 1);
  const nestNorm = Math.min(maxNestingDepth / 8, 1);
  const paramNorm = Math.min(avgParams / 8, 1);
  const locNorm = Math.min(loc / 500, 1);
  const fnNorm = Math.min(functions / 20, 1);
  const score = Math.round(
    (ccNorm * 0.35 + nestNorm * 0.25 + locNorm * 0.2 + paramNorm * 0.12 + fnNorm * 0.08) * 100
  );
  let grade;
  let label;
  if (score <= 20) {
    grade = "A";
    label = "Low";
  } else if (score <= 40) {
    grade = "B";
    label = "Medium";
  } else if (score <= 60) {
    grade = "C";
    label = "High";
  } else if (score <= 80) {
    grade = "D";
    label = "Very High";
  } else {
    grade = "F";
    label = "Critical";
  }
  return { score, grade, label, maintainability };
}

// src/ui/statusBar.ts
var vscode = __toESM(require("vscode"));
var statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);
function updateStatusBar(label, score) {
  let icon = "\u{1F7E2}";
  if (label === "Medium") icon = "\u{1F7E1}";
  if (label === "High") icon = "\u{1F534}";
  statusBar.text = `Complexity: ${icon} ${label} (${score.toFixed(1)})`;
  statusBar.show();
}

// src/ui/webview/viewProvider.ts
var vscode2 = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var ComplexityViewProvider = class {
  constructor(context) {
    this.context = context;
  }
  static viewType = "complexityView";
  _view;
  _lastData;
  resolveWebviewView(webviewView) {
    this._view = webviewView;
    const webview = webviewView.webview;
    const mediaPath = vscode2.Uri.file(path.join(this.context.extensionPath, "media"));
    webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaPath]
    };
    try {
      const htmlPath = path.join(this.context.extensionPath, "media", "index.html");
      let html = fs.readFileSync(htmlPath, "utf-8");
      const styleCssUri = webview.asWebviewUri(vscode2.Uri.file(path.join(this.context.extensionPath, "media", "style.css")));
      html = html.replace(/href="style\.css"/g, `href="${styleCssUri}"`);
      webview.html = html;
      if (this._lastData) {
        webview.postMessage(this._lastData);
      }
    } catch (error) {
      webview.html = `<h1>Error loading view</h1><p>${String(error)}</p>`;
    }
  }
  postMetrics(data) {
    this._lastData = data;
    this._view?.webview.postMessage(data);
  }
};

// src/extension.ts
function activate(context) {
  const provider = new ComplexityViewProvider(context);
  const subscription = vscode3.window.registerWebviewViewProvider(
    ComplexityViewProvider.viewType,
    provider
  );
  context.subscriptions.push(subscription);
  const update = () => {
    const editor = vscode3.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const text = editor.document.getText();
    const filename = path2.basename(editor.document.fileName);
    const metrics = calculateMetrics(text);
    const { score, grade, label, maintainability } = getScore(metrics);
    updateStatusBar(label, score);
    provider.postMetrics({ filename, metrics, score, grade, label, maintainability });
  };
  context.subscriptions.push(
    vscode3.window.onDidChangeActiveTextEditor(update),
    vscode3.workspace.onDidSaveTextDocument(update),
    vscode3.workspace.onDidChangeTextDocument((e) => {
      if (e.document === vscode3.window.activeTextEditor?.document) {
        update();
      }
    })
  );
  update();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
