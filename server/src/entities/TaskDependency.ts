import { Entity, Index, JoinColumn, ManyToOne, Column, Unique } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { UUID_COLUMN } from './columnTypes';
import type { Task } from './Task';

/**
 * §11 task dependencies — "task A cannot start until task B is done".
 *
 * A separate edge table rather than a JSON array on Task, so the graph can be
 * traversed in SQL for cycle detection and so deleting a task cleanly removes
 * the edges pointing at it.
 */
@Entity('task_dependencies')
@Unique('uq_task_dependency', ['taskId', 'dependsOnId'])
export class TaskDependency extends BaseEntity {
  /** The task that is blocked. */
  @Index()
  @Column({ ...UUID_COLUMN })
  taskId: string;

  @ManyToOne('Task', 'dependencies', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  /** The task it is waiting on. */
  @Index()
  @Column({ ...UUID_COLUMN })
  dependsOnId: string;

  @ManyToOne('Task', 'dependents', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependsOnId' })
  dependsOn: Task;
}
