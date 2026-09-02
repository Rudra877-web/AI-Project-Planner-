import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { DATETIME, LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { ChangeStatus, ImpactAnalysis } from '../types/domain';
import type { Project } from './Project';

/**
 * §13 — a requested requirement change and its computed blast radius.
 *
 * The whole analysis is held in `impact` while the change sits `pending`, so
 * nothing touches the live plan until the user accepts. Accepting replays the
 * payload inside one transaction (services/changeAnalyzer.ts) and stamps every
 * row it creates with this change's id via their `originChangeId` column —
 * which is what makes an accepted change traceable after the fact.
 */
@Entity('project_changes')
export class ProjectChange extends BaseEntity {
  /** What the user asked for, verbatim. */
  @Column({ type: LONGTEXT })
  request: string;

  @Column({ type: 'varchar', length: 240, nullable: true })
  title: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: ChangeStatus;

  /** The full §13 breakdown: affected tables, new APIs, pages, tasks, tests. */
  @Column({ type: 'simple-json', nullable: true })
  impact: ImpactAnalysis | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  generatedWith: string | null;

  @Column({ type: DATETIME, nullable: true })
  resolvedAt: Date | null;

  /** Counts of what was actually written on accept, for the audit trail. */
  @Column({ type: 'simple-json', nullable: true })
  appliedSummary: Record<string, number> | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'changes', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
