import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Page } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Card, PageHeading, Spinner } from '../../components/ui';

export default function PagesTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [pages, setPages] = useState<Page[] | null>(null);

  useEffect(() => {
    api.get<{ pages: Page[] }>(`/projects/${project.id}/pages`).then((r) => setPages(r.pages));
  }, [project.id]);

  if (!pages) return <Spinner />;

  return (
    <div>
      <PageHeading title="Pages" subtitle="Every screen in the plan." />
      <div className="flex flex-col gap-3">
        {pages.map((p) => (
          <Card key={p.id}>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h4 className="font-medium text-ink">{p.name}</h4>
              {p.route && <code className="rounded bg-line-soft px-1.5 py-0.5 font-mono text-xs text-ink-soft">{p.route}</code>}
              {p.isProtected && <Badge tone="amber">Signed in</Badge>}
              {p.isAdmin && <Badge tone="rust">Admin</Badge>}
            </div>
            <p className="text-sm text-ink-soft">{p.purpose}</p>
            {p.components && p.components.length > 0 && (
              <p className="mt-2 font-mono text-xs text-ink-soft">{p.components.join(' · ')}</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
