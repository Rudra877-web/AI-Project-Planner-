import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { PhaseProgress } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Card, PageHeading, Spinner } from '../../components/ui';

interface RawPhase {
  id: string;
  name: string;
  description: string | null;
  estimatedDuration: string | null;
  orderIndex: number;
  tasks: Array<{ id: string; title: string; status: string }>;
}

export default function RoadmapTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [phases, setPhases] = useState<PhaseProgress[] | null>(null);
  const [raw, setRaw] = useState<RawPhase[]>([]);

  useEffect(() => {
    api
      .get<{ phases: PhaseProgress[]; raw: RawPhase[] }>(`/projects/${project.id}/phases`)
      .then((r) => {
        setPhases(r.phases);
        setRaw(r.raw);
      });
  }, [project.id]);

  if (!phases) return <Spinner />;

  return (
    <div>
      <PageHeading title="Roadmap" subtitle="Phases, in build order." />
      <div className="flex flex-col gap-4">
        {phases.map((phase, i) => {
          const detail = raw.find((r) => r.id === phase.id);
          return (
            <Card key={phase.id}>
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Phase {i + 1}</p>
                  <h4 className="font-medium text-ink">{phase.name}</h4>
                </div>
                <span className="whitespace-nowrap text-xs text-ink-soft">{detail?.estimatedDuration}</span>
              </div>
              {detail?.description && <p className="mb-3 text-sm text-ink-soft">{detail.description}</p>}
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-xs text-ink-soft">
                  <span>{phase.completedTasks} / {phase.totalTasks} tasks</span>
                  <span>{phase.percentComplete}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-line-soft">
                  <div className="h-1.5 rounded-full bg-signal" style={{ width: `${phase.percentComplete}%` }} />
                </div>
              </div>
              {detail && detail.tasks.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {detail.tasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-ink-soft">
                      <span className={`h-1.5 w-1.5 rounded-full ${t.status === 'completed' ? 'bg-signal' : 'bg-line'}`} />
                      <span className={t.status === 'completed' ? 'line-through' : ''}>{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
