import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { q } from '@/lib/db';
import { getCurrentUser, unauthorized, forbidden } from '@/lib/auth';
import { canAccessOrder } from '@/lib/order-access';

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
};

// Отдаёт исходный файл заказа (макет) для предпросмотра на экране приёмки.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  const { id } = await params;
  const order = q.getOrder(Number(id));
  if (!order) return NextResponse.json({ error: 'не найден' }, { status: 404 });
  if (!canAccessOrder(me, order, () => q.listLayoutIssues(Number(id)).length > 0)) return forbidden('нет доступа к заказу');
  // ?render=N — PNG-рендер N-й страницы PDF (для предпросмотра с bbox-оверлеем)
  const renderParam = req.nextUrl.searchParams.get('render');
  let source: { path?: string } | undefined;
  if (renderParam) {
    const renders = q.listArtifacts(Number(id), 'page_render');
    source = renders[Math.max(0, Number(renderParam) - 1)] ?? renders[0];
  } else {
    source = q.getArtifact(Number(id), 'source');
  }
  if (!source?.path || !fs.existsSync(source.path)) {
    return NextResponse.json({ error: 'исходник не найден' }, { status: 404 });
  }
  const ext = path.extname(source.path).toLowerCase();
  const buf = fs.readFileSync(source.path);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': MIME[ext] ?? 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
