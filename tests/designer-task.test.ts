import { describe, it, expect } from 'vitest';
import { buildDesignerTask } from '@/lib/designer-task';
import type { LayoutIssue } from '@/lib/types';

function mk(p: Partial<LayoutIssue>): LayoutIssue {
  return {
    orderId: 1, page: 1, blockHint: 'шапка', description: 'поправить', category: 'text',
    severity: 'normal', confidence: 0.9, decision: 'pending', bbox: null, ...p,
  };
}

describe('экспорт «Задание дизайнеру»', () => {
  it('собирает markdown: заголовок, группировка по страницам, важные помечены', () => {
    const md = buildDesignerTask(
      { id: 12, filename: 'Каталог.pdf' },
      [
        mk({ page: 2, blockHint: 'футер', description: 'мелкий кегль' }),
        mk({ page: 1, blockHint: 'заголовок', description: 'кавычки', severity: 'important' }),
      ],
    );
    expect(md).toContain('# Задание дизайнеру — заказ #12');
    expect(md).toContain('Каталог.pdf');
    expect(md.indexOf('## Стр. 1')).toBeLessThan(md.indexOf('## Стр. 2')); // страницы по порядку
    expect(md).toContain('**[ВАЖНО]**');
    expect(md).toContain('- [ ] '); // чеклист для дизайнера
  });

  it('не включает отклонённые менеджером замечания', () => {
    const md = buildDesignerTask({ id: 1, filename: 'x.png' }, [
      mk({ description: 'нужное' }),
      mk({ description: 'забракованное', decision: 'rejected' }),
    ]);
    expect(md).toContain('нужное');
    expect(md).not.toContain('забракованное');
  });

  it('пустой список замечаний → честное «замечаний нет»', () => {
    expect(buildDesignerTask({ id: 1, filename: 'x.png' }, []).toLowerCase()).toContain('замечаний нет');
  });
});
