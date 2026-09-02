import type { Request, Response } from 'express';
import { AppDataSource } from '../db/data-source';
import { AiConversation } from '../entities/AiConversation';
import { currentProject } from '../middleware/ownership';
import { getChatReply, getDebugExplanation } from '../services/ai/provider';
import { queryParam } from '../utils/params';

const repo = () => AppDataSource.getRepository(AiConversation);

/** The transcript for one thread within one surface (chat by default). */
export async function history(req: Request, res: Response) {
  const project = currentProject(req);
  const context = (queryParam(req, 'context') ?? 'chat') as AiConversation['context'];
  const threadId = queryParam(req, 'threadId') ?? 'main';

  const rows = await repo().find({
    where: { projectId: project.id, context, threadId },
    order: { createdAt: 'ASC' },
  });
  res.json({ messages: rows });
}

export async function chat(req: Request, res: Response) {
  const project = currentProject(req);
  const { message, threadId } = req.body as { message: string; threadId: string };

  const priorTurns = await repo().find({
    where: { projectId: project.id, context: 'chat', threadId },
    order: { createdAt: 'ASC' },
  });

  const userTurn = repo().create({
    role: 'user',
    content: message,
    context: 'chat',
    threadId,
    projectId: project.id,
  });
  await repo().save(userTurn);

  const { result: reply, generatedWith } = await getChatReply(message, project, priorTurns);

  const assistantTurn = repo().create({
    role: 'assistant',
    content: reply,
    context: 'chat',
    threadId,
    generatedWith,
    projectId: project.id,
  });
  await repo().save(assistantTurn);

  res.status(201).json({ reply: assistantTurn, generatedWith });
}

/** §12 error debugger — logged to the transcript under its own context. */
export async function debug(req: Request, res: Response) {
  const project = currentProject(req);
  const { error, context } = req.body as { error: string; context?: string };

  const userTurn = repo().create({
    role: 'user',
    content: error,
    context: 'debug',
    threadId: 'main',
    projectId: project.id,
  });
  await repo().save(userTurn);

  const { result, generatedWith } = await getDebugExplanation(error, context, project);

  const assistantTurn = repo().create({
    role: 'assistant',
    content: result.summary,
    context: 'debug',
    threadId: 'main',
    generatedWith,
    payload: result as unknown as Record<string, unknown>,
    projectId: project.id,
  });
  await repo().save(assistantTurn);

  res.status(201).json({ explanation: result, generatedWith });
}
