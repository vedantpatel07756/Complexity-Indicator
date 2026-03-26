export function getScore(loc: number, imports: number) {
  const score = (imports * 2) + (loc / 50);

  let label = 'Low';
  if (score > 10) label = 'Medium';
  if (score > 20) label = 'High';

  return { score, label };
}