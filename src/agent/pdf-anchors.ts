// Snap-to-text: уточнение bbox замечаний по точной геометрии текстового слоя PDF.
// Vision-модель оценивает координаты на глаз (±10%); pdfjs знает их точно.
// Для замечаний с anchor_text ищем фрагмент в текстовом слое и заменяем bbox на вычисленный.

export interface TextGeomItem {
  str: string;
  x: number; // pdf-координаты, origin — левый нижний угол
  y: number;
  w: number;
  h: number;
}

export interface PageGeometry {
  width: number;
  height: number;
  items: TextGeomItem[];
}

export async function extractPdfGeometry(buffer: Buffer, pageNumber = 1): Promise<PageGeometry | null> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    await parser.getInfo(); // инициализирует parser.doc
    const doc = (parser as any).doc;
    const page = await doc.getPage(pageNumber);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items: TextGeomItem[] = tc.items
      .filter((it: any) => it.str && it.str.trim())
      .map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5], w: it.width, h: it.height || 12 }));
    await parser.destroy();
    return { width: vp.width, height: vp.height, items };
  } catch {
    return null;
  }
}

/**
 * Ищет anchor в склеенном тексте страницы и возвращает нормализованный bbox (0–1000)
 * объединения затронутых текстовых элементов. y переводится из pdf (низ-вверх) в экранные (верх-вниз).
 */
export function findAnchorBbox(geom: PageGeometry, anchor: string): { x: number; y: number; w: number; h: number } | null {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const target = norm(anchor);
  if (!target) return null;

  // склеиваем элементы в одну строку, запоминая диапазоны
  let joined = '';
  const ranges: { start: number; end: number; item: TextGeomItem }[] = [];
  for (const item of geom.items) {
    const part = norm(item.str);
    if (!part) continue;
    if (joined) joined += ' ';
    const start = joined.length;
    joined += part;
    ranges.push({ start, end: joined.length, item });
  }

  const idx = joined.indexOf(target);
  if (idx === -1) return null;
  const end = idx + target.length;

  const hit = ranges.filter((r) => r.start < end && idx < r.end);
  if (hit.length === 0) return null;

  const x0 = Math.min(...hit.map((r) => r.item.x));
  const x1 = Math.max(...hit.map((r) => r.item.x + r.item.w));
  const yTop = Math.max(...hit.map((r) => r.item.y + r.item.h)); // pdf: вверх
  const yBot = Math.min(...hit.map((r) => r.item.y));

  const pad = 2; // небольшой отступ для читаемости рамки
  const x = Math.max(0, ((x0 - pad) / geom.width) * 1000);
  const y = Math.max(0, ((geom.height - yTop - pad) / geom.height) * 1000);
  const w = Math.min(1000 - x, ((x1 - x0 + pad * 2) / geom.width) * 1000);
  const h = Math.min(1000 - y, ((yTop - yBot + pad * 2) / geom.height) * 1000);
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}
