import { describe, it, expect } from 'vitest';
import { filterEdits } from '@/lib/edit-filter';
import type { Edit } from '@/lib/types';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 't', sourceModule: 'llm-pass', decision: 'pending', ...p,
  };
}

const EDITS = [
  mk({ category: 'spelling', decision: 'pending' }),
  mk({ category: 'typography', decision: 'accepted' }),
  mk({ category: 'typography', decision: 'rejected' }),
  mk({ category: 'style', decision: 'pending', severity: 'important' }),
];

describe('фильтр правок на приёмке', () => {
  it('all/all возвращает всё', () => {
    expect(filterEdits(EDITS, { decision: 'all', category: 'all' })).toHaveLength(4);
  });

  it('фильтрует по статусу решения', () => {
    expect(filterEdits(EDITS, { decision: 'pending', category: 'all' })).toHaveLength(2);
    expect(filterEdits(EDITS, { decision: 'accepted', category: 'all' })).toHaveLength(1);
  });

  it('фильтрует по категории и комбинирует со статусом', () => {
    expect(filterEdits(EDITS, { decision: 'all', category: 'typography' })).toHaveLength(2);
    expect(filterEdits(EDITS, { decision: 'rejected', category: 'typography' })).toHaveLength(1);
  });

  it('important — отдельный фильтр-статус поверх категории', () => {
    expect(filterEdits(EDITS, { decision: 'important', category: 'all' })).toHaveLength(1);
  });
});
