import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { q } from '@/lib/db';
import { applyAcceptedEdits } from '@/lib/export';

import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// Guardrail: экспорт только когда по всем правкам есть решение; применяются только accepted.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'export')) return forbidden('экспорт доступен менеджеру и администратору');
  const { id } = await params;
  const orderId = Number(id);
  const format = req.nextUrl.searchParams.get('format') ?? 'md';

  const order = q.getOrder(orderId);
  const base = q.getArtifact(orderId, 'parsed_text')?.content;
  if (!order || base == null) return NextResponse.json({ error: 'не найден' }, { status: 404 });

  const edits = q.listEdits(orderId);
  const pending = edits.filter((e) => e.decision === 'pending');
  if (pending.length > 0) {
    return NextResponse.json({ error: `недоступно: ${pending.length} правок без решения` }, { status: 409 });
  }

  const finalText = applyAcceptedEdits(base, edits);
  const stem = order.filename.replace(/\.[^.]+$/, '');

  if (format === 'protocol') {
    const lines = edits.map(
      (e) =>
        `${e.decision === 'accepted' ? '✓' : '✗'} [${e.category}/${e.sourceModule}] «${e.original}» → «${e.suggested}» — ${e.reason} (${Math.round(e.confidence * 100)}%, решение: ${e.decidedBy ?? '—'} ${e.decidedAt ?? ''})`,
    );
    const protocol = `Протокол приёмки — заказ #${orderId} · ${order.filename}\nРевизия: rev.${order.documentRevision}, hash ${order.textHash}\nПравок всего: ${edits.length}, принято: ${edits.filter((e) => e.decision === 'accepted').length}\n\n${lines.join('\n')}\n`;
    return new NextResponse(protocol, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Content-Disposition': `attachment; filename="protocol-${orderId}.txt"` },
    });
  }

  if (format === 'docx') {
    const doc = new Document({
      sections: [{
        children: finalText.split('\n').map(
          (line) => new Paragraph({ children: [new TextRun({ text: line, font: 'Times New Roman', size: 24 })] }),
        ),
      }],
    });
    const buffer = await Packer.toBuffer(doc);
    q.saveArtifact(orderId, 'export_docx', { content: `${buffer.length} bytes` });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(stem)}-proofread.docx"`,
      },
    });
  }

  // markdown по умолчанию
  q.saveArtifact(orderId, 'export_md', { content: finalText });
  return new NextResponse(finalText, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Content-Disposition': `attachment; filename="${encodeURIComponent(stem)}-proofread.md"` },
  });
}
