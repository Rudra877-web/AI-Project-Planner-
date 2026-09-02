import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { RelationKind } from '../types/domain';
import type { DatabaseTable } from './DatabaseTable';

/**
 * §8 — one column of a planned table, carrying everything the spec asks the
 * designer to display: name, data type, PK/FK flags, nullability, default.
 *
 * Relationships are modelled here rather than in a separate edges table: a
 * foreign key *is* the relationship, so `referencesTable`/`referencesField`
 * plus `relationKind` is enough to draw the diagram and emit correct DDL.
 */
@Entity('database_fields')
export class DatabaseField extends BaseEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  /** Postgres-flavoured type as planned by the user, e.g. `varchar(255)`,
   *  `numeric(10,2)`, `timestamptz`. Free text so the designer stays flexible. */
  @Column({ type: 'varchar', length: 80 })
  dataType: string;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ type: 'boolean', default: false })
  isForeign: boolean;

  @Column({ type: 'boolean', default: true })
  isNullable: boolean;

  @Column({ type: 'boolean', default: false })
  isUnique: boolean;

  @Column({ type: 'varchar', length: 160, nullable: true })
  defaultValue: string | null;

  @Column({ type: LONGTEXT, nullable: true })
  description: string | null;

  /** Target of the foreign key, by table *name* so the designer can reference a
   *  table before it has been created. Resolved to an id when emitting SQL. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  referencesTable: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  referencesField: string | null;

  @Column({ type: 'varchar', length: 24, nullable: true })
  relationKind: RelationKind | null;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Index()
  @Column({ ...UUID_COLUMN })
  tableId: string;

  @ManyToOne('DatabaseTable', 'fields', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tableId' })
  table: DatabaseTable;
}
