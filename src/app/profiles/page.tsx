'use client';
// Раздел «Профили»: профили клиентов создаются и редактируются разговором с агентом.
// Виджеты: карточки профилей в чате (data-profile части) и актуальный список слева.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

interface Profile {
  id: number;
  name: string;
  notes?: string;
  rules: {
    enforceYo?: boolean;
    quotes?: 'guillemets' | 'straight';
    brandDictionary?: Record<string, string>;
    stylePrompt?: string;
    examples?: { before: string; after: string; note?: string }[];
  };
}

// Inline-редактор: все поля профиля правятся напрямую, без чата
function ProfileEditor({ p, onSaved, onCancel }: { p: Profile; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(p.name);
  const [enforceYo, setEnforceYo] = useState(!!p.rules.enforceYo);
  const [quotes, setQuotes] = useState<'guillemets' | 'straight'>(p.rules.quotes ?? 'guillemets');
  const [stylePrompt, setStylePrompt] = useState(p.rules.stylePrompt ?? '');
  const [dict, setDict] = useState<[string, string][]>(Object.entries(p.rules.brandDictionary ?? {}));
  const [examples, setExamples] = useState(p.rules.examples ?? []);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/profiles/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        rules: {
          enforceYo,
          quotes,
          stylePrompt: stylePrompt.trim() || undefined,
          brandDictionary: Object.fromEntries(dict.filter(([k, v]) => k.trim() && v.trim())),
          examples: examples.filter((ex) => ex.before.trim() && ex.after.trim()),
        },
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="profile-card editing">
      <div className="pe-row">
        <span className="label">название</span>
        <input className="pe-input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="pe-row" style={{ display: 'flex', gap: '1.2rem' }}>
        <label className="pe-check"><input type="checkbox" checked={enforceYo} onChange={(e) => setEnforceYo(e.target.checked)} /> ё обязательна</label>
        <label className="pe-check">кавычки{' '}
          <select className="pe-input" style={{ width: 'auto' }} value={quotes} onChange={(e) => setQuotes(e.target.value as any)}>
            <option value="guillemets">«ёлочки»</option>
            <option value="straight">&quot;прямые&quot;</option>
          </select>
        </label>
      </div>
      <div className="pe-row">
        <span className="label">стиль (для llm-pass)</span>
        <textarea className="pe-input" rows={2} value={stylePrompt} onChange={(e) => setStylePrompt(e.target.value)} placeholder="тон, лексика, что считать ошибкой стиля…" />
      </div>
      <div className="pe-row">
        <span className="label">бренд-словарь (детерминированно, rule-pass)</span>
        {dict.map(([k, v], i) => (
          <div key={i} className="pe-pair">
            <input className="pe-input" value={k} placeholder="неверно" onChange={(e) => setDict(dict.map((d, j) => (j === i ? [e.target.value, d[1]] : d)))} />
            <span>→</span>
            <input className="pe-input" value={v} placeholder="верно" onChange={(e) => setDict(dict.map((d, j) => (j === i ? [d[0], e.target.value] : d)))} />
            <button className="dec no" onClick={() => setDict(dict.filter((_, j) => j !== i))}>✗</button>
          </div>
        ))}
        <button className="linkish" onClick={() => setDict([...dict, ['', '']])}>+ добавить замену</button>
      </div>
      <div className="pe-row">
        <span className="label">примеры правок (few-shot для llm-pass)</span>
        {examples.map((ex, i) => (
          <div key={i} className="pe-pair">
            <input className="pe-input" value={ex.before} placeholder="было" onChange={(e) => setExamples(examples.map((d, j) => (j === i ? { ...d, before: e.target.value } : d)))} />
            <span>→</span>
            <input className="pe-input" value={ex.after} placeholder="стало" onChange={(e) => setExamples(examples.map((d, j) => (j === i ? { ...d, after: e.target.value } : d)))} />
            <button className="dec no" onClick={() => setExamples(examples.filter((_, j) => j !== i))}>✗</button>
          </div>
        ))}
        <button className="linkish" onClick={() => setExamples([...examples, { before: '', after: '' }])}>+ добавить пример</button>
      </div>
      <div className="pe-actions">
        <button className="chat-send" disabled={saving} onClick={save}>{saving ? 'Сохраняю…' : 'Сохранить'}</button>
        <button className="linkish" onClick={onCancel}>отмена</button>
      </div>
    </div>
  );
}

