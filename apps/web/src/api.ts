import type {
  CreateFindingInput,
  CreateTaskInput,
  DashboardPayload,
  EngagementWorkspacePayload,
  Finding,
  LoginResponse,
  SessionResponse,
  TaskColumn,
  TaskItem,
} from '@redops/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail ?? body.title ?? 'Request failed');
  }

  return response.json() as Promise<T>;
};

export const api = {
  login: (email: string, passphrase: string) => request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, passphrase }),
  }),

  mfa: (challengeId: string, code: string) => request<SessionResponse>('/api/v1/auth/mfa', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  }),

  me: () => request<SessionResponse>('/api/v1/me'),

  logout: () => request<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' }),

  dashboard: () => request<DashboardPayload>('/api/v1/dashboard'),

  workspace: (engagementId: string) => request<EngagementWorkspacePayload>(`/api/v1/engagements/${engagementId}/workspace`),

  createFinding: (engagementId: string, input: CreateFindingInput) => request<{ finding: Finding }>(`/api/v1/engagements/${engagementId}/findings`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),

  createTask: (engagementId: string, input: CreateTaskInput) => request<{ task: TaskItem }>(`/api/v1/engagements/${engagementId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  }),

  moveTask: (taskId: string, col: TaskColumn) => request<{ task: TaskItem }>(`/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ col }),
  }),
};
