import { describe, it, expect } from 'vitest';
import { selectAutoAccept } from '@/agent/auto-accept';
import type { EditCandidate } from '@/lib/types';

function mk(p: Partial<EditCandidate>): EditCandidate {
  return {
    spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'typography', severity: 'normal',
    confidence: 0.98, reason: 't', sourceModule: 'rule-pass', ...p,
  };
}

describe('авто-принятие безопасных правок', () => {
  it('выключено по умолчанию (без opt-in профиля)', () => {
    expect(selectAutoAccept([mk({})], {})).toEqual([]);
  });

  it('принимает детерминированные rule-pass/profile правки с высокой уверенностью', () => {
    const edits = [
      mk({ confidence: 0.98, sourceModule: 'rule-pass' }), // да
      mk({ confidence: 0.97, sourceModule: 'profile' }), // да
      mk({ confidence: 0.9, sourceModule: 'rule-pass' }), // нет: уверенность ниже порога
      mk({ confidence: 0.99, sourceModule: 'llm-pass' }), // нет: LLM не авто-принимается
    ];
    const idx = selectAutoAccept(edits, { autoAccept: true });
    expect(idx).toEqual([0, 1]);
  });

  it('никогда не принимает важные правки автоматически (guardrail)', () => {
    const edits = [mk({ severity: 'important', confidence: 0.99, sourceModule: 'rule-pass' })];
    expect(selectAutoAccept(edits, { autoAccept: true })).toEqual([]);
  });

  it('уважает кастомный порог уверенности', () => {
    const edits = [mk({ confidence: 0.95 })];
    expect(selectAutoAccept(edits, { autoAccept: true, autoAcceptThreshold: 0.9 })).toEqual([0]);
    expect(selectAutoAccept(edits, { autoAccept: true, autoAcceptThreshold: 0.99 })).toEqual([]);
  });
});
