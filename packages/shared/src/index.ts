export type EngagementStatus = 'DRAFT' | 'SCOPING' | 'ACTIVE' | 'REPORTING' | 'REVIEW' | 'DELIVERED' | 'ARCHIVED';
export type EngagementType = 'WEB_APP' | 'NETWORK' | 'RED_TEAM' | 'CLOUD' | 'MOBILE' | 'SOCIAL_ENGINEERING' | 'CUSTOM';
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type FindingStatus = 'DRAFT' | 'IN_REVIEW' | 'CONFIRMED' | 'DISPUTED' | 'FALSE_POSITIVE' | 'RISK_ACCEPTED';
export type TargetStatus = 'IN_SCOPE' | 'OUT_OF_SCOPE' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskColumn = 'BACKLOG' | 'TODO' | 'IN_SCOPE' | 'IN_PROGRESS' | 'BLOCKED' | 'REVIEW' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'HIGH' | 'MED' | 'LOW';
export type ReportStatus = 'DRAFT' | 'IN_REVIEW' | 'SIGNED' | 'DELIVERED';
export type UserRole = 'PLATFORM_ADMIN' | 'ENGAGEMENT_LEAD' | 'SENIOR_TESTER' | 'TESTER' | 'REPORT_WRITER' | 'CLIENT_VIEWER' | 'AUDITOR';
export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface User {
  id: string;
  user: string;
  email: string;
  name: string;
  role: UserRole;
  engagements: number;
  status: PresenceStatus;
  last: string;
}

export interface Engagement {
  id: string;
  client: string;
  type: EngagementType;
  status: EngagementStatus;
  risk: RiskLevel;
  start: string;
  end: string;
  findings: number;
  criticals: number;
  team: number;
  scope: string;
}

export interface Finding {
  id: string;
  engId: string;
  title: string;
  severity: FindingSeverity;
  cvss: number;
  status: FindingStatus;
  owner: string;
  target: string;
  tags: string[];
  updated: string;
  description?: string;
}

export interface Target {
  id: string;
  engId: string;
  host: string;
  ip: string;
  tech: string;
  status: TargetStatus;
  notes: string;
}

export interface TaskItem {
  id: string;
  engId: string;
  title: string;
  col: TaskColumn;
  owner: string;
  findingId: string | null;
  priority: TaskPriority;
}

export interface Report {
  id: string;
  engId: string;
  name: string;
  status: ReportStatus;
  author: string;
  updated: string;
  findings: number;
}

export interface ActivityItem {
  who: string;
  what: string;
  target: string;
  when: string;
  kind: 'finding' | 'system' | 'report' | 'task' | 'auth' | 'engagement';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: string;
  actor: string;
  actorIp: string;
  resourceType: string;
  resourceId: string;
  outcome: 'success' | 'failure';
  metadata: Record<string, unknown>;
  chainHash: string;
}

export interface AuthenticatedUser {
  id: string;
  user: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginResponse {
  requiresMfa: boolean;
  challengeId: string;
}

export interface SessionResponse {
  user: AuthenticatedUser;
}

export interface DashboardPayload {
  user: AuthenticatedUser;
  engagements: Engagement[];
  activity: ActivityItem[];
  team: User[];
}

export interface EngagementWorkspacePayload {
  engagement: Engagement;
  findings: Finding[];
  targets: Target[];
  tasks: TaskItem[];
  reports: Report[];
  activity: ActivityItem[];
}

export interface CreateFindingInput {
  title: string;
  severity: FindingSeverity;
  cvss: number;
  target: string;
  owner: string;
  tags: string[];
  description?: string;
}

export interface CreateTaskInput {
  title: string;
  owner: string;
  findingId?: string | null;
  priority: TaskPriority;
  col?: TaskColumn;
}
