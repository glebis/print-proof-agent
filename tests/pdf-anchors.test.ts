import { describe, it, expect } from 'vitest';
import { findAnchorBbox, type PageGeometry } from '@/agent/pdf-anchors';

// страница 600×800 pdf-точек; y в pdf — от нижнего края
const GEOM: PageGeometry = {
  width: 600,
  height: 800,
  items: [
    { str: 'Сроки', x: 60, y: 700, w: 50, h: 12 },
    { str: 'производства:', x: 115, y: 700, w: 110, h: 12 },
    { str: 'от', x: 230, y: 700, w: 18, h: 12 },
    { str: '3х', x: 252, y: 700, w: 20, h: 12 },
    { str: 'до', x: 276, y: 700, w: 20, h: 12 },
    { str: '5и', x: 300, y: 700, w: 20, h: 12 },
    { str: 'дней.', x: 324, y: 700, w: 44, h: 12 },
  ],
};

describe('snap-to-text: bbox по геометрии PDF', () => {
  it('находит фрагмент, охватывающий несколько элементов', () => {
    const b = findAnchorBbox(GEOM, 'от 3х до 5и дней');
    expect(b).not.toBeNull();
    // x: от 230 (±pad) → ~380/600*1000; покрывает с «от» до конца «дней.»
    expect(b!.x).toBeGreaterThan(370);
    expect(b!.x).toBeLessThan(390);
    expect(b!.w).toBeGreaterThan(220);
    // y: pdf-низ 700, высота 12 → верх в экранных координатах: (800-712)/800*1000 = 110
    expect(b!.y).toBeGreaterThan(100);
    expect(b!.y).toBeLessThan(120);
  });

  it('нечувствителен к регистру и лишним пробелам', () => {
    expect(findAnchorBbox(GEOM, '  СРОКИ   ПРОИЗВОДСТВА:  ')).not.toBeNull();
  });

  it('возвращает null для отсутствующего текста', () => {
    expect(findAnchorBbox(GEOM, 'нет такого фрагмента')).toBeNull();
  });
});
