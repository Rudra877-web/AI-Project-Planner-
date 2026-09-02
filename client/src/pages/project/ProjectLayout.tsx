import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { Project } from '../../types';
import { Badge, Spinner } from '../../components/ui';
import { cn } from '../../lib/cn';

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'stack', label: 'Tech stack' },
  { to: 'pages', label: 'Pages' },
  { to: 'database', label: 'Database' },
  { to: 'api', label: 'API' },
  { to: 'roadmap', label: 'Roadmap' },
  { to: 'board', label: 'Board' },
  { to: 'tests', label: 'Tests' },
  { to: 'chat', label: 'AI chat' },
  { to: 'changes', label: 'Changes' },
  { to: 'readme', label: 'README' },
];

export interface ProjectOutletContext {
  project: Project;
  refresh: () => Promise<void>;
}

export default function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);

  async function load() {
    if (!id) return;
    const res = await api.get<{ project: Project; progress: Project['progress'] }>(`/projects/${id}`);
    setProject({ ...res.project, progress: res.progress });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function remove() {
    if (!project) return;
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await api.delete(`/projects/${project.id}`);
    navigate('/dashboard');
  }

  if (!project) {
    return (
      <div className="flex justify-center py-16 text-ink-soft">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
      <aside>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={14} /> All projects
        </button>

        <div className="mb-4">
          <h2 className="truncate font-medium text-ink">{project.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="signal">{project.status.replace('_', ' ')}</Badge>
            {project.progress && <span className="text-xs text-ink-soft">{project.progress.percentComplete}% done</span>}
          </div>
        </div>

        <nav className="flex flex-col gap-0.5">
          {TABS.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm text-ink-soft hover:bg-line-soft hover:text-ink',
                  isActive && 'bg-signal-soft font-medium text-signal-dark',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={remove}
          className="mt-6 flex items-center gap-1.5 text-sm text-ink-soft hover:text-rust"
        >
          <Trash2 size={14} /> Delete project
        </button>
      </aside>

      <div className="min-w-0">
        <Outlet context={{ project, refresh: load } satisfies ProjectOutletContext} />
      </div>
    </div>
  );
}
