// Ручная правка предложения менеджером: «стало» можно изменить до принятия.
// original неприкосновенен (якорь immutable-ревизии); новое предложение сбрасывает решение.
import type { Edit } from '@/lib/types';

export function applySuggestionChange(edit: Edit, newSuggested: string): Edit {
  const suggested = newSuggested.trim();
  if (!suggested) throw new Error('предложение не может быть пустым');
  if (suggested === edit.original) throw new Error('предложение совпадает с исходным текстом — отклоните правку вместо этого');
  return {
    ...edit,
    suggested,
    decision: 'pending', // новое предложение требует нового решения
    decidedAt: null,
    decidedBy: null,
    reason: `${edit.reason} · изменено менеджером`,
  };
}
