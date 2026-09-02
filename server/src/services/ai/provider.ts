import { env } from '../../config/env';
import type { Project } from '../../entities/Project';
import type { Task } from '../../entities/Task';
import type { AiConversation } from '../../entities/AiConversation';
import type { ImpactAnalysis } from '../../types/domain';
import type { DebugExplanation, GeneratedPlan, PlanRequest, StuckGuidance } from '../../types/plan';
import { synthesizePlan } from '../offline/synthesize';
import { offlineChatReply, offlineDebugExplanation, offlineStuckGuidance } from '../offline/assist';
import { offlineImpactAnalysis } from '../offline/changeAnalyzer';
import { askClaudeForJson, ClaudeCallError } from './claude';
import {
  chatReplySchema,
  debugExplanationSchema,
  generatedPlanSchema,
  impactAnalysisSchema,
  stuckGuidanceSchema,
} from './schemas';

/**
 * Every exported function here returns `{ result, generatedWith }` and never
 * throws for "Claude failed" — it silently drops to the offline engine
 * instead, because a planning tool that hard-fails when a third-party API
 * hiccups is worse than one that degrades to a slightly less tailored answer.
 * Genuine programming errors (bad input) still throw normally.
 */

export type Engine = 'claude' | 'offline';

export interface AiResult<T> {
  result: T;
  generatedWith: Engine;
}

async function withFallback<T>(claude: () => Promise<T>, offline: () => T): Promise<AiResult<T>> {
  if (env.aiEnabled) {
    try {
      return { result: await claude(), generatedWith: 'claude' };
    } catch (error) {
      console.warn('[ai] Claude call failed, falling back to offline engine:', (error as ClaudeCallError).message);
    }
  }
  return { result: offline(), generatedWith: 'offline' };
}

export async function generatePlan(request: PlanRequest): Promise<AiResult<GeneratedPlan>> {
  return withFallback(
    () =>
      askClaudeForJson({
        model: env.AI_PLANNING_MODEL,
        maxTokens: 8192,
        system:
          'You are BuildFlow\u2019s project planning engine. Given a raw app idea, produce a complete, ' +
          'internally consistent development plan as a single JSON object matching the exact schema ' +
          'described by the user. Every page must reference apis and entities that also appear in the ' +
          '`endpoints` and `tables` arrays. Every endpoint must reference tables that appear in `tables`. ' +
          'Every phase\u2019s tasks should be concrete and specific to this idea, not generic filler. ' +
          'Respond with ONLY the JSON object — no markdown fences, no commentary.',
        prompt: JSON.stringify({
          idea: request.idea,
          projectType: request.projectType,
          experienceLevel: request.experienceLevel,
          preferredTechnologies: request.technologies,
          letAiChooseStack: request.letAiChooseStack,
          instructions:
            'Produce a GeneratedPlan JSON object with keys: name, description, problemStatement, ' +
            'targetUsers[], goals[], coreFeatures[{title,description}], futureFeatures[{title,description}], ' +
            'stack[{name,category,rationale,alternatives[],advantages[],disadvantages[]}], ' +
            'architecture[{name,description,technologies[],external?[]}], ' +
            'pages[{name,route,purpose,components[],userActions[],apis[],entities[],isProtected?,isAdmin?}], ' +
            'tables[{name,description,fields[{name,dataType,isPrimary?,isForeign?,isNullable?,isUnique?,defaultValue?,description?,referencesTable?,referencesField?}]}], ' +
            'endpoints[{method,path,description,group,requiresAuth,requestBody?,parameters?,responseExample?,successStatus?,relatedTables[]}], ' +
            'phases[{name,description,orderIndex,estimatedDuration,tasks[{title,description,priority,estimatedHours,dependsOn?[]}]}], ' +
            'tests[{title,category,input,expectedResult,target?}], ' +
            'deployment{targets[{layer,provider,reason,steps[],buildCommand?,startCommand?}],environmentVariables[{key,description,example,secret}],productionChecklist[],commonErrors[{error,cause,fix}]}, ' +
            'domain (a short slug for the detected app domain).',
        }),
        schema: generatedPlanSchema,
      }),
    () => synthesizePlan(request),
  );
}

