import * as vscode from 'vscode';
import * as path from 'path';
import { calculateMetrics } from './core/metrics';
import { getScore } from './core/scorer';
import { getStatusBarItem, initializeStatusBar, updateStatusBar } from './ui/statusBar';
import { ComplexityViewProvider } from './ui/webview/viewProvider';

const OPEN_COMPLEXITY_VIEW_COMMAND = 'complexity-indicator.openView';

export function activate(context: vscode.ExtensionContext) {
  const provider = new ComplexityViewProvider(context);
  initializeStatusBar(OPEN_COMPLEXITY_VIEW_COMMAND);

  const subscription = vscode.window.registerWebviewViewProvider(
    ComplexityViewProvider.viewType,
    provider
  );
  const openViewCommand = vscode.commands.registerCommand(
    OPEN_COMPLEXITY_VIEW_COMMAND,
    async () => {
      await vscode.commands.executeCommand('workbench.view.extension.complexity-sidebar');
      await vscode.commands.executeCommand(`${ComplexityViewProvider.viewType}.focus`);
    }
  );

  context.subscriptions.push(subscription, openViewCommand, getStatusBarItem());

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
