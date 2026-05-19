import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type {
  ActivityItem,
  AuthenticatedUser,
  CreateFindingInput,
  DashboardPayload,
  Engagement,
  EngagementWorkspacePayload,
  Finding,
  FindingSeverity,
  Report,
  Target,
  TaskColumn,
  TaskItem,
  TaskPriority,
  User,
} from '@redops/shared';
import { api } from './api';

type Page = 'dashboard' | 'engagement' | 'targets' | 'findings' | 'finding-detail' | 'finding-new' | 'tasks' | 'reports' | 'team' | 'settings';
type QuickAction = 'CREATE FINDING' | 'ADD TARGET' | 'INVITE OPERATOR' | 'START REPORT' | 'IMPORT NMAP / BURP';

const iconLabel: Record<string, string> = {
  dashboard: 'D',
  activity: 'A',
  target: 'T',
  bug: 'B',
  flag: 'K',
  file: 'R',
  users: 'U',
  settings: 'S',
  logout: 'X',
  plus: '+',
  terminal: '>',
  server: '#',
  bell: '!',
};

const Icon = ({ name }: { name: string }) => (
  <span className="mono inline-flex items-center justify-center" style={{ width: 16, height: 16, fontSize: 10, color: 'var(--red)' }}>
    {iconLabel[name] ?? '*'}
  </span>
);

const sevColor = (value: string) => ({ CRITICAL: 'pill-red', HIGH: 'pill-red', MEDIUM: 'pill-amber', LOW: 'pill-cyan', INFORMATIONAL: 'pill-gray' }[value] ?? 'pill-gray');
const statusColor = (value: string) => ({ ACTIVE: 'pill-green', REPORTING: 'pill-amber', ARCHIVED: 'pill-gray', DRAFT: 'pill-gray', IN_REVIEW: 'pill-amber', CONFIRMED: 'pill-green', SIGNED: 'pill-green', DELIVERED: 'pill-green' }[value] ?? 'pill-gray');

const SectionTitle = ({ eyebrow, title, red }: { eyebrow: string; title: string; red?: string }) => (
  <>
    <div className="heading-eyebrow">/ {eyebrow}</div>
    <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, marginTop: 8 }}>
      {title} {red && <span style={{ color: 'var(--red)' }}>{red}</span>}
    </h1>
  </>
);

const Stat = ({ label, value, danger, color }: { label: string; value: string | number; danger?: boolean; color?: string }) => (
  <div className="stat-card" style={{ borderColor: danger ? 'var(--red-dim)' : undefined }}>
    <div className="mono" style={{ fontSize: 10, color: danger ? 'var(--red)' : 'var(--text-muted)', letterSpacing: 2 }}>{label}</div>
    <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4, color: danger ? 'var(--red)' : color }}>{value}</div>
  </div>
);

const SidebarItem = ({ icon, label, page, current, setPage }: { icon: string; label: string; page: Page; current: Page; setPage: (page: Page) => void }) => (
  <button className={`nav-item w-full ${current === page ? 'active' : ''}`} onClick={() => setPage(page)}>
    <Icon name={icon} />
    <span>{label}</span>
  </button>
);

const Sidebar = ({ page, setPage, activeEng, clearEngagement, logout, user }: {
  page: Page;
  setPage: (page: Page) => void;
  activeEng: Engagement | null;
  clearEngagement: () => void;
  logout: () => void;
  user: AuthenticatedUser;
}) => (
  <aside className="sidebar-shell h-screen sticky top-0 flex flex-col overflow-y-auto">
    <div style={{ padding: '24px 22px 18px', borderBottom: '1px solid var(--border)' }}>
      <div className="mono" style={{ fontSize: 10, color: 'var(--red)', letterSpacing: 3 }}>// REDOPS_</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>RedOps Collab</div>
      <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>v0.1.0 MVP</div>
    </div>

    {activeEng && (
      <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--border)' }}>
        <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>ACTIVE ENGAGEMENT</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>{activeEng.client}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{activeEng.id} / {activeEng.type}</div>
        <button onClick={clearEngagement} className="mono mt-2" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>
          {'<-'} SWITCH ENGAGEMENT
        </button>
      </div>
    )}

    <nav className="flex-1" style={{ padding: '14px 0' }}>
      <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-muted)', padding: '8px 22px 6px' }}>WORKSPACE</div>
      <SidebarItem icon="dashboard" label="Dashboard" page="dashboard" current={page} setPage={setPage} />
      {activeEng && <>
        <SidebarItem icon="activity" label="Engagement Overview" page="engagement" current={page} setPage={setPage} />
        <SidebarItem icon="target" label="Targets / Recon" page="targets" current={page} setPage={setPage} />
        <SidebarItem icon="bug" label="Findings" page="findings" current={page} setPage={setPage} />
        <SidebarItem icon="flag" label="Tasks (Kanban)" page="tasks" current={page} setPage={setPage} />
        <SidebarItem icon="file" label="Reports" page="reports" current={page} setPage={setPage} />
      </>}
      <div className="mono" style={{ fontSize: 9, letterSpacing: 3, color: 'var(--text-muted)', padding: '16px 22px 6px' }}>ORG</div>
      <SidebarItem icon="users" label="Team" page="team" current={page} setPage={setPage} />
      <SidebarItem icon="settings" label="Settings" page="settings" current={page} setPage={setPage} />
    </nav>

    <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>{user.user} / {user.role}</span>
      </div>
      <button onClick={logout} className="flex items-center gap-2 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>
        <Icon name="logout" /> SIGN OUT
      </button>
    </div>
  </aside>
);

const TopBar = ({ title, breadcrumb }: { title: string; breadcrumb: string }) => (
  <header className="topbar-shell sticky top-0 z-50 flex items-center justify-between">
    <div className="flex items-center gap-4 min-w-0">
      <div className="mono truncate" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>{breadcrumb}</div>
      <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
      <div className="truncate" style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
    </div>
    <div className="hidden md:flex items-center gap-3">
      <span className="mono flex items-center gap-2" style={{ fontSize: 10, color: 'var(--text-muted)' }}><Icon name="server" /> edge-01.redops.local</span>
      <span className="pill pill-green glow-pulse">LIVE</span>
      <button className="btn-ghost" style={{ padding: '6px 10px' }}><Icon name="bell" /></button>
    </div>
  </header>
);

