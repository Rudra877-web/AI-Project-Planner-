import { useEffect, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HelpCircle, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../lib/api';
import type { StuckGuidance, Task } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Button, Card, Input, PageHeading, Select, Spinner, Textarea } from '../../components/ui';
import { cn } from '../../lib/cn';

const COLUMNS: Array<{ status: Task['status']; label: string }> = [
  { status: 'todo', label: 'To do' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'review', label: 'Review' },
  { status: 'completed', label: 'Completed' },
];

const PRIORITY_TONE: Record<string, 'default' | 'signal' | 'amber' | 'rust'> = {
  low: 'default',
  medium: 'signal',
  high: 'amber',
  critical: 'rust',
};

export default function BoardTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stuckTask, setStuckTask] = useState<Task | null>(null);
  const [guidance, setGuidance] = useState<StuckGuidance | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  async function load() {
    const res = await api.get<{ tasks: Task[] }>(`/projects/${project.id}/tasks`);
    setTasks(res.tasks);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function moveTask(task: Task, status: Task['status']) {
    const boardPosition = (tasks ?? []).filter((t) => t.status === status).length;
    await api.patch(`/projects/${project.id}/tasks/${task.id}/move`, { status, boardPosition });
    load();
  }

  async function removeTask(task: Task) {
    await api.delete(`/projects/${project.id}/tasks/${task.id}`);
    load();
  }

  async function createTask(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await api.post(`/projects/${project.id}/tasks`, {
      title: form.get('title'),
      description: form.get('description') || undefined,
      priority: form.get('priority'),
      estimatedHours: Number(form.get('estimatedHours')) || 2,
    });
    setShowForm(false);
    load();
  }

  async function openStuck(task: Task) {
    setStuckTask(task);
    if (task.stuckGuidance) {
      setGuidance(task.stuckGuidance);
      return;
    }
    setGuidanceLoading(true);
    try {
      const res = await api.post<{ guidance: StuckGuidance }>(`/projects/${project.id}/tasks/${task.id}/stuck`);
      setGuidance(res.guidance);
    } finally {
      setGuidanceLoading(false);
    }
  }

  if (!tasks) return <Spinner />;

  return (
    <div>
      <PageHeading
        title="Board"
        subtitle="Drag your priorities into focus — move tasks with the status menu on each card."
        action={
          <Button onClick={() => setShowForm((s) => !s)}>
            <Plus size={15} /> Add task
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={createTask} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input name="title" placeholder="Task title" required className="sm:col-span-2" />
            <Textarea name="description" placeholder="Description (optional)" rows={2} className="sm:col-span-2" />
            <Select name="priority" defaultValue="medium">
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
              <option value="critical">Critical priority</option>
            </Select>
            <Input name="estimatedHours" type="number" min={0} step={0.5} defaultValue={2} placeholder="Estimated hours" />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Add</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.status).sort((a, b) => a.boardPosition - b.boardPosition);
          return (
            <div key={col.status}>
              <h3 className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {col.label}
                <span className="rounded-full bg-line-soft px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">{items.length}</span>
              </h3>
              <div className="flex flex-col gap-2">
                {items.map((task) => (
                  <Card key={task.id} className="p-3">
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium text-ink', task.status === 'completed' && 'line-through text-ink-soft')}>
                        {task.title}
                      </p>
                      <button onClick={() => removeTask(task)} className="shrink-0 text-ink-soft hover:text-rust">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {task.description && <p className="mb-2 line-clamp-2 text-xs text-ink-soft">{task.description}</p>}
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                      <Badge>{task.estimatedHours}h</Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={task.status}
                        onChange={(e) => moveTask(task, e.target.value as Task['status'])}
                        className="flex-1 !py-1 text-xs"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </Select>
                      <button
                        onClick={() => openStuck(task)}
                        title="I'm stuck"
                        className="rounded-md border border-line p-1.5 text-ink-soft hover:border-signal/40 hover:text-signal"
                      >
                        <HelpCircle size={14} />
                      </button>
                    </div>
                  </Card>
                ))}
                {items.length === 0 && <p className="rounded-md border border-dashed border-line py-6 text-center text-xs text-ink-soft">Empty</p>}
              </div>
            </div>
          );
        })}
      </div>

      {stuckTask && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/30 p-4" onClick={() => setStuckTask(null)}>
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-medium text-ink">Stuck on: {stuckTask.title}</h3>
              <button onClick={() => setStuckTask(null)} className="text-ink-soft hover:text-ink">
                <X size={16} />
              </button>
            </div>
            {guidanceLoading || !guidance ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-sm">
                {guidance.prerequisites.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-ink">Before you start</p>
                    <ul className="list-inside list-disc text-ink-soft">
                      {guidance.prerequisites.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="mb-1 font-medium text-ink">Steps</p>
                  <ol className="flex flex-col gap-2">
                    {guidance.steps.map((s, i) => (
                      <li key={i} className="rounded-md border border-line-soft p-2.5">
                        <p className="font-medium text-ink">{i + 1}. {s.title}</p>
                        <p className="mt-1 text-ink-soft">{s.detail}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                {guidance.commonErrors.length > 0 && (
                  <div>
                    <p className="mb-1 font-medium text-ink">Common errors</p>
                    <div className="flex flex-col gap-2">
                      {guidance.commonErrors.map((e, i) => (
                        <div key={i} className="rounded-md bg-rust-soft p-2.5 text-rust">
                          <p className="font-medium">{e.error}</p>
                          <p className="mt-1 text-ink-soft">{e.cause}</p>
                          <p className="mt-1 font-medium">Fix: {e.fix}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
