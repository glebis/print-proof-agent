// Нормализация входных файлов → immutable text (rev.1) + определение типа заказа.
import mammoth from 'mammoth';
import crypto from 'crypto';
import type { OrderType } from '@/lib/types';

export interface NormalizedDoc {
  type: OrderType;
  text: string; // пустая строка для чисто графических заказов
  hash: string;
}

export function detectType(filename: string): OrderType {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'docx' || ext === 'txt' || ext === 'md') return 'text';
  if (ext === 'pdf') return 'pdf';
  return 'layout'; // png, jpg, jpeg
}

export async function normalizeFile(filename: string, buffer: Buffer): Promise<NormalizedDoc> {
  const type = detectType(filename);
  let text = '';

  if (type === 'text') {
    if (filename.toLowerCase().endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value.trim();
    } else {
      text = buffer.toString('utf-8').trim();
    }
  } else if (type === 'pdf') {
    // v1: извлекаем текстовый слой (pdf-parse v2, классовый API); если его нет — заказ как layout
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const parsed = await parser.getText();
      text = String(parsed.text ?? '').trim();
      await parser.destroy();
    } catch {
      text = '';
    }
  }

  const hash = crypto.createHash('sha256').update(text || buffer).digest('hex').slice(0, 16);
  return { type, text, hash };
}

// Оценка без LLM-вызова не считается; см. agent/estimate.ts
export function countStats(text: string) {
  return { chars: text.length, words: text.split(/\s+/).filter(Boolean).length };
}

// Рендер страниц PDF в PNG: для vision-pass и предпросмотра с bbox-оверлеем.
// Ограничение пилота: не больше MAX_VISION_PAGES страниц (стоимость и время).
export const MAX_VISION_PAGES = 10;

export async function renderPdfPages(buffer: Buffer): Promise<Buffer[]> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const shot = await parser.getScreenshot();
    await parser.destroy();
    return (shot.pages ?? [])
      .slice(0, MAX_VISION_PAGES)
      .filter((p: any) => p?.data)
      .map((p: any) => Buffer.from(p.data));
  } catch {
    return [];
  }
}
