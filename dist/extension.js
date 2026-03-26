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

// src/core/metrics.ts
function calculateMetrics(text) {
  const lines = text.split("\n");
  const loc = lines.filter((l) => {
    const line = l.trim();
    return line.length > 0 && !line.startsWith("//");
  }).length;
  const imports = lines.filter(
    (l) => l.trim().startsWith("import ")
  ).length;
  return { loc, imports };
}

// src/core/scorer.ts
function getScore(loc, imports) {
  const score = imports * 2 + loc / 50;
  let label = "Low";
  if (score > 10) label = "Medium";
  if (score > 20) label = "High";
  return { score, label };
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
  resolveWebviewView(webviewView) {
    console.log("\u{1F3AF} resolveWebviewView called!");
    const webview = webviewView.webview;
    const mediaPath = vscode2.Uri.file(path.join(this.context.extensionPath, "media"));
    webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaPath]
    };
    try {
      const htmlPath = path.join(this.context.extensionPath, "media", "index.html");
      console.log("\u{1F4C2} Loading webview HTML from:", htmlPath);
      console.log("\u{1F4C2} File exists:", fs.existsSync(htmlPath));
      let html = fs.readFileSync(htmlPath, "utf-8");
      const styleCssUri = webview.asWebviewUri(vscode2.Uri.file(path.join(this.context.extensionPath, "media", "style.css")));
      html = html.replace(/href="style\.css"/g, `href="${styleCssUri}"`);
      console.log("\u2705 Webview HTML loaded successfully");
      webview.html = html;
    } catch (error) {
      console.error("\u274C Failed to load webview HTML:", error);
      webview.html = `<h1>Error loading view</h1><p>${String(error)}</p>`;
    }
  }
};

// src/extension.ts
function activate(context) {
  console.log("\u{1F525} Extension Activation Started");
  const provider = new ComplexityViewProvider(context);
  console.log("\u2705 ComplexityViewProvider created");
  const subscription = vscode3.window.registerWebviewViewProvider(
    ComplexityViewProvider.viewType,
    provider
  );
  console.log("\u2705 Webview view provider registered for viewType:", ComplexityViewProvider.viewType);
  context.subscriptions.push(subscription);
  console.log("\u2705 Extension fully initialized");
  const update = () => {
    const editor = vscode3.window.activeTextEditor;
    if (!editor) return;
    const text = editor.document.getText();
    const { loc, imports } = calculateMetrics(text);
    const { score, label } = getScore(loc, imports);
    console.log("\u{1F525} Complexity Extension Running");
    console.log({ loc, imports, score, label });
    updateStatusBar(label, score);
  };
  vscode3.window.onDidChangeActiveTextEditor(update);
  vscode3.workspace.onDidSaveTextDocument(update);
  update();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