const Login = ({ onAuthenticated }: { onAuthenticated: (payload: DashboardPayload) => void }) => {
  const [email, setEmail] = useState('r.chen@redops.io');
  const [passphrase, setPassphrase] = useState('redops-demo-passphrase');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (step === 1) {
        const response = await api.login(email, passphrase);
        setChallengeId(response.challengeId);
        setStep(2);
      } else {
        await api.mfa(challengeId, otp || '000000');
        onAuthenticated(await api.dashboard());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 24, left: 36 }}><div className="heading-eyebrow">SECURE TERMINAL</div></div>
      <div style={{ width: 440, maxWidth: 'calc(100vw - 32px)' }} className="card p-8">
        <div className="mono" style={{ fontSize: 10, color: 'var(--red)', letterSpacing: 3 }}>// REDOPS_</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.05, marginTop: 6 }}>Sign in to <span style={{ color: 'var(--red)' }}>RedOps Collab</span></h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 13 }}>Authenticated, audited, compartmentalized. Demo auth accepts any MFA code while the backend records audit events.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {step === 1 && <>
            <div><label className="field-label">Operator email</label><input className="field-input" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div><label className="field-label">Passphrase</label><input type="password" className="field-input" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} /></div>
            <button disabled={busy} className="btn-red mt-2 flex items-center justify-center gap-2">CONTINUE <Icon name="plus" /></button>
          </>}
          {step === 2 && <>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>2-factor required for ENGAGEMENT_LEAD role.</div>
            <div><label className="field-label">TOTP code (demo accepts any value)</label><input maxLength={6} placeholder="000000" autoFocus value={otp} onChange={(event) => setOtp(event.target.value)} className="field-input mono" style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', padding: 14 }} /></div>
            <button disabled={busy} className="btn-red mt-2 flex items-center justify-center gap-2">AUTHENTICATE <Icon name="plus" /></button>
            <button type="button" onClick={() => setStep(1)} className="btn-ghost">{'<-'} BACK</button>
          </>}
        </form>
        {error && <div className="pill pill-red mt-4">{error}</div>}
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2 }}>SESSION META</div>
          <div className="mono mt-1" style={{ fontSize: 10, color: 'var(--text-dim)' }}>ip 10.20.4.118 / ua firefox linux / risk_score 0.12</div>
        </div>
      </div>
    </div>
  );
};

