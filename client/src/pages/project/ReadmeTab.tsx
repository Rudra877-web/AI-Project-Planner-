import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import type { ProjectOutletContext } from './ProjectLayout';
import { Button, Card, PageHeading, Spinner } from '../../components/ui';

export default function ReadmeTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [readme, setReadme] = useState<string | null>(project.readme);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await api.post<{ readme: string }>(`/projects/${project.id}/readme`);
      setReadme(res.readme);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeading
        title="README"
        subtitle="A markdown README generated from this project's plan."
        action={
          <Button onClick={generate} disabled={busy}>
            <RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> {readme ? 'Regenerate' : 'Generate'}
          </Button>
        }
      />
      <Card>
        {busy ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : readme ? (
          <div className="markdown-body">
            <ReactMarkdown>{readme}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">No README yet — generate one from the current plan.</p>
        )}
      </Card>
    </div>
  );
}
