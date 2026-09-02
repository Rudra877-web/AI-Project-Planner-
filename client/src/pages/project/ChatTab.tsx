import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Send } from 'lucide-react';
import { api } from '../../lib/api';
import type { ConversationMessage } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Button, PageHeading, Spinner, Textarea } from '../../components/ui';
import { cn } from '../../lib/cn';

export default function ChatTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [messages, setMessages] = useState<ConversationMessage[] | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ messages: ConversationMessage[] }>(`/projects/${project.id}/conversations?context=chat&threadId=main`).then((r) =>
      setMessages(r.messages),
    );
  }, [project.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setMessages((prev) => [
      ...(prev ?? []),
      { id: `tmp-${Date.now()}`, role: 'user', content: text, context: 'chat', threadId: 'main', generatedWith: null, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await api.post<{ reply: ConversationMessage }>(`/projects/${project.id}/conversations`, {
        message: text,
        threadId: 'main',
      });
      setMessages((prev) => [...(prev ?? []), res.reply]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col">
      <PageHeading title="AI chat" subtitle="Ask about anything in this project's plan." />

      <div className="flex-1 overflow-y-auto rounded-lg border border-line bg-panel p-4">
        {!messages ? (
          <Spinner />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-soft">Ask what to build first, how a feature should work, or anything else about the plan.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm',
                  m.role === 'user' ? 'ml-auto bg-signal text-white' : 'bg-line-soft text-ink',
                )}
              >
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <Textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          placeholder="Ask a question…"
          className="flex-1 resize-none"
        />
        <Button type="submit" disabled={sending}>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
