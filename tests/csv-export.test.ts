import { describe, it, expect } from 'vitest';
import { editsToCsv } from '@/lib/csv-export';
import type { Edit } from '@/lib/types';

function mk(p: Partial<Edit>): Edit {
  return {
    orderId: 1, spanStart: 0, spanEnd: 1, baseRevision: 1, original: 'x', suggested: 'y',
    contextBefore: '', contextAfter: '', category: 'spelling', severity: 'normal',
    confidence: 0.98, reason: 'причина', sourceModule: 'llm-pass', decision: 'accepted',
    decidedBy: 'А. Доу', ...p,
  };
}

describe('CSV-экспорт правок', () => {
  it('заголовок + строки; точка с запятой как разделитель (Excel ru)', () => {
    const csv = editsToCsv([mk({ original: 'было', suggested: 'стало' })]);
    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('original;suggested;category;severity;confidence;source;decision;decided_by;reason');
    expect(lines[1]).toContain('было;стало;spelling');
    expect(lines[1]).toContain('0.98');
  });

  it('экранирует кавычки и разделители внутри значений', () => {
    const csv = editsToCsv([mk({ original: 'с;точкой', suggested: 'с "кавычками"', reason: 'много\nстрок' })]);
    expect(csv).toContain('"с;точкой"');
    expect(csv).toContain('"с ""кавычками"""');
    expect(csv).toContain('"много\nстрок"');
  });

  it('BOM для Excel в начале файла', () => {
    expect(editsToCsv([]).charCodeAt(0)).toBe(0xfeff);
  });
});
