import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { FileMetrics } from '../../core/metrics';

export class ComplexityViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'complexityView';

  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    const webview = webviewView.webview;
    const mediaPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media'));

    webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaPath]
    };

    try {
      const htmlPath = path.join(this.context.extensionPath, 'media', 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf-8');

      const styleCssUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'style.css')));
      html = html.replace(/href="style\.css"/g, `href="${styleCssUri}"`);

      webview.html = html;
    } catch (error) {
      webview.html = `<h1>Error loading view</h1><p>${String(error)}</p>`;
    }
  }

  postMetrics(data: { filename: string; metrics: FileMetrics; score: number; grade: string; label: string; maintainability: number }) {
    this._view?.webview.postMessage(data);
  }
}
