// Мост: Claude Agent SDK → AI SDK UIMessage-поток для useChat.
// Текст агента стримится text-блоками; изменения профилей — data-части ('data-profile'),
// которые клиент рендерит как виджеты-карточки.
import { createUIMessageStream, createUIMessageStreamResponse, type UIMessage } from 'ai';
import { runProfileChat } from '@/agent/profile-chat';

export const maxDuration = 300;

function messagesToTranscript(messages: UIMessage[]): string {
  // Agent SDK query() не ведёт историю между вызовами — передаём диалог транскриптом.
  const lines: string[] = [];
  for (const m of messages) {
    const text = (m.parts ?? [])
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('\n');
    if (!text.trim()) continue;
    lines.push(`${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${text}`);
  }
  return lines.join('\n\n');
}

export async function POST(req: Request) {
  const { getCurrentUser, can } = await import('@/lib/auth');
  const me = await getCurrentUser();
  if (!me || !can(me, 'chat_profiles')) {
    return new Response(JSON.stringify({ error: 'чат профилей доступен менеджеру и администратору' }), { status: 403 });
  }
  const { messages } = (await req.json()) as { messages: UIMessage[] };
  const transcript = messagesToTranscript(messages);

  const stream = createUIMessageStream({
    async execute({ writer }) {
      let block = 0;
      let widget = 0;
      await runProfileChat(transcript, {
        onText(text) {
          const id = `t${block++}`;
          writer.write({ type: 'text-start', id });
          writer.write({ type: 'text-delta', id, delta: text });
          writer.write({ type: 'text-end', id });
        },
        onProfileChange(profile) {
          // data-часть → виджет карточки профиля в чате
          writer.write({ type: 'data-profile', id: `p${profile.id}-${widget++}`, data: profile } as any);
        },
        onToolUse(name) {
          writer.write({ type: 'data-tool', id: `tool${widget++}`, data: { name }, transient: true } as any);
        },
      });
    },
    onError: (e: any) => `Ошибка агента: ${e?.message ?? e}`,
  });

  return createUIMessageStreamResponse({ stream });
}
