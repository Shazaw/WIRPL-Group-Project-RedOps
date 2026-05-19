CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM (
  'PLATFORM_ADMIN',
  'ENGAGEMENT_LEAD',
  'SENIOR_TESTER',
  'TESTER',
  'REPORT_WRITER',
  'CLIENT_VIEWER',
  'AUDITOR'
);

CREATE TYPE engagement_status AS ENUM (
  'DRAFT',
  'SCOPING',
  'ACTIVE',
  'REPORTING',
  'REVIEW',
  'DELIVERED',
  'ARCHIVED'
);

CREATE TYPE finding_status AS ENUM (
  'DRAFT',
  'IN_REVIEW',
  'CONFIRMED',
  'DISPUTED',
  'FALSE_POSITIVE',
  'RISK_ACCEPTED'
);

CREATE TYPE severity AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL');

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  global_role user_role NOT NULL DEFAULT 'TESTER',
  mfa_methods jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE engagements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  engagement_code text NOT NULL UNIQUE,
  engagement_type text NOT NULL,
  status engagement_status NOT NULL DEFAULT 'DRAFT',
  risk severity NOT NULL DEFAULT 'LOW',
  start_date date NOT NULL,
  end_date date NOT NULL,
  scope jsonb NOT NULL DEFAULT '{}',
  rules_of_engagement text,
  encryption_key_id uuid,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE engagement_members (
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  PRIMARY KEY (engagement_id, user_id)
);

CREATE TABLE findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  finding_code text NOT NULL,
  title text NOT NULL,
  severity severity NOT NULL,
  cvss_score numeric(3, 1) NOT NULL CHECK (cvss_score >= 0 AND cvss_score <= 10),
  cvss_vector text,
  status finding_status NOT NULL DEFAULT 'DRAFT',
  target text,
  description text,
  steps_to_reproduce text,
  impact text,
  remediation text,
  internal_notes text,
  tags text[] NOT NULL DEFAULT '{}',
  cve_references text[] NOT NULL DEFAULT '{}',
  cwe_id text,
  attack_techniques text[] NOT NULL DEFAULT '{}',
  discovered_by uuid NOT NULL REFERENCES users(id),
  reviewed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, finding_code)
);

CREATE TABLE targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  target_code text NOT NULL,
  hostname text NOT NULL,
  ip_address inet,
  technology text,
  status text NOT NULL DEFAULT 'NOT_STARTED',
  assigned_to uuid REFERENCES users(id),
  ports jsonb NOT NULL DEFAULT '[]',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, target_code)
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  task_code text NOT NULL,
  title text NOT NULL,
  description text,
  column_key text NOT NULL DEFAULT 'TODO',
  priority text NOT NULL DEFAULT 'P3',
  owner_id uuid REFERENCES users(id),
  finding_id uuid REFERENCES findings(id) ON DELETE SET NULL,
  due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, task_code)
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  report_code text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  author_id uuid NOT NULL REFERENCES users(id),
  selected_finding_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id, report_code)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  actor_id uuid REFERENCES users(id),
  actor_ip inet,
  user_agent text,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure')),
  metadata jsonb NOT NULL DEFAULT '{}',
  prior_chain_hash text,
  chain_hash text NOT NULL
);

ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_findings_engagement_id ON findings(engagement_id);
CREATE INDEX idx_tasks_engagement_id ON tasks(engagement_id);
CREATE INDEX idx_targets_engagement_id ON targets(engagement_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