const ActivityPanel = ({ activity, className = '' }: { activity: ActivityItem[]; className?: string }) => (
  <div className={`card p-5 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// RECENT ACTIVITY</div>
      <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>last 24h</span>
    </div>
    {activity.map((item, index) => (
      <div key={`${item.who}-${item.target}-${index}`} className="flex items-start gap-3 py-2" style={{ borderTop: index === 0 ? 'none' : '1px dashed var(--border)' }}>
        <span className="mono pill-gray pill" style={{ minWidth: 60, textAlign: 'center' }}>{item.who}</span>
        <div className="flex-1">
          <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-dim)' }}>{item.what} </span><span className="mono" style={{ color: 'var(--red)' }}>{item.target}</span></div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.when}</div>
        </div>
      </div>
    ))}
  </div>
);

const quickActions: QuickAction[] = ['CREATE FINDING', 'ADD TARGET', 'INVITE OPERATOR', 'START REPORT', 'IMPORT NMAP / BURP'];

const Dashboard = ({ engagements, activity, pickEngagement, onQuickAction, notify }: { engagements: Engagement[]; activity: ActivityItem[]; pickEngagement: (engagement: Engagement) => void; onQuickAction: (action: QuickAction) => void; notify: (message: string) => void }) => {
  const active = engagements.filter((engagement) => engagement.status === 'ACTIVE');
  const criticals = engagements.reduce((sum, engagement) => sum + engagement.criticals, 0);
  const findings = engagements.reduce((sum, engagement) => sum + engagement.findings, 0);

  return (
    <div className="page-pad" style={{ maxWidth: 1280 }}>
      <div className="heading-eyebrow mb-3">/ COMMAND CENTER</div>
      <div className="flex items-end justify-between mobile-stack gap-4">
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.05 }}>Operations <span style={{ color: 'var(--red)' }}>Dashboard</span></h1>
        <button onClick={() => notify('Engagement creation is next in the MVP backlog.')} className="btn-red flex items-center gap-2"><Icon name="plus" /> NEW ENGAGEMENT</button>
      </div>
      <p style={{ color: 'var(--text-dim)', marginTop: 10, maxWidth: 680 }}>Welcome back. You have <span style={{ color: 'var(--red)' }}>{criticals} critical findings</span> pending sign-off across {active.length} active engagements.</p>

      <div className="grid grid-cols-4 responsive-grid-4 gap-3 mt-8">
        <Stat label="ACTIVE ENGAGEMENTS" value={active.length} />
        <Stat label="CRITICAL FINDINGS" value={criticals} danger />
        <Stat label="TOTAL FINDINGS" value={findings} />
        <Stat label="OPERATORS ONLINE" value={12} color="var(--green)" />
      </div>

      <div className="mt-10 flex items-center justify-between mobile-stack gap-3">
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Engagements</h2>
        <div className="flex items-center gap-2 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>
          <span className="pill pill-green">ACTIVE {active.length}</span>
          <span className="pill pill-amber">REPORTING {engagements.filter((item) => item.status === 'REPORTING').length}</span>
          <span className="pill pill-gray">ARCHIVED {engagements.filter((item) => item.status === 'ARCHIVED').length}</span>
        </div>
      </div>

      <div className="card mt-3 desktop-table">
        <div className="grid grid-cols-12 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
          <div className="col-span-3">ENGAGEMENT</div><div className="col-span-2">TYPE</div><div className="col-span-2">STATUS</div><div className="col-span-1">RISK</div><div className="col-span-2">DATES</div><div className="col-span-1 text-right">FINDINGS</div><div className="col-span-1 text-right">CRIT</div>
        </div>
        {engagements.map((engagement) => (
          <button key={engagement.id} className="table-row grid grid-cols-12 items-center w-full text-left" style={{ padding: '14px 18px' }} onClick={() => pickEngagement(engagement)}>
            <div className="col-span-3"><div style={{ fontWeight: 600 }}>{engagement.client}</div><div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{engagement.id}</div></div>
            <div className="col-span-2 mono" style={{ fontSize: 11, color: 'var(--cyan)' }}>{engagement.type}</div>
            <div className="col-span-2"><span className={`pill ${statusColor(engagement.status)}`}>{engagement.status}</span></div>
            <div className="col-span-1"><span className={`pill ${sevColor(engagement.risk)}`}>{engagement.risk}</span></div>
            <div className="col-span-2 mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{engagement.start} - {engagement.end}</div>
            <div className="col-span-1 text-right">{engagement.findings}</div>
            <div className="col-span-1 text-right" style={{ color: engagement.criticals > 0 ? 'var(--red)' : 'var(--text-dim)', fontWeight: engagement.criticals > 0 ? 700 : 400 }}>{engagement.criticals}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 responsive-grid-3 gap-3 mt-8">
        <ActivityPanel activity={activity} className="col-span-2" />
        <div className="card p-5">
          <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// QUICK ACTIONS</div>
          <div className="flex flex-col gap-2 mt-4">
            {quickActions.map((label) => (
              <button key={label} onClick={() => onQuickAction(label)} className="btn-ghost text-left flex items-center gap-2"><Icon name="plus" /> {label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EngagementOverview = ({ workspace, setPage }: { workspace: EngagementWorkspacePayload; setPage: (page: Page) => void }) => {
  const sevCount = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  workspace.findings.forEach((finding) => {
    if (finding.severity in sevCount) sevCount[finding.severity as keyof typeof sevCount] += 1;
  });
  const total = workspace.findings.length || 1;

  return (
    <div className="page-pad" style={{ maxWidth: 1280 }}>
      <SectionTitle eyebrow="ENGAGEMENT" title={workspace.engagement.client} />
      <div className="mono mt-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>{workspace.engagement.id} / {workspace.engagement.type} / {workspace.engagement.start} - {workspace.engagement.end}</div>
      <div className="flex gap-2 mt-3"><span className={`pill ${statusColor(workspace.engagement.status)}`}>{workspace.engagement.status}</span><span className={`pill ${sevColor(workspace.engagement.risk)}`}>RISK / {workspace.engagement.risk}</span></div>

      <div className="grid grid-cols-4 responsive-grid-4 gap-3 mt-7">
        <div className="stat-card"><div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 2 }}>SCOPE</div><div className="mono mt-1" style={{ fontSize: 12 }}>{workspace.engagement.scope}</div></div>
        <Stat label="TEAM" value={`${workspace.engagement.team} operators`} />
        <Stat label="FINDINGS" value={workspace.findings.length} />
        <Stat label="RISK SCORE" value="8.7 / 10" danger />
      </div>

      <div className="grid grid-cols-3 responsive-grid-3 gap-3 mt-8">
        <div className="card p-5 col-span-2">
          <div className="flex justify-between items-center mb-4"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// SEVERITY DISTRIBUTION</div><button className="mono" onClick={() => setPage('findings')} style={{ fontSize: 10, color: 'var(--red)', letterSpacing: 1.5, background: 'transparent', border: 0, cursor: 'pointer' }}>VIEW ALL -&gt;</button></div>
          <div className="severity-bar mb-3"><div style={{ width: `${sevCount.CRITICAL / total * 100}%`, background: 'var(--red)' }} /><div style={{ width: `${sevCount.HIGH / total * 100}%`, background: '#ff6b00' }} /><div style={{ width: `${sevCount.MEDIUM / total * 100}%`, background: 'var(--amber)' }} /><div style={{ width: `${sevCount.LOW / total * 100}%`, background: 'var(--cyan)' }} /></div>
          <div className="grid grid-cols-4 responsive-grid-4 gap-2 text-center">{Object.entries(sevCount).map(([key, value]) => <div key={key} className="card" style={{ padding: 10 }}><div className={`pill ${sevColor(key)}`}>{key}</div><div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{value}</div></div>)}</div>
          <div className="mt-6 mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// TIMELINE</div>
          <div className="mt-3">{workspace.activity.slice(0, 5).map((item, index) => <div key={`${item.target}-${index}`} className="flex gap-3"><div className="flex flex-col items-center"><div className="timeline-dot" />{index < 4 && <div className="timeline-line" />}</div><div style={{ paddingBottom: 14, flex: 1 }}><div style={{ fontSize: 13 }}><span>{item.who}</span> <span style={{ color: 'var(--text-dim)' }}>{item.what} </span><span className="mono" style={{ color: 'var(--red)' }}>{item.target}</span></div><div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.when}</div></div></div>)}</div>
        </div>
        <div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// OPEN TASKS</div><div className="mt-3">{workspace.tasks.filter((task) => task.col !== 'DONE').slice(0, 5).map((task) => <TaskCard key={task.id} task={task} />)}</div><button onClick={() => setPage('tasks')} className="btn-ghost w-full mt-2">VIEW KANBAN -&gt;</button></div>
      </div>
    </div>
  );
};

const TaskCard = ({ task }: { task: TaskItem }) => (
  <div className="kanban-card" style={{ borderLeftColor: task.priority === 'HIGH' || task.priority === 'P0' ? 'var(--red)' : 'var(--amber)' }}>
    <div className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{task.id} / {task.col}</div>
    <div style={{ fontSize: 13, marginTop: 4 }}>{task.title}</div>
    <div className="mono mt-2" style={{ fontSize: 10, color: 'var(--text-dim)' }}>@{task.owner}</div>
  </div>
);

const Findings = ({ findings, openFinding, startNewFinding }: { findings: Finding[]; openFinding: (id: string) => void; startNewFinding: () => void }) => {
  const [sev, setSev] = useState('ALL');
  const [q, setQ] = useState('');
  const filtered = findings.filter((finding) => (sev === 'ALL' || finding.severity === sev) && (q === '' || `${finding.title} ${finding.id} ${finding.tags.join(' ')}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="page-pad" style={{ maxWidth: 1320 }}>
      <div className="flex items-end justify-between mt-3 mobile-stack gap-3"><SectionTitle eyebrow="FINDINGS" title="Findings &" red="Vulnerabilities" /><button onClick={startNewFinding} className="btn-red flex items-center gap-2"><Icon name="plus" /> NEW FINDING</button></div>
      <div className="flex items-center gap-2 mt-6 flex-wrap"><div className="card flex items-center gap-2" style={{ padding: '8px 12px', flex: 1, maxWidth: 420 }}><input className="flex-1 bg-transparent outline-none" style={{ color: 'var(--text)', fontSize: 13 }} placeholder="search by id, title, tag" value={q} onChange={(event) => setQ(event.target.value)} /></div>{['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((item) => <button key={item} onClick={() => setSev(item)} className={`pill ${sev === item ? `${sevColor(item)} !border-2` : 'pill-gray'}`} style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 10 }}>{item}</button>)}</div>
      <div className="card mt-4 desktop-table">
        <div className="grid grid-cols-12 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}><div className="col-span-1">ID</div><div className="col-span-5">TITLE</div><div className="col-span-1">SEV</div><div className="col-span-1">CVSS</div><div className="col-span-2">STATUS</div><div className="col-span-1">OWNER</div><div className="col-span-1 text-right">UPDATED</div></div>
        {filtered.map((finding) => <button key={finding.id} className="table-row grid grid-cols-12 items-center w-full text-left" style={{ padding: '14px 18px' }} onClick={() => openFinding(finding.id)}><div className="col-span-1 mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{finding.id}</div><div className="col-span-5"><div style={{ fontSize: 14 }}>{finding.title}</div><div className="flex gap-1 mt-1 flex-wrap">{finding.tags.map((tag) => <span key={tag} className="pill pill-gray">{tag}</span>)}</div></div><div className="col-span-1"><span className={`pill ${sevColor(finding.severity)}`}>{finding.severity}</span></div><div className="col-span-1 mono" style={{ fontSize: 13, color: finding.cvss >= 9 ? 'var(--red)' : finding.cvss >= 7 ? '#ff6b00' : finding.cvss >= 4 ? 'var(--amber)' : 'var(--cyan)' }}>{finding.cvss.toFixed(1)}</div><div className="col-span-2"><span className={`pill ${statusColor(finding.status)}`}>{finding.status}</span></div><div className="col-span-1 mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>@{finding.owner}</div><div className="col-span-1 text-right mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{finding.updated}</div></button>)}
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center' }} className="mono"><span style={{ color: 'var(--text-muted)' }}>// no findings match filter</span></div>}
      </div>
    </div>
  );
};

const FindingText = ({ title, children }: { title: string; children: ReactNode }) => <div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// {title}</div><p style={{ color: 'var(--text-dim)' }}>{children}</p></div>;
const Meta = ({ label, value, danger }: { label: string; value: string; danger?: boolean }) => <div className="flex justify-between gap-3"><span style={{ color: 'var(--text-muted)' }}>{label}</span><span style={{ color: danger ? 'var(--red)' : undefined }}>{value}</span></div>;

const FindingDetail = ({ finding, back, addTask }: { finding: Finding; back: () => void; addTask: (finding: Finding) => void }) => {
  const poc = `$ curl -s https://${finding.target}/api/v2/login\n# observed behavior confirms exploitability\n# evidence files are queued for encrypted upload in the next MVP phase`;
  return (
    <div className="page-pad" style={{ maxWidth: 1280 }}>
      <button onClick={back} className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>{'<-'} BACK TO FINDINGS</button>
      <div className="flex items-start justify-between mt-3 mobile-stack gap-3"><div style={{ flex: 1 }}><div className="mono" style={{ fontSize: 11, color: 'var(--red)', letterSpacing: 2 }}>{finding.id}</div><h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -.7, marginTop: 4, lineHeight: 1.2 }}>{finding.title}</h1><div className="flex gap-2 mt-3 flex-wrap"><span className={`pill ${sevColor(finding.severity)}`}>{finding.severity}</span><span className={`pill ${statusColor(finding.status)}`}>{finding.status}</span><span className="pill pill-gray">CVSS {finding.cvss.toFixed(1)}</span>{finding.tags.map((tag) => <span key={tag} className="pill pill-cyan">{tag}</span>)}</div></div><div className="flex gap-2"><button className="btn-ghost">REQUEST REVIEW</button><button onClick={() => addTask(finding)} className="btn-red flex items-center gap-2"><Icon name="plus" /> CREATE TASK</button></div></div>
      <div className="grid grid-cols-3 responsive-grid-3 gap-3 mt-7">
        <div className="col-span-2 flex flex-col gap-3"><FindingText title="DESCRIPTION">The target parameter is handled without sufficient validation. The endpoint is reachable inside the active scope and the finding has been normalized for review in the MVP workflow.</FindingText><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// PROOF OF CONCEPT</div><pre className="mono" style={{ background: 'var(--bg)', padding: 14, borderRadius: 3, fontSize: 12, color: 'var(--green)', overflowX: 'auto', border: '1px solid var(--border)' }}>{poc}</pre></div><FindingText title="REMEDIATION">Apply input validation, parameterized queries where applicable, hardened session handling, and targeted regression tests before retest.</FindingText><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// COMMENTS</div><div className="flex gap-3 mb-3"><span className="pill pill-gray">r.chen</span><div>Confirmed this is in scope.</div></div><div className="flex gap-3"><span className="pill pill-gray">s.okonkwo</span><div>Link this to exploit-chain notes later.</div></div></div></div>
        <div className="flex flex-col gap-3"><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// METADATA</div><div className="flex flex-col gap-2 mono" style={{ fontSize: 12 }}><Meta label="OWNER" value={`@${finding.owner}`} /><Meta label="TARGET" value={finding.target} danger /><Meta label="CVSS" value={`${finding.cvss.toFixed(1)} / 10`} /><Meta label="UPDATED" value={finding.updated} /></div></div><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// EVIDENCE (3)</div>{['screenshot_login_delay.png', 'sqlmap_dump_2026-05-19.txt', 'request_burp.har'].map((file) => <div key={file} className="flex items-center justify-between mono py-1" style={{ fontSize: 11, borderBottom: '1px dashed var(--border)' }}><span style={{ color: 'var(--text-dim)' }}>{file}</span></div>)}</div><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// LINKED CVE / ATT&amp;CK</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>CWE mapping pending<br />ATT&amp;CK T1190 - Exploit Public-Facing App<br />OWASP A03:2021 - Injection</div></div></div>
      </div>
    </div>
  );
};

const NewFinding = ({ save, cancel }: { save: (input: CreateFindingInput) => Promise<void>; cancel: () => void }) => {
  const [form, setForm] = useState({ title: '', severity: 'MEDIUM' as FindingSeverity, cvss: '5.0', target: '', owner: 'r.chen', tags: '', description: '' });
  const [busy, setBusy] = useState(false);
  const change = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const submit = async () => {
    setBusy(true);
    await save({ title: form.title, severity: form.severity, cvss: Number.parseFloat(form.cvss) || 5, target: form.target, owner: form.owner, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), description: form.description });
    setBusy(false);
  };

  return (
    <div className="page-pad" style={{ maxWidth: 980 }}>
      <button onClick={cancel} className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>{'<-'} BACK TO FINDINGS</button>
      <SectionTitle eyebrow="NEW FINDING" title="Submit a" red="vulnerability" />
      <p style={{ color: 'var(--text-dim)', marginTop: 6 }}>Status defaults to DRAFT. A Senior Tester must approve before report inclusion.</p>
      <div className="card p-6 mt-6">
        <div className="grid grid-cols-2 responsive-grid-2 gap-4">
          <div className="col-span-2"><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={(event) => change('title', event.target.value)} placeholder="e.g. Stored XSS in support messages" /></div>
          <div><label className="field-label">Severity</label><select className="field-select" value={form.severity} onChange={(event) => change('severity', event.target.value)}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></div>
          <div><label className="field-label">CVSS 3.1 score</label><input className="field-input mono" value={form.cvss} onChange={(event) => change('cvss', event.target.value)} /></div>
          <div><label className="field-label">Target host</label><input className="field-input mono" value={form.target} onChange={(event) => change('target', event.target.value)} placeholder="api.northwind-fin.com" /></div>
          <div><label className="field-label">Owner</label><select className="field-select" value={form.owner} onChange={(event) => change('owner', event.target.value)}><option>r.chen</option><option>k.alvarez</option><option>s.okonkwo</option><option>j.park</option><option>m.tanaka</option></select></div>
          <div className="col-span-2"><label className="field-label">Tags (comma separated)</label><input className="field-input mono" value={form.tags} onChange={(event) => change('tags', event.target.value)} placeholder="XSS, CWE-79" /></div>
          <div className="col-span-2"><label className="field-label">Description / PoC</label><textarea className="field-textarea" value={form.description} onChange={(event) => change('description', event.target.value)} placeholder="Reproduction steps, payload, observed impact" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}><button className="btn-ghost" onClick={cancel}>CANCEL</button><button disabled={busy} className="btn-red" onClick={() => void submit()}>SAVE AS DRAFT</button></div>
      </div>
    </div>
  );
};

