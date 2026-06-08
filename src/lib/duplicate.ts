// Детектор дубликатов: тот же text_hash уже проверялся — не платить дважды.
interface OrderLike {
  id: number;
  textHash?: string | null;
  filename: string;
  status: string;
}

export function findDuplicateOrder(orders: OrderLike[], textHash: string | null, currentOrderId: number): OrderLike | null {
  if (!textHash) return null;
  const dups = orders
    .filter((o) => o.id !== currentOrderId && o.textHash === textHash)
    .sort((a, b) => b.id - a.id); // самый свежий
  return dups[0] ?? null;
}
