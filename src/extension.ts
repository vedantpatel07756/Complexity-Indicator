import * as vscode from 'vscode';
import { calculateMetrics } from './core/metrics';
import { getScore } from './core/scorer';
import { updateStatusBar } from './ui/statusBar';
import { ComplexityViewProvider } from './ui/webview/viewProvider';
export function activate(context: vscode.ExtensionContext) {
  console.log('🔥 Extension Activation Started');

  const provider = new ComplexityViewProvider(context);
  console.log('✅ ComplexityViewProvider created');

  const subscription = vscode.window.registerWebviewViewProvider(
    ComplexityViewProvider.viewType,
    provider
  );
  console.log('✅ Webview view provider registered for viewType:', ComplexityViewProvider.viewType);
  
  context.subscriptions.push(subscription);

  // Webview provider is now ready and will render when view is opened
  console.log('✅ Extension fully initialized');

  const update = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const text = editor.document.getText();

  const { loc, imports } = calculateMetrics(text);
  const { score, label } = getScore(loc, imports);

  console.log("🔥 Complexity Extension Running");
  console.log({ loc, imports, score, label });

  updateStatusBar(label, score);
};

  vscode.window.onDidChangeActiveTextEditor(update);
  vscode.workspace.onDidSaveTextDocument(update);

  update();
}