export async function getChatReply(
  message: string,
  project: Project,
  history: AiConversation[],
): Promise<AiResult<string>> {
  return withFallback(
    () =>
      askClaudeForJson({
        model: env.AI_CHAT_MODEL,
        system:
          'You are BuildFlow\u2019s in-app assistant, helping a developer build the project described below. ' +
          'Answer their question directly and practically, grounded in the project\u2019s actual plan. ' +
          'Respond with ONLY a JSON object: { "reply": "..." }.',
        prompt: JSON.stringify({
          project: { name: project.name, description: project.description, type: project.type, domain: project.domain },
          history: history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
          message,
        }),
        schema: chatReplySchema,
      }).then((r) => r.reply),
    () => offlineChatReply(message, project),
  );
}

export async function getStuckGuidance(task: Task, project: Project): Promise<AiResult<StuckGuidance>> {
  return withFallback(
    () =>
      askClaudeForJson({
        model: env.AI_CHAT_MODEL,
        system:
          'A developer is stuck on the task below, inside the project described. Give concrete, actionable ' +
          'guidance grounded in the actual stack and task, not generic advice. Respond with ONLY a JSON object ' +
          'matching: { taskTitle, prerequisites[], steps[{title,detail}], commonErrors[{error,cause,fix}], ' +
          'codeExample: {language,code,caption?} | null, resources[{label,url}] }.',
        prompt: JSON.stringify({
          project: { name: project.name, type: project.type, domain: project.domain },
          task: { title: task.title, description: task.description, priority: task.priority },
        }),
        schema: stuckGuidanceSchema,
      }),
    () => offlineStuckGuidance(task, project),
  );
}

export async function getDebugExplanation(
  errorText: string,
  context: string | undefined,
  project: Project,
): Promise<AiResult<DebugExplanation>> {
  return withFallback(
    () =>
      askClaudeForJson({
        model: env.AI_CHAT_MODEL,
        system:
          'Explain the error below for a developer working on the project described, using the ' +
          'Error \u2192 Cause \u2192 Solution \u2192 Example format. Respond with ONLY a JSON object matching: ' +
          '{ summary, error, cause, solution, example: {language,code} | null, relatedChecks[] }.',
        prompt: JSON.stringify({
          project: { name: project.name, type: project.type, domain: project.domain },
          context: context ?? null,
          error: errorText,
        }),
        schema: debugExplanationSchema,
      }),
    () => offlineDebugExplanation(errorText, context),
  );
}

export async function analyzeChangeRequest(
  request: string,
  project: Project,
): Promise<AiResult<ImpactAnalysis>> {
  return withFallback(
    () =>
      askClaudeForJson({
        model: env.AI_PLANNING_MODEL,
        maxTokens: 4096,
        system:
          'A developer wants to change the project described below. Determine the full blast radius of the ' +
          'change: which tables need to be created or modified, which new API endpoints and pages are needed, ' +
          'what tasks and tests it implies, and any risks. Ground every answer in the project\u2019s existing plan. ' +
          'Respond with ONLY a JSON object matching: { summary, ' +
          'affectedTables[{name,action:"create"|"modify",reason,fields?:[{name,dataType,nullable?,isPrimary?,isForeign?,references?,defaultValue?,description?}]}], ' +
          'newEndpoints[{method,path,description,requiresAuth,requestBody?,responseExample?,relatedTables[]}], ' +
          'newPages[{name,route,purpose,components[],userActions[],apis[],entities[]}], ' +
          'newTasks[{title,description,priority,estimatedHours,phase?}], ' +
          'newTests[{title,category,input,expectedResult}], risks[] }.',
        prompt: JSON.stringify({
          project: {
            name: project.name,
            description: project.description,
            domain: project.domain,
            existingTables: (project.databaseTables ?? []).map((t) => t.name),
            existingPages: (project.pages ?? []).map((p) => p.name),
            existingEndpoints: (project.apiEndpoints ?? []).map((e) => `${e.method} ${e.path}`),
          },
          request,
        }),
        schema: impactAnalysisSchema,
      }),
    () => offlineImpactAnalysis(request, project),
  );
}
