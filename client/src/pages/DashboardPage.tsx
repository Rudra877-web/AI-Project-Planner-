import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';
import { Badge, Button, Card, EmptyState, PageHeading, Spinner } from '../components/ui';

const STATUS_TONE: Record<string, 'default' | 'signal' | 'amber'> = {
  planning: 'amber',
  in_progress: 'signal',
  completed: 'signal',
  archived: 'default',
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    api.get<{ projects: Project[] }>('/projects').then((r) => setProjects(r.projects));
  }, []);

  return (
    <div>
      <PageHeading
        title="Your projects"
        subtitle="Every plan you've generated, with where it stands."
        action={
          <Link to="/new">
            <Button>
              <Plus size={15} /> New project
            </Button>
          </Link>
        }
      />

      {!projects ? (
        <div className="flex justify-center py-16 text-ink-soft">
          <Spinner />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Describe an idea and BuildFlow will turn it into a full plan — pages, database, API, roadmap and tests."
          action={
            <Link to="/new">
              <Button>Start your first project</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`}>
              <Card className="h-full transition-colors hover:border-signal/40">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-medium text-ink">{p.name}</h3>
                  <Badge tone={STATUS_TONE[p.status] ?? 'default'}>{p.status.replace('_', ' ')}</Badge>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-ink-soft">{p.description}</p>
                {p.progress && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-ink-soft">
                      <span>{p.progress.completedTasks} / {p.progress.totalTasks} tasks</span>
                      <span>{p.progress.percentComplete}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-line-soft">
                      <div
                        className="h-1.5 rounded-full bg-signal transition-all"
                        style={{ width: `${p.progress.percentComplete}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