// Самообучение словаря: повторяющиеся принятые правки → кандидаты «добавить в словарь?»
function DictSuggestions({ p, onAdded }: { p: Profile; onAdded: () => void }) {
  const [cands, setCands] = useState<{ wrong: string; right: string; count: number }[]>([]);
  useEffect(() => {
    fetch(`/api/profiles/${p.id}/dict-candidates`).then((r) => r.json()).then((d) => Array.isArray(d) && setCands(d)).catch(() => {});
  }, [p.id, p.rules.brandDictionary]);
  if (cands.length === 0) return null;

  async function add(c: { wrong: string; right: string }) {
    await fetch(`/api/profiles/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: { ...p.rules, brandDictionary: { ...p.rules.brandDictionary, [c.wrong]: c.right } } }),
    });
    onAdded();
  }

  return (
    <div className="dict-suggest">
      <span className="label">агент заметил повторы:</span>
      {cands.slice(0, 3).map((c) => (
        <button key={c.wrong} className="linkish" onClick={() => add(c)} title={`встречалось ${c.count}×, добавить в словарь`}>
          + «{c.wrong}» → «{c.right}» <span className="mono" style={{ fontSize: '10px' }}>{c.count}×</span>
        </button>
      ))}
    </div>
  );
}

function ProfileCard({ p, compact, onEdit }: { p: Profile; compact?: boolean; onEdit?: () => void }) {
  const dict = Object.entries(p.rules.brandDictionary ?? {});
  return (
    <div className="profile-card">
      <div className="pc-head">
        <b>{p.name}</b> <span className="mono pc-id">#{p.id}</span>
        {onEdit && (
          <button className="linkish" style={{ marginLeft: 'auto' }} onClick={onEdit} title="редактировать поля напрямую">✎ редактировать</button>
        )}
      </div>
      <div className="pc-rules">
        <span className={`pc-pill ${p.rules.enforceYo ? 'on' : ''}`}>ё {p.rules.enforceYo ? 'обязательна' : 'не требуется'}</span>
        <span className={`pc-pill ${p.rules.quotes === 'guillemets' ? 'on' : ''}`}>кавычки {p.rules.quotes === 'straight' ? '"прямые"' : '«ёлочки»'}</span>
        <span className={`pc-pill ${dict.length ? 'on' : ''}`}>словарь · {dict.length}</span>
        <span className={`pc-pill ${p.rules.examples?.length ? 'on' : ''}`}>примеры · {p.rules.examples?.length ?? 0}</span>
      </div>
      {!compact && p.rules.stylePrompt && (
        <div className="pc-style"><span className="label">стиль</span> {p.rules.stylePrompt}</div>
      )}
      {!compact && dict.length > 0 && (
        <div className="pc-dict mono">
          {dict.slice(0, 5).map(([k, v]) => (
            <div key={k}>{k} → {v}</div>
          ))}
          {dict.length > 5 && <div>… ещё {dict.length - 5}</div>}
        </div>
      )}
      {!compact && (p.rules.examples?.length ?? 0) > 0 && (
        <div className="pc-examples">
          {p.rules.examples!.slice(0, 3).map((ex, i) => (
            <div key={i} className="pc-ex">
              <span className="del">{ex.before}</span> → <span className="ins">{ex.after}</span>
              {ex.note && <span className="footnote"> · {ex.note}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/profiles/chat' }),
  });

  const loadProfiles = useCallback(async () => {
    const res = await fetch('/api/profiles');
    if (res.ok) setProfiles(await res.json());
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);
  // список слева обновляется, когда агент что-то меняет (приходят data-profile части)
  useEffect(() => { if (status === 'ready') loadProfiles(); }, [status, loadProfiles]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const busy = status === 'submitted' || status === 'streaming';

  return (
    <div className="wrap">
      <header className="masthead">
        <Link className="brand" href="/">PrintProof</Link>
        <Link href="/">Заказы</Link>
        <span>Профили клиентов</span>
        <span className="ctx">профиль = детерминированные правила + стиль + примеры правок</span>
      </header>
      <hr className="rule-double" />
      <hr className="rule-thin" />

      <div className="profiles-grid">
        <div>
          <div className="label" style={{ margin: '1rem 0 0.5rem' }}>профили · {profiles.length}</div>
          {profiles.map((p) =>
            editingId === p.id ? (
              <ProfileEditor
                key={p.id}
                p={p}
                onSaved={() => { setEditingId(null); loadProfiles(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div key={p.id}>
                <ProfileCard p={p} onEdit={() => setEditingId(p.id)} />
                <DictSuggestions p={p} onAdded={loadProfiles} />
              </div>
            ),
          )}
          {profiles.length === 0 && <p className="footnote">профилей нет — попросите агента создать первый</p>}
        </div>

        <div className="chat-pane">
          <div className="label" style={{ margin: '1rem 0 0.5rem' }}>чат с агентом профилей</div>
          <div className="chat-log">
            {messages.length === 0 && (
              <div className="chat-hello">
                <p>Расскажите про клиента — я создам или поправлю профиль. Понимаю:</p>
                <ul>
                  <li>детерминированные правила: «для Acme ё обязательна, кавычки ёлочки»</li>
                  <li>словарь: «их бренд пишется CullApp, не Калапп»</li>
                  <li>стиль и референсы: бросьте текст «как нравится» — извлеку правила и примеры</li>
                  <li>примеры правок: «было … → стало …»</li>
                </ul>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role}`}>
                {(m.parts ?? []).map((part: any, i: number) => {
                  if (part.type === 'text') return <p key={i}>{part.text}</p>;
                  if (part.type === 'data-profile') return <ProfileCard key={i} p={part.data} compact={false} />;
                  return null;
                })}
              </div>
            ))}
            {busy && <div className="msg assistant footnote">агент думает…</div>}
            <div ref={bottomRef} />
          </div>
          <form
            className="chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim() || busy) return;
              sendMessage({ text: input });
              setInput('');
            }}
          >
            <input
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="напр.: создай профиль для Globex — ё не нужна, тон дружелюбный, без канцелярита"
            />
            <button className="chat-send" disabled={busy || !input.trim()}>Отправить</button>
          </form>
        </div>
      </div>
    </div>
  );
}
