// Report content structure
export interface ReportContent {
  idea_title: string;
  target: string;
  challenges: string;
  monetization: string;
  market_tam: string;
  competitors: string;
  mitsubishi_synergy: string;
  risks: string;
  roadmap: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  content: ReportContent;
  html_content: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface Score {
  id: string;
  report_id: string;
  user_id: string;
  market_score: number; // 市場の大きさと競合環境 (1-5)
  synergy_score: number; // 三菱地所だからこその勝ち筋があるか (1-5)
  target_score: number; // ターゲットと課題の納得感 (1-5)
  competitive_score?: number; // 競合優位性 (1-5) - 将来的に削除予定
  comment: string | null;
  created_at: string;
}

export type LogEventType = 
  | 'api_call'
  | 'error'
  | 'performance'
  | 'agent_execution'
  | 'user_action'
  | 'general';

export interface Log {
  id: string;
  user_id: string;
  event_type: LogEventType;
  details: Record<string, unknown>;
  tokens_used: number;
  created_at: string;
}

// Helper types for creating records
export type CreateReportInput = Omit<Report, 'id' | 'created_at' | 'updated_at'>;
export type UpdateReportInput = Partial<Omit<Report, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type CreateScoreInput = Omit<Score, 'id' | 'created_at'>;
export type CreateLogInput = Omit<Log, 'id' | 'created_at'>;