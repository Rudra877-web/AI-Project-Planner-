import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { DATETIME } from './columnTypes';
import type { Project } from './Project';
import type { Notification } from './Notification';

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  /** bcrypt hash. Never selected by default so it cannot leak through a
   *  careless `find()` whose result gets serialised straight to JSON. */
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  jobTitle: string | null;

  /** SHA-256 of the password-reset token. The raw token exists only inside the
   *  reset link, so reading this column cannot be replayed into a reset. */
  @Column({ type: 'varchar', length: 128, nullable: true, select: false })
  resetTokenHash: string | null;

  @Column({ type: DATETIME, nullable: true, select: false })
  resetTokenExpiresAt: Date | null;

  @OneToMany('Project', 'user')
  projects: Project[];

  @OneToMany('Notification', 'user')
  notifications: Notification[];
}