const Targets = ({ targets }: { targets: Target[] }) => {
  const scopeDocument = `IN SCOPE\n  *.northwind-fin.com\n  10.40.0.0/16\n  api endpoints v2 and v3\n\nOUT OF SCOPE\n  CloudFront / third-party CDN\n  Production payment gateway\n  Any DoS / volumetric tests`;
  const terminalLog = `[+] 10.40.12.4    22/tcp  open  ssh\n[+] 10.40.12.4    443/tcp open  https\n[+] 10.40.12.9    443/tcp open  https\n[!] 10.40.20.4    443: TLS 1.0 negotiable\n[+] enumeration complete / 14 hosts / 38 ports`;
  return (
    <div className="page-pad" style={{ maxWidth: 1280 }}>
      <div className="flex items-end justify-between mt-3 mobile-stack gap-3"><SectionTitle eyebrow="RECON" title="Targets &" red="Attack Surface" /><div className="flex gap-2"><button className="btn-ghost flex items-center gap-2"><Icon name="terminal" /> IMPORT NMAP</button><button className="btn-red flex items-center gap-2"><Icon name="plus" /> ADD TARGET</button></div></div>
      <div className="card mt-6 desktop-table"><div className="grid grid-cols-12 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}><div className="col-span-1">ID</div><div className="col-span-3">HOST</div><div className="col-span-2">IP</div><div className="col-span-3">TECH STACK</div><div className="col-span-1">STATUS</div><div className="col-span-2">NOTES</div></div>{targets.map((target) => <div key={target.id} className="table-row grid grid-cols-12 items-center" style={{ padding: '14px 18px' }}><div className="col-span-1 mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{target.id}</div><div className="col-span-3 mono" style={{ fontSize: 13, color: 'var(--red)' }}>{target.host}</div><div className="col-span-2 mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{target.ip}</div><div className="col-span-3 mono" style={{ fontSize: 11, color: 'var(--cyan)' }}>{target.tech}</div><div className="col-span-1"><span className={`pill ${target.status === 'IN_SCOPE' ? 'pill-green' : 'pill-gray'}`}>{target.status.replace('_', ' ')}</span></div><div className="col-span-2" style={{ fontSize: 12, color: 'var(--text-dim)' }}>{target.notes}</div></div>)}</div>
      <div className="grid grid-cols-2 responsive-grid-2 gap-3 mt-6"><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 8 }}>// SCOPE DOCUMENT</div><pre className="mono" style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{scopeDocument}</pre></div><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 8 }}>// LIVE TERMINAL - port_sweep.log</div><pre className="mono" style={{ fontSize: 11, color: 'var(--green)', overflowX: 'auto' }}>{terminalLog}</pre></div></div>
    </div>
  );
};

