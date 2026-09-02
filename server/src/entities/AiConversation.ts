import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './BaseEntity';
import { LONGTEXT, UUID_COLUMN } from './columnTypes';
import type { AiContext, ConversationRole } from '../types/domain';
import type { Project } from './Project';

/**
 * §19 — a single turn of a project-scoped AI conversation.
 *
 * One row per message (not per thread) keeps the transcript append-only, which
 * is what the assistant needs to rebuild context on the next question.
 *
 * `context` separates the surfaces that share this table: the chat panel, the
 * "I'm Stuck" helper, the error debugger, and change analysis. `threadId`
 * groups messages within a surface.
 */
@Entity('ai_conversations')
export class AiConversation extends BaseEntity {
  @Column({ type: 'varchar', length: 16 })
  role: ConversationRole;

  @Column({ type: LONGTEXT })
  content: string;

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'chat' })
  context: AiContext;

  /** Groups the turns of one exchange. Defaults to the project's main thread. */
  @Index()
  @Column({ type: 'varchar', length: 64, default: 'main' })
  threadId: string;

  /** `claude` or `offline`, so the transcript shows which engine answered. */
  @Column({ type: 'varchar', length: 24, nullable: true })
  generatedWith: string | null;

  /** Structured payload for non-prose answers ("I'm Stuck" guidance, debug
   *  breakdowns) so the UI can render cards instead of a wall of text. */
  @Column({ type: 'simple-json', nullable: true })
  payload: Record<string, unknown> | null;

  /** Set when the turn is anchored to a specific task, e.g. an "I'm Stuck" ask. */
  @Column({ ...UUID_COLUMN, nullable: true })
  taskId: string | null;

  @Index()
  @Column({ ...UUID_COLUMN })
  projectId: string;

  @ManyToOne('Project', 'conversations', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
