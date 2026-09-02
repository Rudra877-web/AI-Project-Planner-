import { useOutletContext } from 'react-router-dom';
import type { ProjectOutletContext } from './ProjectLayout';
import { Card } from '../../components/ui';

export default function OverviewTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const goals = project.goals ?? [];
  const targetUsers = project.targetUsers ?? [];
  const architecture = project.architecture ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="mb-2 font-medium text-ink">Description</h3>
        <p className="text-sm text-ink-soft">{project.description}</p>
        {project.problemStatement && (
          <>
            <h3 className="mb-2 mt-4 font-medium text-ink">Problem</h3>
            <p className="text-sm text-ink-soft">{project.problemStatement}</p>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {goals.length > 0 && (
          <Card>
            <h3 className="mb-3 font-medium text-ink">Goals</h3>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              {goals.map((g, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-signal" />
                  {g}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {targetUsers.length > 0 && (
          <Card>
            <h3 className="mb-3 font-medium text-ink">Target users</h3>
            <ul className="flex flex-col gap-2 text-sm text-ink-soft">
              {targetUsers.map((u, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber" />
                  {u}
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {architecture.length > 0 && (
        <Card>
          <h3 className="mb-3 font-medium text-ink">Architecture</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {architecture.map((layer) => (
              <div key={layer.name} className="rounded-md border border-line-soft p-3">
                <p className="text-sm font-medium text-ink">{layer.name}</p>
                <p className="mt-1 text-xs text-ink-soft">{layer.description}</p>
                {layer.technologies.length > 0 && (
                  <p className="mt-2 font-mono text-xs text-signal-dark">{layer.technologies.join(' · ')}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {project.progress && (
        <Card>
          <h3 className="mb-3 font-medium text-ink">Progress</h3>
          <div className="mb-2 flex justify-between text-sm text-ink-soft">
            <span>{project.progress.completedTasks} of {project.progress.totalTasks} tasks complete</span>
            <span>{project.progress.percentComplete}%</span>
          </div>
          <div className="h-2 rounded-full bg-line-soft">
            <div className="h-2 rounded-full bg-signal transition-all" style={{ width: `${project.progress.percentComplete}%` }} />
          </div>
        </Card>
      )}
    </div>
  );
}