const Tasks = ({ tasks, moveTask }: { tasks: TaskItem[]; moveTask: (id: string, col: TaskColumn) => Promise<void> }) => {
  const cols: TaskColumn[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
  return (
    <div className="page-pad">
      <div className="flex items-end justify-between mt-3 mobile-stack gap-3"><SectionTitle eyebrow="COORDINATION" title="Tasks" red="Board" /><button className="btn-red flex items-center gap-2"><Icon name="plus" /> NEW TASK</button></div>
      <div className="grid grid-cols-4 responsive-grid-4 gap-3 mt-7">
        {cols.map((col) => <div key={col} className="card" style={{ padding: 14, minHeight: 480 }}><div className="flex items-center justify-between mb-3"><div className="mono" style={{ fontSize: 11, letterSpacing: 2, color: col === 'DONE' ? 'var(--green)' : 'var(--cyan)' }}>// {col.replace('_', ' ')}</div><span className="pill pill-gray">{tasks.filter((task) => task.col === col).length}</span></div>{tasks.filter((task) => task.col === col).map((task) => <div key={task.id} className="kanban-card" style={{ borderLeftColor: task.priority === 'HIGH' || task.priority === 'P0' ? 'var(--red)' : task.priority === 'MED' ? 'var(--amber)' : 'var(--cyan)' }}><div className="flex justify-between items-center"><span className="mono" style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.5 }}>{task.id}</span><span className={`pill ${task.priority === 'HIGH' || task.priority === 'P0' ? 'pill-red' : task.priority === 'MED' ? 'pill-amber' : 'pill-cyan'}`} style={{ fontSize: 8 }}>{task.priority}</span></div><div style={{ fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>{task.title}</div>{task.findingId && <div className="mono mt-2" style={{ fontSize: 10, color: 'var(--red)' }}>ref {task.findingId}</div>}<div className="flex items-center justify-between mt-2"><span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>@{task.owner}</span><select onChange={(event) => void moveTask(task.id, event.target.value as TaskColumn)} value={task.col} className="mono" style={{ fontSize: 9, background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '2px 4px', borderRadius: 2, letterSpacing: 1, cursor: 'pointer' }}>{cols.map((item) => <option key={item} value={item}>{item.replace('_', ' ')}</option>)}</select></div></div>)}{tasks.filter((task) => task.col === col).length === 0 && <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', letterSpacing: 1 }}>// empty</div>}</div>)}
      </div>
    </div>
  );
};

const Reports = ({ reports, engagement, findings }: { reports: Report[]; engagement: Engagement; findings: Finding[] }) => {
  const [view, setView] = useState<'list' | 'builder' | 'preview'>('list');
  const [picked, setPicked] = useState(findings.filter((finding) => finding.status === 'CONFIRMED').map((finding) => finding.id));
  const toggle = (id: string) => setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  if (view === 'preview') return <div className="page-pad" style={{ maxWidth: 1100 }}><button onClick={() => setView('builder')} className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>{'<-'} BACK TO BUILDER</button><div className="card mt-3" style={{ padding: 60, background: '#f4f3ee', color: '#1a1a1a', minHeight: '80vh' }}><div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #b91c1c', paddingBottom: 20 }}><div><div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#b91c1c', letterSpacing: 3 }}>REDOPS COLLAB</div><h1 style={{ fontFamily: 'var(--sans)', fontSize: 32, fontWeight: 900, marginTop: 8, color: '#0a0a0a' }}>{engagement.client} - Penetration Test Report</h1><div style={{ color: '#555', marginTop: 4 }}>{engagement.id} / {engagement.type} / {engagement.start} - {engagement.end}</div></div><div style={{ textAlign: 'right', fontSize: 11, color: '#666' }}><div>CONFIDENTIAL</div><div>v1.0 DRAFT</div><div>{new Date().toISOString().slice(0, 10)}</div></div></div><h2 style={{ marginTop: 30, fontSize: 20, fontWeight: 700 }}>Executive Summary</h2><p style={{ marginTop: 8, color: '#333', lineHeight: 1.7 }}>Between {engagement.start} and {engagement.end}, a team of {engagement.team} operators conducted a {engagement.type.toLowerCase().replace('_', ' ')} engagement against {engagement.client}. {picked.length} findings are selected for this report draft.</p><h2 style={{ marginTop: 24, fontSize: 20, fontWeight: 700 }}>Findings Summary</h2><table style={{ width: '100%', marginTop: 12, fontSize: 13, borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '1px solid #333' }}><th style={{ textAlign: 'left', padding: 6 }}>ID</th><th style={{ textAlign: 'left', padding: 6 }}>Title</th><th style={{ textAlign: 'left', padding: 6 }}>Severity</th><th style={{ textAlign: 'left', padding: 6 }}>CVSS</th></tr></thead><tbody>{findings.filter((finding) => picked.includes(finding.id)).map((finding) => <tr key={finding.id} style={{ borderBottom: '1px dashed #ccc' }}><td style={{ padding: 6, fontFamily: 'var(--mono)' }}>{finding.id}</td><td style={{ padding: 6 }}>{finding.title}</td><td style={{ padding: 6 }}>{finding.severity}</td><td style={{ padding: 6, fontFamily: 'var(--mono)' }}>{finding.cvss.toFixed(1)}</td></tr>)}</tbody></table><div style={{ marginTop: 30, padding: 14, background: '#fee', border: '1px solid #fcc', fontSize: 12, color: '#7a1a1a' }}>WATERMARK / {engagement.client} / Tracking ID a8f3-2206-{engagement.id.slice(-3)} / Do not redistribute.</div></div><div className="flex justify-end gap-2 mt-3"><button className="btn-ghost">EXPORT PDF</button><button className="btn-ghost">EXPORT DOCX</button><button className="btn-red">SEND FOR SIGN-OFF</button></div></div>;
  if (view === 'builder') return <div className="page-pad" style={{ maxWidth: 1280 }}><button onClick={() => setView('list')} className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, background: 'transparent', border: 0, cursor: 'pointer' }}>{'<-'} BACK TO REPORTS</button><SectionTitle eyebrow="REPORT BUILDER" title="Build" red={engagement.client} /><p style={{ color: 'var(--text-dim)', marginTop: 4 }}>Pick findings to include. Selected: <span style={{ color: 'var(--red)' }}>{picked.length}</span> / {findings.length}</p><div className="grid grid-cols-3 responsive-grid-3 gap-3 mt-6"><div className="card p-5 col-span-2"><div className="mono mb-3" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// INCLUDE FINDINGS</div>{findings.map((finding) => <label key={finding.id} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px dashed var(--border)', cursor: 'pointer' }}><input type="checkbox" checked={picked.includes(finding.id)} onChange={() => toggle(finding.id)} /><span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 74 }}>{finding.id}</span><span className={`pill ${sevColor(finding.severity)}`} style={{ minWidth: 70, textAlign: 'center' }}>{finding.severity}</span><span style={{ flex: 1, fontSize: 13 }}>{finding.title}</span><span className={`pill ${statusColor(finding.status)}`}>{finding.status}</span></label>)}</div><div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>// REPORT META</div><label className="field-label">Report name</label><input className="field-input" defaultValue={`${engagement.client} - Internal Tech Report v0.4`} /><label className="field-label mt-3">Template</label><select className="field-select"><option>Standard Pentest v2</option><option>Executive Summary</option></select><button onClick={() => setView('preview')} className="btn-red w-full mt-4">PREVIEW REPORT -&gt;</button></div></div></div>;
  return <div className="page-pad" style={{ maxWidth: 1280 }}><div className="flex items-end justify-between mt-3 mobile-stack gap-3"><SectionTitle eyebrow="DELIVERY" title="Reports &" red="Delivery" /><button onClick={() => setView('builder')} className="btn-red flex items-center gap-2"><Icon name="plus" /> START NEW REPORT</button></div><div className="card mt-6 desktop-table"><div className="grid grid-cols-12 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}><div className="col-span-1">ID</div><div className="col-span-5">NAME</div><div className="col-span-2">STATUS</div><div className="col-span-2">AUTHOR</div><div className="col-span-1 text-right">FINDINGS</div><div className="col-span-1 text-right">UPDATED</div></div>{reports.map((report) => <div key={report.id} className="table-row grid grid-cols-12 items-center" style={{ padding: '14px 18px' }}><div className="col-span-1 mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{report.id}</div><div className="col-span-5">{report.name}</div><div className="col-span-2"><span className={`pill ${statusColor(report.status)}`}>{report.status}</span></div><div className="col-span-2 mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>@{report.author}</div><div className="col-span-1 text-right">{report.findings}</div><div className="col-span-1 text-right mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{report.updated}</div></div>)}</div></div>;
};

