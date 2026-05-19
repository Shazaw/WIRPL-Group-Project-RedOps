import type {
  ActivityItem,
  CreateFindingInput,
  CreateTaskInput,
  Engagement,
  EngagementWorkspacePayload,
  Finding,
  Report,
  Target,
  TaskColumn,
  TaskItem,
  User,
} from '@redops/shared';

const engagements: Engagement[] = [
  { id: 'ENG-2026-014', client: 'Northwind Financial', type: 'WEB_APP', status: 'ACTIVE', risk: 'HIGH', start: '2026-05-04', end: '2026-06-12', findings: 12, criticals: 2, team: 5, scope: '*.northwind-fin.com, 10.40.0.0/16' },
  { id: 'ENG-2026-013', client: 'Helios Energy', type: 'RED_TEAM', status: 'ACTIVE', risk: 'CRITICAL', start: '2026-05-01', end: '2026-07-30', findings: 7, criticals: 3, team: 8, scope: 'corp.helios.io, OT segment 172.16.0.0/12' },
  { id: 'ENG-2026-012', client: 'Acme Robotics', type: 'NETWORK', status: 'REPORTING', risk: 'MEDIUM', start: '2026-04-12', end: '2026-05-18', findings: 19, criticals: 0, team: 4, scope: '203.0.113.0/24, dmz.acme.local' },
  { id: 'ENG-2026-011', client: 'Lumen Health', type: 'CLOUD', status: 'ARCHIVED', risk: 'LOW', start: '2026-03-01', end: '2026-04-04', findings: 8, criticals: 0, team: 3, scope: 'AWS account 9981-2204, prod-VPCs' },
];

const findings: Finding[] = [
  { id: 'F-014-001', engId: 'ENG-2026-014', title: 'SQL injection in /api/v2/login -> email param', severity: 'CRITICAL', cvss: 9.8, status: 'CONFIRMED', owner: 'k.alvarez', target: 'auth.northwind-fin.com', tags: ['CWE-89', 'SQLi', 'PreAuth'], updated: '14m ago' },
  { id: 'F-014-002', engId: 'ENG-2026-014', title: 'Stored XSS in customer support thread renderer', severity: 'HIGH', cvss: 8.2, status: 'IN_REVIEW', owner: 'j.park', target: 'support.northwind-fin.com', tags: ['CWE-79', 'XSS'], updated: '1h ago' },
  { id: 'F-014-003', engId: 'ENG-2026-014', title: 'SSRF via image proxy -> AWS metadata endpoint', severity: 'CRITICAL', cvss: 9.4, status: 'IN_REVIEW', owner: 'k.alvarez', target: 'media.northwind-fin.com', tags: ['SSRF', 'CloudMeta'], updated: '2h ago' },
  { id: 'F-014-004', engId: 'ENG-2026-014', title: 'Weak JWT signing key (HS256, 8 chars, dictionary)', severity: 'HIGH', cvss: 7.6, status: 'CONFIRMED', owner: 's.okonkwo', target: 'api.northwind-fin.com', tags: ['JWT', 'Crypto'], updated: '4h ago' },
  { id: 'F-014-005', engId: 'ENG-2026-014', title: 'IDOR - /api/v2/accounts/{id}/statements', severity: 'MEDIUM', cvss: 6.5, status: 'DRAFT', owner: 'm.tanaka', target: 'api.northwind-fin.com', tags: ['IDOR', 'BOLA'], updated: '6h ago' },
  { id: 'F-014-006', engId: 'ENG-2026-014', title: 'CSRF token reuse across user sessions', severity: 'MEDIUM', cvss: 5.4, status: 'DRAFT', owner: 'j.park', target: 'app.northwind-fin.com', tags: ['CSRF'], updated: '1d ago' },
  { id: 'F-014-007', engId: 'ENG-2026-014', title: 'Verbose error messages leak ORM stack traces', severity: 'LOW', cvss: 3.7, status: 'CONFIRMED', owner: 'm.tanaka', target: 'api.northwind-fin.com', tags: ['InfoLeak'], updated: '1d ago' },
  { id: 'F-014-008', engId: 'ENG-2026-014', title: 'TLS 1.0 still negotiable on legacy admin host', severity: 'MEDIUM', cvss: 5.9, status: 'CONFIRMED', owner: 's.okonkwo', target: 'admin-legacy.northwind-fin.com', tags: ['TLS', 'Crypto'], updated: '2d ago' },
  { id: 'F-014-009', engId: 'ENG-2026-014', title: 'Session cookie missing Secure + SameSite flags', severity: 'LOW', cvss: 4.2, status: 'CONFIRMED', owner: 'j.park', target: 'app.northwind-fin.com', tags: ['Cookies'], updated: '2d ago' },
  { id: 'F-014-010', engId: 'ENG-2026-014', title: 'Mass assignment on /api/v2/users/me - role field', severity: 'HIGH', cvss: 8.1, status: 'IN_REVIEW', owner: 'k.alvarez', target: 'api.northwind-fin.com', tags: ['MassAssign', 'BAC'], updated: '3d ago' },
  { id: 'F-013-001', engId: 'ENG-2026-013', title: 'Phishing pretext bypassed mail gateway DMARC alignment', severity: 'CRITICAL', cvss: 9.1, status: 'CONFIRMED', owner: 'k.alvarez', target: 'mail.helios.io', tags: ['Phishing', 'DMARC'], updated: '5h ago' },
  { id: 'F-013-002', engId: 'ENG-2026-013', title: 'Domain admin via Kerberoasting (svc_backup)', severity: 'CRITICAL', cvss: 9.6, status: 'CONFIRMED', owner: 's.okonkwo', target: 'DC01.corp.helios.io', tags: ['AD', 'Kerberos'], updated: '3h ago' },
];

