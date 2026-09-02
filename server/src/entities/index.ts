export { BaseEntity } from './BaseEntity';
export { User } from './User';
export { Project } from './Project';
export { ProjectRequirement } from './ProjectRequirement';
export { Technology } from './Technology';
export { ProjectTechnology } from './ProjectTechnology';
export { Page } from './Page';
export { DatabaseTable } from './DatabaseTable';
export { DatabaseField } from './DatabaseField';
export { ApiEndpoint } from './ApiEndpoint';
export { Task } from './Task';
export { TaskDependency } from './TaskDependency';
export { TestCase } from './TestCase';
export { ProjectPhase } from './ProjectPhase';
export { AiConversation } from './AiConversation';
export { ProjectChange } from './ProjectChange';
export { Notification } from './Notification';

import { User } from './User';
import { Project } from './Project';
import { ProjectRequirement } from './ProjectRequirement';
import { Technology } from './Technology';
import { ProjectTechnology } from './ProjectTechnology';
import { Page } from './Page';
import { DatabaseTable } from './DatabaseTable';
import { DatabaseField } from './DatabaseField';
import { ApiEndpoint } from './ApiEndpoint';
import { Task } from './Task';
import { TaskDependency } from './TaskDependency';
import { TestCase } from './TestCase';
import { ProjectPhase } from './ProjectPhase';
import { AiConversation } from './AiConversation';
import { ProjectChange } from './ProjectChange';
import { Notification } from './Notification';

/**
 * Registered explicitly rather than by glob. Globbing entity files breaks the
 * moment the code is bundled or run from `dist`, and an explicit list makes a
 * missing registration a compile error instead of a confusing runtime one.
 */
export const entities = [
  User,
  Project,
  ProjectRequirement,
  Technology,
  ProjectTechnology,
  Page,
  DatabaseTable,
  DatabaseField,
  ApiEndpoint,
  Task,
  TaskDependency,
  TestCase,
  ProjectPhase,
  AiConversation,
  ProjectChange,
  Notification,
];
