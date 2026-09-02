import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT } from './columnTypes';
import type { TechnologyCategory } from '../types/domain';
import type { ProjectTechnology } from './ProjectTechnology';

/**
 * The catalogue of technologies BuildFlow knows about, shared across all
 * projects. Seeded from services/offline/technologyCatalog.ts, which carries
 * the §6 rationale (why / alternatives / advantages / disadvantages).
 *
 * Keeping this global rather than per-project means the wizard's stack picker
 * and the "why did we choose this" panel read from one source.
 */
@Entity('technologies')
export class Technology extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug: string;

  @Column({ type: 'varchar', length: 80 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  category: TechnologyCategory;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  /** §6: "Why it is recommended". */
  @Column({ type: LONGTEXT, nullable: true })
  rationale: string | null;

  @Column({ type: 'simple-json', nullable: true })
  alternatives: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  advantages: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  disadvantages: string[] | null;

  /** lucide icon name, so the UI can render a consistent glyph per technology. */
  @Column({ type: 'varchar', length: 48, nullable: true })
  icon: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  docsUrl: string | null;

  @OneToMany('ProjectTechnology', 'technology')
  projectLinks: ProjectTechnology[];
}