const targets: Target[] = [
  { id: 'T-001', engId: 'ENG-2026-014', host: 'auth.northwind-fin.com', ip: '54.218.x.x', tech: 'nginx/1.24, Node 20', status: 'IN_SCOPE', notes: 'Auth + MFA endpoints' },
  { id: 'T-002', engId: 'ENG-2026-014', host: 'app.northwind-fin.com', ip: '54.218.x.x', tech: 'nginx, React SPA', status: 'IN_SCOPE', notes: 'Customer portal SPA' },
  { id: 'T-003', engId: 'ENG-2026-014', host: 'api.northwind-fin.com', ip: '10.40.12.4', tech: 'Express, PG 15', status: 'IN_SCOPE', notes: 'REST API surface' },
  { id: 'T-004', engId: 'ENG-2026-014', host: 'support.northwind-fin.com', ip: '10.40.12.9', tech: 'Zendesk fork', status: 'IN_SCOPE', notes: 'Support portal' },
  { id: 'T-005', engId: 'ENG-2026-014', host: 'admin-legacy.northwind-fin.com', ip: '10.40.20.4', tech: 'IIS 8.5, .NET 4.6', status: 'IN_SCOPE', notes: 'Internal admin (legacy)' },
  { id: 'T-006', engId: 'ENG-2026-014', host: 'cdn.northwind-fin.com', ip: 'CloudFront', tech: 'CloudFront', status: 'OUT_OF_SCOPE', notes: 'Third-party CDN - excluded per RoE' },
];

