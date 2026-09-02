import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { messageFor } from '../contexts/AuthContext';
import { Button, Card, PageHeading, Select, Textarea } from '../components/ui';
import type { Project, Technology } from '../types';

const PROJECT_TYPES = ['web', 'mobile', 'saas', 'ecommerce', 'api', 'ai', 'iot', 'other'];
const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const [projectType, setProjectType] = useState('web');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [letAiChooseStack, setLetAiChooseStack] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Technology[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ technologies: Technology[] }>('/technologies').then((r) => setCatalog(r.technologies));
  }, []);

  function toggle(slug: string) {
    setSelected((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { project } = await api.post<{ project: Project }>('/projects/generate', {
        idea,
        projectType,
        experienceLevel,
        technologies: letAiChooseStack ? [] : selected,
        letAiChooseStack,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(messageFor(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeading title="New project" subtitle="Describe what you want to build. BuildFlow plans the rest." />

      {busy ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Sparkles className="animate-pulse text-signal" size={28} />
          <p className="font-medium text-ink">Generating your plan…</p>
          <p className="max-w-xs text-sm text-ink-soft">
            Pages, database schema, API endpoints, roadmap and tests — this takes a few seconds.
          </p>
        </Card>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <Card>
            <label className="mb-1.5 block text-xs font-medium text-ink-soft">Your idea</label>
            <Textarea
              required
              rows={5}
              minLength={10}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. A food delivery app where customers order meals from local restaurants and drivers deliver them"
            />
          </Card>

          <Card className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Project type</label>
              <Select value={projectType} onChange={(e) => setProjectType(e.target.value)} className="w-full">
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-soft">Your experience level</label>
              <Select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className="w-full">
                {EXPERIENCE_LEVELS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <Card>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" checked={letAiChooseStack} onChange={(e) => setLetAiChooseStack(e.target.checked)} />
              Let BuildFlow choose the best stack
            </label>

            {!letAiChooseStack && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {catalog.map((t) => (
                  <label key={t.slug} className="flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-sm text-ink">
                    <input type="checkbox" checked={selected.includes(t.slug)} onChange={() => toggle(t.slug)} />
                    {t.name}
                  </label>
                ))}
              </div>
            )}
          </Card>

          {error && <p className="text-sm text-rust">{error}</p>}

          <Button type="submit" size="md" className="self-start">
            <Sparkles size={15} /> Generate plan
          </Button>
        </form>
      )}
    </div>
  );
}
