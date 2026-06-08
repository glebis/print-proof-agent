import { describe, it, expect } from 'vitest';
import { editBelongsToOrder } from '@/lib/decide-guard';
import type { Edit } from '@/lib/types';

function mk(p: Partial<Edit>): Edit {
  return {
    id: 1, orderId: 5, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.9, reason: 't', sourceModule: 'llm-pass', decision: 'pending', ...p,
  };
}

describe('защита приёмки: правка принадлежит заказу из URL', () => {
  it('пропускает правку своего заказа', () => {
    expect(editBelongsToOrder(mk({ orderId: 5 }), 5)).toBe(true);
  });

  it('блокирует правку чужого заказа (Codex risk #4)', () => {
    expect(editBelongsToOrder(mk({ orderId: 7 }), 5)).toBe(false);
  });

  it('блокирует несуществующую правку', () => {
    expect(editBelongsToOrder(undefined, 5)).toBe(false);
    expect(editBelongsToOrder(null as any, 5)).toBe(false);
  });
});