const tasks: TaskItem[] = [
  { id: 'TK-001', engId: 'ENG-2026-014', title: 'Re-confirm SQLi blast radius on /api/v2/login', col: 'TODO', owner: 'k.alvarez', findingId: 'F-014-001', priority: 'HIGH' },
  { id: 'TK-002', engId: 'ENG-2026-014', title: 'Pivot from SSRF -> enumerate IAM role permissions', col: 'TODO', owner: 'k.alvarez', findingId: 'F-014-003', priority: 'HIGH' },
  { id: 'TK-003', engId: 'ENG-2026-014', title: 'Burp Pro scan over support.* subdomain', col: 'IN_PROGRESS', owner: 'j.park', findingId: null, priority: 'MED' },
  { id: 'TK-004', engId: 'ENG-2026-014', title: 'Build exploit chain doc: SQLi -> JWT forge -> admin', col: 'IN_PROGRESS', owner: 's.okonkwo', findingId: 'F-014-004', priority: 'HIGH' },
  { id: 'TK-005', engId: 'ENG-2026-014', title: 'Peer-review F-014-002 (Stored XSS)', col: 'REVIEW', owner: 'm.tanaka', findingId: 'F-014-002', priority: 'MED' },
  { id: 'TK-006', engId: 'ENG-2026-014', title: 'Confirm cookie flag findings on every subdomain', col: 'REVIEW', owner: 'j.park', findingId: 'F-014-009', priority: 'LOW' },
  { id: 'TK-007', engId: 'ENG-2026-014', title: 'Initial recon: subdomain + ASN sweep', col: 'DONE', owner: 's.okonkwo', findingId: null, priority: 'MED' },
  { id: 'TK-008', engId: 'ENG-2026-014', title: 'Authenticated crawl with test accounts x 3', col: 'DONE', owner: 'm.tanaka', findingId: null, priority: 'MED' },
];

const team: User[] = [
  { id: 'usr-rchen', user: 'r.chen', email: 'r.chen@redops.io', name: 'Rachel Chen', role: 'ENGAGEMENT_LEAD', engagements: 3, status: 'online', last: 'now' },
  { id: 'usr-kalvarez', user: 'k.alvarez', email: 'k.alvarez@redops.io', name: 'Karim Alvarez', role: 'SENIOR_TESTER', engagements: 2, status: 'online', last: '4m' },
  { id: 'usr-sokonkwo', user: 's.okonkwo', email: 's.okonkwo@redops.io', name: 'Sade Okonkwo', role: 'SENIOR_TESTER', engagements: 2, status: 'online', last: '12m' },
  { id: 'usr-jpark', user: 'j.park', email: 'j.park@redops.io', name: 'Jiwoo Park', role: 'TESTER', engagements: 1, status: 'online', last: '1m' },
  { id: 'usr-mtanaka', user: 'm.tanaka', email: 'm.tanaka@redops.io', name: 'Miyu Tanaka', role: 'TESTER', engagements: 1, status: 'idle', last: '47m' },
  { id: 'usr-alindqvist', user: 'a.lindqvist', email: 'a.lindqvist@redops.io', name: 'Annika Lindqvist', role: 'REPORT_WRITER', engagements: 4, status: 'offline', last: '3h' },
  { id: 'usr-pgupta', user: 'p.gupta', email: 'p.gupta@redops.io', name: 'Priya Gupta', role: 'PLATFORM_ADMIN', engagements: 0, status: 'online', last: '20m' },
  { id: 'usr-client-northwind', user: 'client.northwind', email: 'client.northwind@northwind-fin.com', name: 'C. Bishop (Northwind)', role: 'CLIENT_VIEWER', engagements: 1, status: 'offline', last: '2d' },
];

const reports: Report[] = [
  { id: 'R-014-DRAFT-3', engId: 'ENG-2026-014', name: 'Northwind - Internal Tech Report v0.3', status: 'DRAFT', author: 'a.lindqvist', updated: '32m ago', findings: 8 },
  { id: 'R-014-DRAFT-2', engId: 'ENG-2026-014', name: 'Northwind - Executive Summary v0.2', status: 'IN_REVIEW', author: 'a.lindqvist', updated: '3h ago', findings: 6 },
  { id: 'R-013-FINAL-1', engId: 'ENG-2026-013', name: 'Helios - Red Team Final Report v1.0', status: 'SIGNED', author: 'a.lindqvist', updated: 'Yesterday', findings: 7 },
  { id: 'R-012-FINAL-1', engId: 'ENG-2026-012', name: 'Acme Robotics - Internal Network v1.0', status: 'DELIVERED', author: 'a.lindqvist', updated: '2d ago', findings: 19 },
];

