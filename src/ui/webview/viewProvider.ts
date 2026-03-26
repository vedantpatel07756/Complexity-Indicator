import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ComplexityViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'complexityView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview;

    webview.options = {
      enableScripts: true,
    };

    const htmlPath = path.join(this.context.extensionPath, 'media', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    webview.html = html;
  }
}