const Team = ({ team }: { team: User[] }) => <div className="page-pad" style={{ maxWidth: 1280 }}><SectionTitle eyebrow="ORGANIZATION" title="Team &" red="Roles" /><p style={{ color: 'var(--text-dim)', marginTop: 6, maxWidth: 680 }}>Roles are scoped per engagement. Platform admins cannot view engagement content by design.</p><div className="card mt-6 desktop-table"><div className="grid grid-cols-12 mono" style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, padding: '12px 18px', borderBottom: '1px solid var(--border)' }}><div className="col-span-3">OPERATOR</div><div className="col-span-3">ROLE</div><div className="col-span-2">ENGAGEMENTS</div><div className="col-span-2">PRESENCE</div><div className="col-span-2 text-right">LAST SEEN</div></div>{team.map((member) => <div key={member.user} className="table-row grid grid-cols-12 items-center" style={{ padding: '14px 18px' }}><div className="col-span-3"><div style={{ fontWeight: 600 }}>{member.name}</div><div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{member.user}</div></div><div className="col-span-3"><span className={`pill ${member.role.includes('LEAD') || member.role.includes('ADMIN') ? 'pill-red' : member.role.includes('SENIOR') ? 'pill-amber' : member.role.includes('CLIENT') ? 'pill-cyan' : 'pill-gray'}`}>{member.role}</span></div><div className="col-span-2 mono" style={{ fontSize: 13 }}>{member.engagements}</div><div className="col-span-2 mono" style={{ fontSize: 11 }}><span style={{ color: member.status === 'online' ? 'var(--green)' : member.status === 'idle' ? 'var(--amber)' : 'var(--text-muted)' }}>* </span><span style={{ color: 'var(--text-dim)' }}>{member.status}</span></div><div className="col-span-2 text-right mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.last}</div></div>)}</div></div>;

const Settings = () => <div className="page-pad" style={{ maxWidth: 980 }}><SectionTitle eyebrow="SYSTEM" title="Settings" /><p style={{ color: 'var(--text-dim)', marginTop: 6 }}>Platform-level configuration. Changes are audited by the API.</p><div className="grid grid-cols-2 responsive-grid-2 gap-3 mt-7"><SettingsCard title="// AUTHENTICATION"><SettingRow label="Require 2FA for all operators" checked /><SettingRow label="Allow WebAuthn / hardware keys" checked /></SettingsCard><SettingsCard title="// DATA & ENCRYPTION"><SettingRow label="Encrypt evidence at rest (AES-256)" checked disabled /><SettingRow label="Daily backups" checked /></SettingsCard><div className="card p-5 col-span-2"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>// INTEGRATIONS</div><div className="grid grid-cols-4 responsive-grid-4 gap-2 mt-4">{['Burp Suite', 'Nmap / Masscan', 'MITRE ATT&CK', 'Slack', 'Jira', 'GitHub', 'Vault', 'Okta SSO'].map((item) => <div key={item} className="card p-3" style={{ textAlign: 'center' }}><div className="mono" style={{ fontSize: 11 }}>{item}</div><span className="pill pill-amber mt-2 inline-block">PLANNED</span></div>)}</div></div></div></div>;
const SettingsCard = ({ title, children }: { title: string; children: ReactNode }) => <div className="card p-5"><div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', letterSpacing: 2 }}>{title}</div>{children}</div>;
const SettingRow = ({ label, checked, disabled }: { label: string; checked?: boolean; disabled?: boolean }) => <label className="flex items-center justify-between mt-4"><span style={{ fontSize: 13 }}>{label}</span><input type="checkbox" defaultChecked={checked} disabled={disabled} /></label>;

const Loading = () => <div className="grid-bg min-h-screen flex items-center justify-center"><div className="card p-6 mono" style={{ color: 'var(--text-dim)' }}>// initializing RedOps workspace</div></div>;
const EmptyWorkspace = ({ setPage }: { setPage: (page: Page) => void }) => <div className="page-pad"><div className="card p-6"><div className="mono" style={{ color: 'var(--red)', letterSpacing: 2 }}>// NO ACTIVE ENGAGEMENT</div><p style={{ color: 'var(--text-dim)', marginTop: 8 }}>Select an engagement from the dashboard before opening this workspace module.</p><button className="btn-red mt-4" onClick={() => setPage('dashboard')}>OPEN DASHBOARD</button></div></div>;

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [team, setTeam] = useState<User[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activeEngId, setActiveEngId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<EngagementWorkspacePayload | null>(null);
  const [openFindingId, setOpenFindingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const applyDashboard = (payload: DashboardPayload) => {
    setUser(payload.user);
    setEngagements(payload.engagements);
    setTeam(payload.team);
    setActivity(payload.activity);
  };

  const loadDashboard = async () => applyDashboard(await api.dashboard());
  const loadWorkspace = async (engagementId: string) => setWorkspace(await api.workspace(engagementId));

  useEffect(() => {
    const restore = async () => {
      try {
        await api.me();
        await loadDashboard();
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    };
    void restore();
  }, []);

  const activeEng = useMemo(() => workspace?.engagement ?? engagements.find((engagement) => engagement.id === activeEngId) ?? null, [workspace, engagements, activeEngId]);
  const activeFinding = workspace?.findings.find((finding) => finding.id === openFindingId) ?? null;

  const pickEngagement = async (engagement: Engagement) => {
    setActiveEngId(engagement.id);
    setPage('engagement');
    setWorkspace(null);
    await loadWorkspace(engagement.id);
  };

  const clearEngagement = () => {
    setActiveEngId(null);
    setWorkspace(null);
    setPage('dashboard');
  };

  const logout = async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
    setActiveEngId(null);
    setWorkspace(null);
    setPage('dashboard');
  };

  const saveFinding = async (input: CreateFindingInput) => {
    if (!activeEng) return;
    const { finding } = await api.createFinding(activeEng.id, input);
    setWorkspace((current) => current ? { ...current, findings: [finding, ...current.findings] } : current);
    await loadDashboard();
    showToast(`Finding ${finding.id} saved as DRAFT`);
    setPage('findings');
  };

  const addTaskFromFinding = async (finding: Finding) => {
    if (!activeEng) return;
    const priority: TaskPriority = finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'HIGH' : 'MED';
    const { task } = await api.createTask(activeEng.id, { title: `Follow up on ${finding.id} - ${finding.title.slice(0, 44)}`, owner: finding.owner, findingId: finding.id, priority });
    setWorkspace((current) => current ? { ...current, tasks: [task, ...current.tasks] } : current);
    showToast(`Task ${task.id} created for @${finding.owner}`);
    setPage('tasks');
  };

  const moveTask = async (taskId: string, col: TaskColumn) => {
    const { task } = await api.moveTask(taskId, col);
    setWorkspace((current) => current ? { ...current, tasks: current.tasks.map((item) => item.id === task.id ? task : item) } : current);
  };

  const openQuickAction = async (action: QuickAction) => {
    if (action === 'INVITE OPERATOR') {
      setPage('team');
      return;
    }

    const selected = activeEng ?? engagements.find((engagement) => engagement.status === 'ACTIVE') ?? engagements[0];
    if (!selected) {
      showToast('No engagement is available yet.');
      return;
    }

    const nextPage: Page = action === 'CREATE FINDING' ? 'finding-new' : action === 'START REPORT' ? 'reports' : 'targets';
    setActiveEngId(selected.id);
    setWorkspace(null);
    setPage(nextPage);
    await loadWorkspace(selected.id);

    if (action === 'IMPORT NMAP / BURP') {
      showToast(`Opened ${selected.client} targets. Import parser is next in the MVP backlog.`);
    } else if (!activeEng) {
      showToast(`Using active engagement: ${selected.client}`);
    }
  };

  const titleFor = () => ({ dashboard: 'Operations Dashboard', engagement: activeEng?.client ?? 'Engagement', targets: 'Targets & Recon', findings: 'Findings', 'finding-detail': openFindingId ?? 'Finding', 'finding-new': 'New Finding', tasks: 'Tasks Board', reports: 'Reports', team: 'Team', settings: 'Settings' })[page];
  const breadcrumbFor = () => ['REDOPS_', activeEng?.id, ({ dashboard: 'DASHBOARD', engagement: 'OVERVIEW', targets: 'TARGETS', findings: 'FINDINGS', 'finding-detail': 'FINDING', 'finding-new': 'NEW_FINDING', tasks: 'TASKS', reports: 'REPORTS', team: 'TEAM', settings: 'SETTINGS' })[page]].filter(Boolean).join(' / ');

  if (booting) return <Loading />;
  if (!user) return <Login onAuthenticated={(payload) => { applyDashboard(payload); showToast('Authenticated / session r.chen'); }} />;

  let content: ReactNode;
  if (['engagement', 'targets', 'findings', 'finding-detail', 'finding-new', 'tasks', 'reports'].includes(page) && !activeEng) {
    content = <EmptyWorkspace setPage={setPage} />;
  } else if (activeEng && !workspace && page !== 'dashboard') {
    content = <div className="page-pad"><div className="card p-6 mono">// loading engagement workspace</div></div>;
  } else {
    switch (page) {
      case 'dashboard': content = <Dashboard engagements={engagements} activity={activity} pickEngagement={(engagement) => void pickEngagement(engagement)} onQuickAction={(action) => void openQuickAction(action)} notify={showToast} />; break;
      case 'engagement': content = workspace ? <EngagementOverview workspace={workspace} setPage={setPage} /> : null; break;
      case 'targets': content = workspace ? <Targets targets={workspace.targets} /> : null; break;
      case 'findings': content = workspace ? <Findings findings={workspace.findings} openFinding={(id) => { setOpenFindingId(id); setPage('finding-detail'); }} startNewFinding={() => setPage('finding-new')} /> : null; break;
      case 'finding-detail': content = activeFinding ? <FindingDetail finding={activeFinding} back={() => setPage('findings')} addTask={(finding) => void addTaskFromFinding(finding)} /> : <EmptyWorkspace setPage={setPage} />; break;
      case 'finding-new': content = <NewFinding save={saveFinding} cancel={() => setPage('findings')} />; break;
      case 'tasks': content = workspace ? <Tasks tasks={workspace.tasks} moveTask={moveTask} /> : null; break;
      case 'reports': content = workspace ? <Reports reports={workspace.reports} engagement={workspace.engagement} findings={workspace.findings} /> : null; break;
      case 'team': content = <Team team={team} />; break;
      case 'settings': content = <Settings />; break;
      default: content = <Dashboard engagements={engagements} activity={activity} pickEngagement={(engagement) => void pickEngagement(engagement)} onQuickAction={(action) => void openQuickAction(action)} notify={showToast} />;
    }
  }

  return (
    <div className="flex">
      <Sidebar page={page} setPage={setPage} activeEng={activeEng} clearEngagement={clearEngagement} logout={() => void logout()} user={user} />
      <main className="flex-1 min-h-screen" style={{ background: 'var(--bg)' }}>
        <TopBar title={titleFor()} breadcrumb={breadcrumbFor()} />
        {content}
      </main>
      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, background: 'var(--surface3)', border: '1px solid var(--red)', color: 'var(--text)', padding: '12px 20px', borderRadius: 3, boxShadow: '0 0 24px rgba(229, 56, 59, .3)' }} className="mono">{toast}</div>}
    </div>
  );
}
