import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ComplexityViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'complexityView';

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    console.log('🎯 resolveWebviewView called!');
    
    const webview = webviewView.webview;

    const mediaPath = vscode.Uri.file(path.join(this.context.extensionPath, 'media'));
    
    webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaPath]
    };

    try {
      const htmlPath = path.join(this.context.extensionPath, 'media', 'index.html');
      console.log('📂 Loading webview HTML from:', htmlPath);
      console.log('📂 File exists:', fs.existsSync(htmlPath));
      
      let html = fs.readFileSync(htmlPath, 'utf-8');
      
      // Update resource URIs to use webview's URI scheme
      const styleCssUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'style.css')));
      html = html.replace(/href="style\.css"/g, `href="${styleCssUri}"`);
      
      console.log('✅ Webview HTML loaded successfully');
      webview.html = html;
    } catch (error) {
      console.error('❌ Failed to load webview HTML:', error);
      webview.html = `<h1>Error loading view</h1><p>${String(error)}</p>`;
    }
  }
}