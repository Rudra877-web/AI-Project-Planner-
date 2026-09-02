import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type {
  ArchitectureLayer,
  DeploymentPlan,
  ExperienceLevel,
  ProjectStatus,
  ProjectType,
} from '../types/domain';
import type { User } from './User';
import type { ProjectRequirement } from './ProjectRequirement';
import type { ProjectTechnology } from './ProjectTechnology';
import type { Page } from './Page';
import type { DatabaseTable } from './DatabaseTable';
import type { ApiEndpoint } from './ApiEndpoint';
import type { Task } from './Task';
import type { TestCase } from './TestCase';
import type { ProjectPhase } from './ProjectPhase';
import type { AiConversation } from './AiConversation';
import type { ProjectChange } from './ProjectChange';

/**
 * The hub of the domain. Everything else in a plan hangs off a project, and
 * every project-scoped request is resolved through `loadProject`, which scopes
 * the lookup by owner — see middleware/ownership.ts.
 *
 * Progress is deliberately *not* stored here. It is derived from task state on
 * read (services/analytics.ts) so a dragged Kanban card cannot leave a stale
 * percentage behind on the dashboard.
 */
@Entity('projects')
export class Project extends BaseEntity {
  @Column({ type: 'varchar', length: 180 })
  name: string;

  @Column({ type: 'varchar', length: 400 })
  description: string;

  /** The raw idea the user typed in step 1 of the wizard. Kept verbatim: it is
   *  the input to regeneration and to change-impact analysis. */
  @Column({ type: LONGTEXT })
  idea: string;

  @Column({ type: 'varchar', length: 32, default: 'web' })
  type: ProjectType;

  @Index()
  @Column({ type: 'varchar', length: 32, default: 'planning' })
  status: ProjectStatus;

  @Column({ type: 'varchar', length: 32, default: 'intermediate' })
  experienceLevel: ExperienceLevel;

  @Column({ type: LONGTEXT, nullable: true })
  problemStatement: string | null;

  @Column({ type: 'simple-json', nullable: true })
  targetUsers: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  goals: string[] | null;

  /** §6 architecture diagram, ordered top-to-bottom. */
  @Column({ type: 'simple-json', nullable: true })
  architecture: ArchitectureLayer[] | null;

  /** §15 deployment plan, derived from the selected stack. */
  @Column({ type: 'simple-json', nullable: true })
  deployment: DeploymentPlan | null;

  /** Cached output of the §16 README generator, so re-opening the tab is free. */
  @Column({ type: LONGTEXT, nullable: true })
  readme: string | null;

  /** Detected domain from the offline engine (food-delivery, saas, …). Useful
   *  for change analysis, which re-uses the same blueprint. */
  @Column({ type: 'varchar', length: 48, nullable: true })
  domain: string | null;

  @Column({ type: 'boolean', default: false })
  aiGenerated: boolean;

  /** `claude` or `offline` — surfaced in the UI so the user always knows which
   *  engine produced the plan they are looking at. */
  @Column({ type: 'varchar', length: 24, nullable: true })
  generatedWith: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  userId: string;

  @ManyToOne('User', 'projects', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany('ProjectRequirement', 'project')
  requirements: ProjectRequirement[];

  @OneToMany('ProjectTechnology', 'project')
  technologies: ProjectTechnology[];

  @OneToMany('Page', 'project')
  pages: Page[];

  @OneToMany('DatabaseTable', 'project')
  databaseTables: DatabaseTable[];

  @OneToMany('ApiEndpoint', 'project')
  apiEndpoints: ApiEndpoint[];

  @OneToMany('Task', 'project')
  tasks: Task[];

  @OneToMany('TestCase', 'project')
  testCases: TestCase[];

  @OneToMany('ProjectPhase', 'project')
  phases: ProjectPhase[];

  @OneToMany('AiConversation', 'project')
  conversations: AiConversation[];

  @OneToMany('ProjectChange', 'project')
  changes: ProjectChange[];
}
