import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import type { DatabaseTable } from '../../types';
import type { ProjectOutletContext } from './ProjectLayout';
import { Badge, Card, PageHeading, Spinner } from '../../components/ui';

export default function DatabaseTab() {
  const { project } = useOutletContext<ProjectOutletContext>();
  const [tables, setTables] = useState<DatabaseTable[] | null>(null);

  useEffect(() => {
    api.get<{ tables: DatabaseTable[] }>(`/projects/${project.id}/database-tables`).then((r) => setTables(r.tables));
  }, [project.id]);

  if (!tables) return <Spinner />;

  return (
    <div>
      <PageHeading title="Database" subtitle="Tables and fields for the plan's schema." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {tables.map((t) => (
          <Card key={t.id}>
            <h4 className="mb-1 font-mono text-sm font-semibold text-ink">{t.name}</h4>
            {t.description && <p className="mb-3 text-sm text-ink-soft">{t.description}</p>}
            <table className="w-full text-left text-xs">
              <tbody>
                {t.fields.map((f) => (
                  <tr key={f.id} className="border-t border-line-soft">
                    <td className="py-1.5 pr-2 font-mono text-ink">{f.name}</td>
                    <td className="py-1.5 pr-2 font-mono text-ink-soft">{f.dataType}</td>
                    <td className="py-1.5">
                      <div className="flex gap-1">
                        {f.isPrimary && <Badge tone="signal">PK</Badge>}
                        {f.isForeign && <Badge tone="amber">FK</Badge>}
                        {f.isUnique && <Badge>unique</Badge>}
                        {!f.isNullable && <Badge>required</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </div>
  );
}
