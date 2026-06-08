import { describe, it, expect } from 'vitest';
import { buildOrderArchive } from '@/lib/archive';

describe('архив заказа (полный JSON для аудита)', () => {
  const input = {
    order: { id: 5, filename: 'Буклет.pdf', status: 'done', textHash: 'abc', documentRevision: 1 },
    text: 'исходный текст',
    edits: [{ id: 1, original: 'а', suggested: 'б', decision: 'accepted', decidedBy: 'А. Доу' }],
    layoutIssues: [{ id: 2, page: 1, description: 'кегль' }],
    protocol: { total: 1, usage: { costUsd: 0.01 } },
    profile: { id: 2, name: 'Globex' },
  } as any;

  it('содержит все слои: заказ, текст, правки, замечания, протокол, профиль, версию схемы', () => {
    const a = buildOrderArchive(input, '2026-06-07T12:00:00Z');
    expect(a.schemaVersion).toBe(1);
    expect(a.archivedAt).toBe('2026-06-07T12:00:00Z');
    expect(a.order.id).toBe(5);
    expect(a.baseText).toBe('исходный текст');
    expect(a.edits).toHaveLength(1);
    expect(a.layoutIssues).toHaveLength(1);
    expect(a.protocol.total).toBe(1);
    expect(a.profile?.name).toBe('Globex');
  });

  it('сериализуется в валидный JSON без потерь ключевых полей', () => {
    const a = buildOrderArchive(input, '2026-06-07T12:00:00Z');
    const round = JSON.parse(JSON.stringify(a));
    expect(round.edits[0].decidedBy).toBe('А. Доу');
  });
});