const activity: ActivityItem[] = [
  { who: 'k.alvarez', what: 'confirmed finding', target: 'F-014-001', when: '14m ago', kind: 'finding' },
  { who: 'system', what: 'engagement risk score updated', target: 'CRITICAL', when: '15m ago', kind: 'system' },
  { who: 'j.park', what: 'submitted for review', target: 'F-014-002', when: '1h ago', kind: 'finding' },
  { who: 'a.lindqvist', what: 'edited section in', target: 'R-014-DRAFT-3', when: '32m ago', kind: 'report' },
  { who: 's.okonkwo', what: 'created task', target: 'TK-004', when: '2h ago', kind: 'task' },
  { who: 'r.chen', what: 'approved peer-review on', target: 'F-014-004', when: '4h ago', kind: 'finding' },
  { who: 'system', what: 'CVE references suggested for', target: 'F-014-003', when: '5h ago', kind: 'system' },
];

const clone = <T>(value: T): T => structuredClone(value);

export const getDemoUser = () => {
  const user = team[0];
  if (!user) throw new Error('Seed user missing');
  return {
    id: user.id,
    user: user.user,
    email: user.email,
    name: user.name,
    role: user.role,
  };
};

export const getTeam = () => clone(team);
export const getActivity = () => clone(activity);

export const getEngagements = (): Engagement[] => engagements.map((engagement) => {
  const engFindings = findings.filter((finding) => finding.engId === engagement.id);
  return {
    ...engagement,
    findings: engFindings.length || engagement.findings,
    criticals: engFindings.filter((finding) => finding.severity === 'CRITICAL').length || engagement.criticals,
  };
});

export const getWorkspace = (engagementId: string): EngagementWorkspacePayload | undefined => {
  const engagement = getEngagements().find((item) => item.id === engagementId);
  if (!engagement) return undefined;

  return {
    engagement,
    findings: clone(findings.filter((finding) => finding.engId === engagementId)),
    targets: clone(targets.filter((target) => target.engId === engagementId)),
    tasks: clone(tasks.filter((task) => task.engId === engagementId)),
    reports: clone(reports.filter((report) => report.engId === engagementId)),
    activity: getActivity(),
  };
};

export const createFinding = (engagementId: string, input: CreateFindingInput): Finding => {
  const count = findings.filter((finding) => finding.engId === engagementId).length + 1;
  const id = `F-${engagementId.slice(-3)}-${String(count).padStart(3, '0')}`;
  const finding: Finding = {
    id,
    engId: engagementId,
    title: input.title || 'Untitled finding',
    severity: input.severity,
    cvss: input.cvss,
    status: 'DRAFT',
    owner: input.owner,
    target: input.target || 'unknown',
    tags: input.tags,
    updated: 'just now',
    description: input.description,
  };
  findings.unshift(finding);
  activity.unshift({ who: input.owner, what: 'created finding', target: id, when: 'just now', kind: 'finding' });
  return clone(finding);
};

export const createTask = (engagementId: string, input: CreateTaskInput): TaskItem => {
  const id = `TK-${String(tasks.length + 1).padStart(3, '0')}`;
  const task: TaskItem = {
    id,
    engId: engagementId,
    title: input.title,
    col: input.col ?? 'TODO',
    owner: input.owner,
    findingId: input.findingId ?? null,
    priority: input.priority,
  };
  tasks.unshift(task);
  activity.unshift({ who: input.owner, what: 'created task', target: id, when: 'just now', kind: 'task' });
  return clone(task);
};

export const moveTask = (taskId: string, col: TaskColumn): TaskItem | undefined => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return undefined;
  task.col = col;
  activity.unshift({ who: task.owner, what: 'moved task to ' + col, target: task.id, when: 'just now', kind: 'task' });
  return clone(task);
};
