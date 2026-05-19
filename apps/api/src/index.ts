import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { createHash, randomUUID } from 'node:crypto';
import type {
  AuditLogEntry,
  AuthenticatedUser,
  CreateFindingInput,
  CreateTaskInput,
  TaskColumn,
} from '@redops/shared';
import {
  createFinding,
  createTask,
  getActivity,
  getDemoUser,
  getEngagements,
  getTeam,
  getWorkspace,
  moveTask,
} from './seed.js';

const host = process.env.API_HOST ?? '0.0.0.0';
const port = Number(process.env.API_PORT ?? 4000);
const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';
const cookieName = process.env.SESSION_COOKIE_NAME ?? 'redops_session';

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

const sessions = new Map<string, AuthenticatedUser>();
const pendingChallenges = new Map<string, AuthenticatedUser>();
const auditLogs: AuditLogEntry[] = [];

const problem = (status: number, title: string, detail: string) => ({
  type: 'about:blank',
  title,
  status,
  detail,
  instance: randomUUID(),
});

const appendAudit = (
  request: FastifyRequest,
  eventType: string,
  actor: string,
  resourceType: string,
  resourceId: string,
  outcome: 'success' | 'failure',
  metadata: Record<string, unknown> = {},
) => {
  const prior = auditLogs.at(0)?.chainHash ?? 'GENESIS';
  const timestamp = new Date().toISOString();
  const chainHash = createHash('sha256')
    .update(JSON.stringify({ prior, timestamp, eventType, actor, resourceType, resourceId, outcome, metadata }))
    .digest('hex');

  auditLogs.unshift({
    id: randomUUID(),
    timestamp,
    eventType,
    actor,
    actorIp: request.ip,
    resourceType,
    resourceId,
    outcome,
    metadata,
    chainHash,
  });
};

const requireAuth = (request: FastifyRequest, reply: FastifyReply): AuthenticatedUser | undefined => {
  const sessionId = request.cookies[cookieName];
  if (!sessionId) {
    reply.code(401).send(problem(401, 'Unauthorized', 'Missing RedOps session cookie.'));
    return undefined;
  }

  const user = sessions.get(sessionId);
  if (!user) {
    reply.code(401).send(problem(401, 'Unauthorized', 'Session is invalid or expired.'));
    return undefined;
  }

  return user;
};

await app.register(cors, {
  origin: webOrigin,
  credentials: true,
});

await app.register(cookie);

app.get('/health', async () => ({
  status: 'ok',
  service: 'redops-api',
  time: new Date().toISOString(),
}));

app.post('/api/v1/auth/login', async (request, reply) => {
  const body = request.body as { email?: string };
  const user = getDemoUser();

  if (!body.email) {
    appendAudit(request, 'auth.login', 'anonymous', 'user', 'unknown', 'failure', { reason: 'missing_email' });
    return reply.code(400).send(problem(400, 'Invalid login request', 'Email is required.'));
  }

  const challengeId = randomUUID();
  pendingChallenges.set(challengeId, user);
  appendAudit(request, 'auth.login', user.user, 'user', user.id, 'success', { mfaRequired: true });
  return { requiresMfa: true, challengeId };
});

app.post('/api/v1/auth/mfa', async (request, reply) => {
  const body = request.body as { challengeId?: string; code?: string };
  if (!body.challengeId || !pendingChallenges.has(body.challengeId)) {
    appendAudit(request, 'auth.mfa', 'anonymous', 'challenge', body.challengeId ?? 'unknown', 'failure');
    return reply.code(401).send(problem(401, 'Invalid MFA challenge', 'Challenge is missing or expired.'));
  }

  const user = pendingChallenges.get(body.challengeId);
  if (!user) {
    return reply.code(401).send(problem(401, 'Invalid MFA challenge', 'Challenge is missing or expired.'));
  }

  pendingChallenges.delete(body.challengeId);
  const sessionId = randomUUID();
  sessions.set(sessionId, user);
  reply.setCookie(cookieName, sessionId, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  appendAudit(request, 'auth.mfa', user.user, 'user', user.id, 'success', { method: 'totp', demoCodeAccepted: Boolean(body.code) });
  return { user };
});

app.post('/api/v1/auth/logout', async (request, reply) => {
  const sessionId = request.cookies[cookieName];
  const user = sessionId ? sessions.get(sessionId) : undefined;
  if (sessionId) sessions.delete(sessionId);
  reply.clearCookie(cookieName, { path: '/' });
  appendAudit(request, 'auth.logout', user?.user ?? 'anonymous', 'session', sessionId ?? 'unknown', 'success');
  return { ok: true };
});

app.get('/api/v1/me', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  return { user };
});

app.get('/api/v1/dashboard', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  appendAudit(request, 'dashboard.read', user.user, 'dashboard', 'global', 'success');
  return {
    user,
    engagements: getEngagements(),
    activity: getActivity(),
    team: getTeam(),
  };
});

app.get('/api/v1/engagements', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  return { engagements: getEngagements() };
});

app.get('/api/v1/engagements/:id/workspace', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  const { id } = request.params as { id: string };
  const workspace = getWorkspace(id);
  if (!workspace) return reply.code(404).send(problem(404, 'Engagement not found', `No engagement found for ${id}.`));
  appendAudit(request, 'engagement.workspace.read', user.user, 'engagement', id, 'success');
  return workspace;
});

app.post('/api/v1/engagements/:id/findings', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  const { id } = request.params as { id: string };
  const body = request.body as Partial<CreateFindingInput>;
  if (!body.title || !body.severity || typeof body.cvss !== 'number' || !body.owner) {
    return reply.code(400).send(problem(400, 'Invalid finding', 'title, severity, cvss, and owner are required.'));
  }

  const finding = createFinding(id, {
    title: body.title,
    severity: body.severity,
    cvss: body.cvss,
    target: body.target ?? 'unknown',
    owner: body.owner,
    tags: body.tags ?? [],
    description: body.description,
  });
  appendAudit(request, 'finding.create', user.user, 'finding', finding.id, 'success', { engagementId: id });
  return reply.code(201).send({ finding });
});

app.post('/api/v1/engagements/:id/tasks', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  const { id } = request.params as { id: string };
  const body = request.body as Partial<CreateTaskInput>;
  if (!body.title || !body.owner || !body.priority) {
    return reply.code(400).send(problem(400, 'Invalid task', 'title, owner, and priority are required.'));
  }

  const task = createTask(id, {
    title: body.title,
    owner: body.owner,
    priority: body.priority,
    findingId: body.findingId ?? null,
    col: body.col,
  });
  appendAudit(request, 'task.create', user.user, 'task', task.id, 'success', { engagementId: id });
  return reply.code(201).send({ task });
});

app.patch('/api/v1/tasks/:id', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  const { id } = request.params as { id: string };
  const body = request.body as { col?: TaskColumn };
  if (!body.col) return reply.code(400).send(problem(400, 'Invalid task update', 'col is required.'));
  const task = moveTask(id, body.col);
  if (!task) return reply.code(404).send(problem(404, 'Task not found', `No task found for ${id}.`));
  appendAudit(request, 'task.move', user.user, 'task', task.id, 'success', { col: task.col });
  return { task };
});

app.get('/api/v1/team', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  return { team: getTeam() };
});

app.get('/api/v1/audit-logs', async (request, reply) => {
  const user = requireAuth(request, reply);
  if (!user) return undefined;
  appendAudit(request, 'audit.read', user.user, 'audit-log', 'global', 'success');
  return { auditLogs };
});

try {
  await app.listen({ host, port });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
