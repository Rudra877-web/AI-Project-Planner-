import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { DATETIME, LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { TestCategory, TestStatus } from '../types/domain';
import type { Project } from './Project';

/**
 * §14 — a generated test case across the six required categories.
 *
 * Shaped after the spec's example (Test / Input / Expected / Status) rather than
 * as free-form prose, so the Testing tab can render a real checklist the user
 * marks Pass / Fail / Blocked / Not Tested.
 */
@Entity('test_cases')
export class TestCase extends BaseEntity {
  @Column({ type: 'varchar', length: 240 })
  title: string;

  @Index()
  @Column({ type: 'varchar', length: 24 })
  category: TestCategory;

  @Column({ type: LONGTEXT })
  input: string;

  @Column({ type: LONGTEXT })
  expectedResult: string;

  @Column({ type: 'varchar', length: 24, default: 'not_tested' })
  status: TestStatus;

  /** Free-text notes captured when a test is marked Fail or Blocked. */
  @Column({ type: LONGTEXT, nullable: true })
  notes: string | null;

  /** What this test exercises — a page name, an endpoint, or a feature. */
  @Column({ type: 'varchar', length: 200, nullable: true })
  target: string | null;

  @Column({ type: DATETIME, nullable: true })
  lastRunAt: Date | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ ...UUID_COLUMN, nullable: true })
  originChangeId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'testCases', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
