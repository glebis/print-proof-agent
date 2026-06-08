import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { editsToCsv } from '@/lib/csv-export';
import { getCurrentUser, can, forbidden, unauthorized } from '@/lib/auth';

// CSV всех правок заказа — для Excel-отчётности типографии.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentUser();
  if (!me) return unauthorized();
  if (!can(me, 'view_orders')) return forbidden();

  const { id } = await params;
  const csv = editsToCsv(q.listEdits(Number(id)));
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="edits-${id}.csv"`,
    },
  });
}
