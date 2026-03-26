import * as vscode from 'vscode';
import * as path from 'path';
import { calculateMetrics } from './core/metrics';
import { getScore } from './core/scorer';
import { updateStatusBar } from './ui/statusBar';
import { ComplexityViewProvider } from './ui/webview/viewProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ComplexityViewProvider(context);

  const subscription = vscode.window.registerWebviewViewProvider(
    ComplexityViewProvider.viewType,
    provider
  );
  context.subscriptions.push(subscription);

  const update = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { return; }

    const text = editor.document.getText();
    const filename = path.basename(editor.document.fileName);

    const metrics = calculateMetrics(text);
    const { score, grade, label, maintainability } = getScore(metrics);

    updateStatusBar(label, score);
    provider.postMetrics({ filename, metrics, score, grade, label, maintainability });
  };

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.workspace.onDidSaveTextDocument(update),
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document === vscode.window.activeTextEditor?.document) {
        update();
      }
    })
  );

  update();
}
