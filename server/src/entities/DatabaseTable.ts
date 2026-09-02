import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { Project } from './Project';
import type { DatabaseField } from './DatabaseField';

/**
 * §8 — a planned table in the user's schema (not a table in *our* schema).
 *
 * `positionX`/`positionY` persist the node placement in the visual designer so
 * a carefully arranged diagram survives a reload.
 */
@Entity('database_tables')
export class DatabaseTable extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  /** Canvas coordinates in the visual designer. */
  @Column({ type: 'int', default: 0 })
  positionX: number;

  @Column({ type: 'int', default: 0 })
  positionY: number;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'databaseTables', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @OneToMany('DatabaseField', 'table')
  fields: DatabaseField[];
}
