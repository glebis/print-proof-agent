// Воркер каскада: запускается отдельным процессом из API (spawn), чтобы LLM-вызовы
// не блокировали event loop Next.js. По завершении подхватывает следующий заказ из очереди.
// Использование: npx tsx scripts/run-check.ts <orderId>
import { spawn } from 'child_process';
import { runCheck } from '../src/agent/check';
import { q } from '../src/lib/db';
import { pickNextQueued } from '../src/lib/queue';

const orderId = Number(process.argv[2]);
if (!orderId) {
  console.error('usage: tsx scripts/run-check.ts <orderId>');
  process.exit(1);
}

function kickQueue() {
  const next = pickNextQueued(q.listOrders());
  if (!next) return;
  console.log(`queue: запускаю следующий заказ #${next.id}`);
  q.updateOrderStatus(next.id, 'estimated'); // выходит из очереди до старта воркера
  const w = spawn('npx', ['tsx', 'scripts/run-check.ts', String(next.id)], {
    cwd: process.cwd(),
    detached: true,
    stdio: 'ignore',
  });
  w.unref();
}

runCheck(orderId)
  .then(() => {
    console.log(`check #${orderId}: done`);
    kickQueue();
    process.exit(0);
  })
  .catch((e) => {
    console.error(`check #${orderId}: failed:`, e?.message ?? e);
    kickQueue(); // ошибка одного заказа не должна замораживать очередь
    process.exit(1);
  });
