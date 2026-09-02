import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { RequirementType } from '../types/domain';
import type { Project } from './Project';

/**
 * The §6 project-overview content, normalised into rows rather than a blob so
 * the Change Impact Analyzer can append individual requirements over time and
 * the UI can reorder them.
 *
 * `type` distinguishes problem statement / goals / target users / core vs
 * future features, which is what lets one table back several overview panels.
 */
@Entity('project_requirements')
export class ProjectRequirement extends BaseEntity {
  @Column({ type: 'varchar', length: 32, default: 'core_feature' })
  type: RequirementType;

  @Column({ type: 'varchar', length: 240 })
  title: string;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  /** Display order within its `type` group. */
  @Column({ type: 'int', default: 0 })
  position: number;

  /** Set when this requirement arrived via an accepted change request, so the
   *  overview can mark it as added later rather than part of the original plan. */
  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'requirements', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
