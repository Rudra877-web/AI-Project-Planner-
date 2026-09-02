import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ApiEndpoint } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Card, PageHeading, Spinner } from '../../components/ui';
import { cn } from '../../lib/cn';

const METHOD_TONE: Record<string, string> = {
  GET: 'bg-signal-soft text-signal-dark',
  POST: 'bg-amber-soft text-amber',
  PATCH: 'bg-line-soft text-ink-soft',
  PUT: 'bg-line-soft text-ink-soft',
  DELETE: 'bg-rust-soft text-rust',
};

export default function ApiTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [endpoints, setEndpoints] = useState<ApiEndpoint[] | null>(null);

  useEffect(() => {
    api.get<{ endpoints: ApiEndpoint[] }>(`/projects/${project.id}/api-endpoints`).then((r) => setEndpoints(r.endpoints));
  }, [project.id]);

  if (!endpoints) return <Spinner />;

  const groups = new Map<string, ApiEndpoint[]>();
  for (const e of endpoints) {
    const key = e.group ?? 'General';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }

  return (
    <div>
      <PageHeading title="API" subtitle="Endpoints planned for this project." />
      <div className="flex flex-col gap-6">
        {[...groups.entries()].map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{group}</h3>
            <Card className="divide-y divide-line-soft p-0">
              {items.map((e) => (
                <div key={e.id} className="flex items-start gap-3 p-4">
                  <span className={cn('mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-semibold', METHOD_TONE[e.method])}>
                    {e.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="font-mono text-sm text-ink">{e.path}</code>
                      {e.requiresAuth && <Badge>auth required</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{e.description}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
