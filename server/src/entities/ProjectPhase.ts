import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { PhaseStatus } from '../types/domain';
import type { Project } from './Project';
import type { Task } from './Task';

/**
 * §10 — a stage of the development roadmap (Setup → Authentication → Core
 * Features → Testing → Deployment, plus any domain-specific phases the
 * generator adds).
 *
 * Phase progress is derived from its tasks rather than stored, for the same
 * reason project progress is.
 */
@Entity('project_phases')
export class ProjectPhase extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  /** 1-based phase number, used for ordering and for the roadmap's rail. */
  @Column({ type: 'int', default: 1 })
  orderIndex: number;

  @Column({ type: 'varchar', length: 24, default: 'not_started' })
  status: PhaseStatus;

  /** Rough duration estimate shown on the roadmap, e.g. "3–5 days". */
  @Column({ type: 'varchar', length: 48, nullable: true })
  estimatedDuration: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'phases', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany('Task', 'phase')
  tasks: Task[];
}
