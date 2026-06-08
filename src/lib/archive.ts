// Архив заказа: самодостаточный JSON для долговременного хранения и разбора инцидентов.
// schemaVersion — чтобы будущие версии могли читать старые архивы.

export interface OrderArchiveInput {
  order: Record<string, unknown> & { id: number };
  text: string;
  edits: unknown[];
  layoutIssues: unknown[];
  protocol: Record<string, unknown> | null;
  profile: Record<string, unknown> | null;
}

export function buildOrderArchive(input: OrderArchiveInput, archivedAt: string) {
  return {
    schemaVersion: 1,
    archivedAt,
    order: input.order,
    baseText: input.text,
    edits: input.edits,
    layoutIssues: input.layoutIssues,
    protocol: input.protocol,
    profile: input.profile,
  };
}
