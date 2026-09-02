import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { TestCase } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Card, PageHeading, Select, Spinner } from '../../components/ui';

const STATUS_TONE: Record<string, 'default' | 'signal' | 'amber' | 'rust'> = {
  not_tested: 'default',
  pass: 'signal',
  fail: 'rust',
  blocked: 'amber',
};

export default function TestsTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [tests, setTests] = useState<TestCase[] | null>(null);

  async function load() {
    const res = await api.get<{ tests: TestCase[] }>(`/projects/${project.id}/test-cases`);
    setTests(res.tests);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  async function setStatus(test: TestCase, status: string) {
    await api.patch(`/projects/${project.id}/test-cases/${test.id}`, { status });
    load();
  }

  if (!tests) return <Spinner />;

  const groups = new Map<string, TestCase[]>();
  for (const t of tests) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category)!.push(t);
  }

  return (
    <div>
      <PageHeading title="Tests" subtitle="What to verify before shipping." />
      <div className="flex flex-col gap-6">
        {[...groups.entries()].map(([category, items]) => (
          <div key={category}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{category}</h3>
            <div className="flex flex-col gap-2">
              {items.map((t) => (
                <Card key={t.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{t.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      <span className="font-medium">Input:</span> {t.input}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      <span className="font-medium">Expect:</span> {t.expectedResult}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge tone={STATUS_TONE[t.status]}>{t.status.replace('_', ' ')}</Badge>
                    <Select value={t.status} onChange={(e) => setStatus(t, e.target.value)} className="!py-1 text-xs">
                      <option value="not_tested">Not tested</option>
                      <option value="pass">Pass</option>
                      <option value="fail">Fail</option>
                      <option value="blocked">Blocked</option>
                    </Select>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
