import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { NotificationType } from '../types/domain';
import type { User } from './User';

/**
 * In-app notifications — plan generated, change accepted, phase completed.
 *
 * Scoped to a user rather than a project so the bell in the dashboard header
 * has one place to read from, with `projectId` present for deep-linking.
 */
@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: LONGTEXT, nullable: true })
  body: string | null;

  @Column({ type: 'varchar', length: 16, default: 'info' })
  type: NotificationType;

  @Index()
  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  /** Client route to open when the notification is clicked. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  link: string | null;

  @Column({ ...UUID_COLUMN, nullable: true })
  projectId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  userId: string;

  @ManyToOne('User', 'notifications', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
