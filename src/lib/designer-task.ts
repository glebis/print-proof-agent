// «Задание дизайнеру»: markdown-чеклист из vision-замечаний, сгруппированный по страницам.
// Отклонённые менеджером замечания не попадают в задание.
import type { LayoutIssue } from '@/lib/types';

export function buildDesignerTask(order: { id: number; filename: string }, issues: LayoutIssue[]): string {
  const active = issues.filter((i) => i.decision !== 'rejected');
  const lines: string[] = [
    `# Задание дизайнеру — заказ #${order.id}`,
    '',
    `Файл: ${order.filename}`,
    `Замечаний: ${active.length} · сформировано PrintProof (vision-pass)`,
    '',
  ];

  if (active.length === 0) {
    lines.push('Замечаний нет — макет можно отдавать в печать после приёмки текста.');
    return lines.join('\n');
  }

  const pages = [...new Set(active.map((i) => i.page))].sort((a, b) => a - b);
  for (const page of pages) {
    lines.push(`## Стр. ${page}`, '');
    for (const i of active.filter((x) => x.page === page)) {
      const mark = i.severity === 'important' ? '**[ВАЖНО]** ' : '';
      lines.push(`- [ ] ${mark}${i.blockHint}: ${i.description} _(уверенность ${Math.round(i.confidence * 100)}%)_`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
