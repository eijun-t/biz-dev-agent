-- Workflow Management Tables
-- ワークフロー管理用テーブル

-- セッション管理テーブル
CREATE TABLE IF NOT EXISTS workflow_sessions (
  id TEXT PRIMARY KEY,
  user_input TEXT,
  phase TEXT NOT NULL DEFAULT 'input',
  current_step TEXT,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ワークフローステップ履歴テーブル
CREATE TABLE IF NOT EXISTS workflow_steps (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES workflow_sessions(id),
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration INTEGER,
  details TEXT
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_workflow_steps_session_id ON workflow_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_timestamp ON workflow_steps(timestamp);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_status ON workflow_sessions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_phase ON workflow_sessions(phase);

-- コメント追加
COMMENT ON TABLE workflow_sessions IS 'マルチエージェントワークフローのセッション管理';
COMMENT ON TABLE workflow_steps IS 'エージェント実行ステップの履歴記録';

COMMENT ON COLUMN workflow_sessions.phase IS '現在のフェーズ: input, research, ideation, analysis, report, completed';
COMMENT ON COLUMN workflow_sessions.status IS 'セッション状態: pending, running, completed, failed';
COMMENT ON COLUMN workflow_steps.agent IS '実行エージェント: planner, researcher, ideator, critic, analyst, writer, coordinator';
COMMENT ON COLUMN workflow_steps.status IS 'ステップ状態: pending, in_progress, completed, failed';