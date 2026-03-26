export function calculateMetrics(text: string) {
  const lines = text.split('\n');

  const loc = lines.filter(l => {
    const line = l.trim();
    return line.length > 0 && !line.startsWith('//');
  }).length;

  const imports = lines.filter(l =>
    l.trim().startsWith('import ')
  ).length;

  return { loc, imports };
}