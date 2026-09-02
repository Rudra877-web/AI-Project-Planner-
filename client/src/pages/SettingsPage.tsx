import { useState, type FormEvent } from 'react';
import { useAuth, messageFor } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Button, Card, Input, PageHeading } from '../components/ui';

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.patch('/auth/me', { name, jobTitle: jobTitle || undefined });
      await refresh();
      setMessage('Saved.');
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeading title="Account settings" subtitle="Your profile information." />
      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Email</label>
            <Input value={user?.email ?? ''} disabled />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Job title</label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Optional" />
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          {message && <p className="text-sm text-signal-dark">{message}</p>}
          <Button type="submit" disabled={busy} className="self-start">
            {busy ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
