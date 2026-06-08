// Экспорт: сборка нового текста курсором по отсортированным accepted-правкам.
// КРИТИЧНО: все span'ы — в координатах immutable base-текста одной ревизии.
// НЕ применяем правки по одной с пересчётом offsets (см. аудит Codex).
import type { Edit } from '@/lib/types';

export function applyAcceptedEdits(baseText: string, edits: Edit[]): string {
  const accepted = edits
    .filter((e) => e.decision === 'accepted')
    .sort((a, b) => a.spanStart - b.spanStart);

  // защита: original обязан совпадать с base-текстом (иначе правка от другой ревизии)
  for (const e of accepted) {
    if (baseText.slice(e.spanStart, e.spanEnd) !== e.original) {
      throw new Error(
        `Правка #${e.id ?? '?'} не совпадает с базовым текстом — несоответствие ревизий: ожидалось «${e.original}», в базе «${baseText.slice(e.spanStart, e.spanEnd)}»`,
      );
    }
  }

  // защита: accepted-правки не должны пересекаться
  for (let i = 1; i < accepted.length; i++) {
    if (accepted[i].spanStart < accepted[i - 1].spanEnd) {
      throw new Error(
        `Правки #${accepted[i - 1].id ?? i - 1} и #${accepted[i].id ?? i} пересекаются — resolver обязан был не допустить этого`,
      );
    }
  }

  // сборка курсором
  let cursor = 0;
  const parts: string[] = [];
  for (const e of accepted) {
    parts.push(baseText.slice(cursor, e.spanStart));
    parts.push(e.suggested);
    cursor = e.spanEnd;
  }
  parts.push(baseText.slice(cursor));
  return parts.join('');
}
