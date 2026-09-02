import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Notification } from '../types';
import { cn } from '../lib/cn';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await api.get<{ notifications: Notification[]; unread: number }>('/notifications');
      setItems(res.notifications);
      setUnread(res.unread);
    } catch {
      // Silent — the bell simply stays empty if this fails.
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((n) => Math.max(0, n - 1));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-ink-soft hover:bg-line-soft hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-line bg-panel shadow-lg">
          <div className="border-b border-line px-4 py-3 text-sm font-medium text-ink">Notifications</div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-soft">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to={n.link ?? '#'}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={cn('block border-b border-line-soft px-4 py-3 text-sm last:border-0 hover:bg-line-soft', !n.isRead && 'bg-signal-soft/40')}
                >
                  <p className="font-medium text-ink">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-ink-soft">{n.body}</p>}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
