import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { ProjectTechnology } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Card, PageHeading, Spinner } from '../../components/ui';

const CATEGORY_LABEL: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  devops: 'DevOps',
  other: 'Other',
};

export default function StackTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [technologies, setTechnologies] = useState<ProjectTechnology[] | null>(null);

  useEffect(() => {
    api.get<{ technologies: ProjectTechnology[] }>(`/projects/${project.id}/technologies`).then((r) => setTechnologies(r.technologies));
  }, [project.id]);

  if (!technologies) return <Spinner />;

  const byCategory = new Map<string, ProjectTechnology[]>();
  for (const t of technologies) {
    if (!byCategory.has(t.category)) byCategory.set(t.category, []);
    byCategory.get(t.category)!.push(t);
  }

  return (
    <div>
      <PageHeading title="Tech stack" subtitle="What's chosen for this project, and why." />
      <div className="flex flex-col gap-6">
        {[...byCategory.entries()].map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
              {CATEGORY_LABEL[category] ?? category}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((t) => (
                <Card key={t.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-ink">{t.name}</h4>
                    {t.aiRecommended && <Badge tone="signal">AI pick</Badge>}
                  </div>
                  {t.rationale && <p className="text-sm text-ink-soft">{t.rationale}</p>}
                  {t.advantages && t.advantages.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-1 text-xs text-ink-soft">
                      {t.advantages.map((a, i) => (
                        <li key={i}>+ {a}</li>
                      ))}
                    </ul>
                  )}
                  {t.disadvantages && t.disadvantages.length > 0 && (
                    <ul className="mt-1 flex flex-col gap-1 text-xs text-ink-soft">
                      {t.disadvantages.map((a, i) => (
                        <li key={i}>− {a}</li>
                      ))}
                    </ul>
                  )}
                  {t.alternatives && t.alternatives.length > 0 && (
                    <p className="mt-3 font-mono text-xs text-ink-soft">Alternatives: {t.alternatives.join(', ')}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
