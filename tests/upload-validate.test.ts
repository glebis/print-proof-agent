import { describe, it, expect } from 'vitest';
import { validateUpload, MAX_FILE_BYTES } from '@/lib/upload-validate';

describe('валидация загрузки', () => {
  it('пропускает поддерживаемые расширения', () => {
    for (const name of ['а.docx', 'б.txt', 'в.md', 'г.pdf', 'д.png', 'е.jpg', 'ж.jpeg']) {
      expect(validateUpload(name, 1000).ok).toBe(true);
    }
  });

  it('отклоняет неподдерживаемый тип с понятной причиной', () => {
    const v = validateUpload('вирус.exe', 1000);
    expect(v.ok).toBe(false);
    expect(v.error).toContain('exe');
  });

  it('отклоняет слишком большой файл и пустой файл', () => {
    expect(validateUpload('а.pdf', MAX_FILE_BYTES + 1).ok).toBe(false);
    expect(validateUpload('а.pdf', MAX_FILE_BYTES + 1).error).toMatch(/МБ/);
    expect(validateUpload('а.pdf', 0).ok).toBe(false);
  });
});
