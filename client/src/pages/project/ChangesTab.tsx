import { useEffect, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Check, Sparkles, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { ProjectChange } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Button, Card, PageHeading, Spinner, Textarea } from '../../components/ui';

const STATUS_TONE: Record<string, 'default' | 'signal' | 'amber' | 'rust'> = {
  pending: 'amber',
  accepted: 'signal',
  rejected: 'rust',
};

export default function ChangesTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [changes, setChanges] = useState<ProjectChange[] | null>(null);
  const [request, setRequest] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  async function load() {
    const res = await api.get<{ changes: ProjectChange[] }>(`/projects/${project.id}/changes`);
    setChanges(res.changes);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function analyze(e: FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;
    setAnalyzing(true);
    try {
      await api.post(`/projects/${project.id}/changes`, { request });
      setRequest('');
      load();
    } finally {
      setAnalyzing(false);
    }
  }

  async function resolve(change: ProjectChange, action: 'accept' | 'reject') {
    await api.post(`/projects/${project.id}/changes/${change.id}/${action}`);
    load();
  }

  return (
    <div>
      <PageHeading title="Changes" subtitle="Describe a change; see exactly what it touches before it happens." />

      <Card className="mb-6">
        <form onSubmit={analyze} className="flex flex-col gap-3">
          <Textarea
            rows={3}
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="e.g. Add a loyalty points system for repeat customers"
          />
          <Button type="submit" disabled={analyzing} className="self-start">
            <Sparkles size={15} /> {analyzing ? 'Analyzing…' : 'Analyze impact'}
          </Button>
        </form>
      </Card>

      {!changes ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-4">
          {changes.map((change) => (
            <Card key={change.id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="font-medium text-ink">{change.title}</p>
                <Badge tone={STATUS_TONE[change.status]}>{change.status}</Badge>
              </div>
              {change.impact && (
                <>
                  <p className="mb-3 text-sm text-ink-soft">{change.impact.summary}</p>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    {change.impact.affectedTables.length > 0 && (
                      <ImpactList title="Tables" items={change.impact.affectedTables.map((t) => `${t.action}: ${t.name}`)} />
                    )}
                    {change.impact.newEndpoints.length > 0 && (
                      <ImpactList title="Endpoints" items={change.impact.newEndpoints.map((e) => `${e.method} ${e.path}`)} />
                    )}
                    {change.impact.newPages.length > 0 && (
                      <ImpactList title="Pages" items={change.impact.newPages.map((p) => p.name)} />
                    )}
                    {change.impact.newTasks.length > 0 && (
                      <ImpactList title="New tasks" items={change.impact.newTasks.map((t) => t.title)} />
                    )}
                  </div>
                  {change.impact.risks.length > 0 && (
                    <ul className="mt-3 list-inside list-disc text-xs text-amber">
                      {change.impact.risks.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {change.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => resolve(change, 'accept')}>
                    <Check size={13} /> Accept
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => resolve(change, 'reject')}>
                    <X size={13} /> Reject
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ImpactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-1 font-medium text-ink-soft">{title}</p>
      <ul className="flex flex-col gap-0.5 text-ink-soft">
        {items.map((item, i) => (
          <li key={i} className="font-mono">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
