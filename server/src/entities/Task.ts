import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { DATETIME, LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { TaskPriority, TaskStatus } from '../types/domain';
import type { Project } from './Project';
import type { ProjectPhase } from './ProjectPhase';
import type { TaskDependency } from './TaskDependency';

/**
 * §11 — a unit of work on the Kanban board.
 *
 * `boardPosition` stores the card's index within its status column so a
 * drag-and-drop reorder persists, not just the column change.
 *
 * `completedAt` is stamped on the transition into `completed` and cleared on
 * the way out; §20's velocity chart is computed from it, so it has to reflect
 * the real moment of completion rather than `updatedAt`.
 */
@Entity('tasks')
export class Task extends BaseEntity {
  @Column({ type: 'varchar', length: 240 })
  title: string;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 24, default: 'medium' })
  priority: TaskPriority;

  @Index()
  @Column({ type: 'varchar', length: 24, default: 'todo' })
  status: TaskStatus;

  /** Estimated effort in hours. Float because half-hour estimates are common. */
  @Column({ type: 'float', default: 2 })
  estimatedHours: number;

  /** §11 "Assigned developer" — free text. The spec defines no team model, so
   *  this is deliberately not a user reference. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  assignee: string | null;

  @Column({ type: 'simple-json', nullable: true })
  tags: string[] | null;

  @Column({ type: 'int', default: 0 })
  boardPosition: number;

  @Column({ type: DATETIME, nullable: true })
  completedAt: Date | null;

  /** Cached "I'm Stuck" guidance, so re-opening the panel doesn't re-bill an
   *  AI call for the same task. Invalidated when the task title changes. */
  @Column({ type: 'simple-json', nullable: true })
  stuckGuidance: Record<string, unknown> | null;

  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'tasks', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ ...UUID_COLUMN, nullable: true })
  phaseId: string | null;

  @ManyToOne('ProjectPhase', 'tasks', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'phaseId' })
  phase: ProjectPhase | null;

  /** Tasks that must finish before this one can start. */
  @OneToMany('TaskDependency', 'task')
  dependencies: TaskDependency[];

  @OneToMany('TaskDependency', 'dependsOn')
  dependents: TaskDependency[];
}
