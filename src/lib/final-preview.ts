// Предпросмотр итогового текста: сегменты «как будет после экспорта».
// accepted → заменённый текст; pending → оригинал (решение ещё не принято); rejected → оригинал без пометки.
import type { Edit } from '@/lib/types';

export interface PreviewSegment {
  text: string;
  type: 'kept' | 'replaced' | 'pending';
}

export function buildFinalSegments(baseText: string, edits: Edit[]): PreviewSegment[] {
  const relevant = edits
    .filter((e) => e.decision !== 'rejected')
    .sort((a, b) => a.spanStart - b.spanStart);

  const segs: PreviewSegment[] = [];
  let cursor = 0;
  for (const e of relevant) {
    if (e.spanStart < cursor) continue; // пересечения уже исключены resolver'ом
    if (e.spanStart > cursor) segs.push({ text: baseText.slice(cursor, e.spanStart), type: 'kept' });
    if (e.decision === 'accepted') {
      segs.push({ text: e.suggested, type: 'replaced' });
    } else {
      segs.push({ text: baseText.slice(e.spanStart, e.spanEnd), type: 'pending' });
    }
    cursor = e.spanEnd;
  }
  if (cursor < baseText.length) segs.push({ text: baseText.slice(cursor), type: 'kept' });
  if (segs.length === 0) segs.push({ text: baseText, type: 'kept' });
  return segs;
}
