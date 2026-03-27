import * as vscode from 'vscode';

const statusBar = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right,
  100
);

export function initializeStatusBar(command: string) {
  statusBar.command = command;
  statusBar.tooltip = 'Open Complexity Indicator';
}

export function getStatusBarItem() {
  return statusBar;
}

export function updateStatusBar(label: string, score: number) {
  let icon = '🟢';

  if (label === 'Medium') {
    icon = '🟡';
  }

  if (label === 'High') {
    icon = '🔴';
  }

  statusBar.text = `Complexity: ${icon} ${label} (${score.toFixed(1)})`;
  statusBar.show();
}
