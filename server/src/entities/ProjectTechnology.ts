import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { TechnologyCategory } from '../types/domain';
import type { Project } from './Project';
import type { Technology } from './Technology';

/**
 * Join table between a project and its chosen stack.
 *
 * It carries its own `rationale` because the reason a technology suits *this*
 * project is not the same as the generic catalogue blurb — "Postgres because
 * orders and payments need transactional integrity" only makes sense here.
 *
 * `name`/`category` are denormalised so a stack entry survives even when the
 * AI proposes a technology that isn't in the catalogue yet.
 */
@Entity('project_technologies')
export class ProjectTechnology extends BaseEntity {
  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  category: TechnologyCategory;

  /** Project-specific justification, shown in the Tech Stack tab. */
  @Column({ type: LONGTEXT, nullable: true })
  rationale: string | null;

  @Column({ type: 'simple-json', nullable: true })
  alternatives: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  advantages: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  disadvantages: string[] | null;

  /** True when the stack was picked by "Let AI choose the best stack". */
  @Column({ type: 'boolean', default: false })
  aiRecommended: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'technologies', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  /** Optional link into the shared catalogue; null for AI-invented entries. */
  @Column({ ...UUID_COLUMN, nullable: true })
  technologyId: string | null;

  @ManyToOne('Technology', 'projectLinks', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'technologyId' })
  technology: Technology | null;
}
