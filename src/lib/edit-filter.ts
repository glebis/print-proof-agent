// Фильтр правок на приёмке: по статусу решения (включая «важные») и категории.
import type { Edit } from '@/lib/types';

export interface EditFilter {
  decision: 'all' | 'pending' | 'accepted' | 'rejected' | 'important';
  category: string; // 'all' | конкретная категория
}

export function filterEdits(edits: Edit[], f: EditFilter): Edit[] {
  return edits.filter((e) => {
    if (f.category !== 'all' && e.category !== f.category) return false;
    if (f.decision === 'important') return e.severity === 'important';
    if (f.decision !== 'all' && e.decision !== f.decision) return false;
    return true;
  });
}
