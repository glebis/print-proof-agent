// Валидация загрузки: тип, размер, пустота — честные ошибки до начала обработки.
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 МБ — лимит пилота

const ALLOWED = new Set(['docx', 'txt', 'md', 'pdf', 'png', 'jpg', 'jpeg']);

export function validateUpload(filename: string, sizeBytes: number): { ok: true } | { ok: false; error: string } {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (!ALLOWED.has(ext)) {
    return { ok: false, error: `тип «${ext}» не поддерживается — нужны DOCX, TXT, MD, PDF, PNG или JPEG` };
  }
  if (sizeBytes <= 0) return { ok: false, error: 'файл пустой' };
  if (sizeBytes > MAX_FILE_BYTES) {
    return { ok: false, error: `файл больше ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} МБ — лимит пилота` };
  }
  return { ok: true };
}
