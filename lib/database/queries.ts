import { createClient } from '@/lib/supabase/server';
import { 
  Report, 
  Score, 
  Log, 
  CreateReportInput, 
  UpdateReportInput, 
  CreateScoreInput, 
  CreateLogInput 
} from './types';

// ============================================
// Report Functions
// ============================================

export async function getReports(userId: string): Promise<Report[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getReportById(id: string, userId: string): Promise<Report | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function createReport(report: CreateReportInput): Promise<Report> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReport(id: string, updates: UpdateReportInput): Promise<Report> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReport(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

// ============================================
// Score Functions
// ============================================

export async function createScore(score: CreateScoreInput): Promise<Score> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .insert(score)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getScoreByReport(reportId: string): Promise<Score | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('report_id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

export async function updateScore(id: string, updates: Partial<CreateScoreInput>): Promise<Score> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function upsertScore(reportId: string, score: CreateScoreInput): Promise<Score> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('scores')
    .upsert(score, { onConflict: 'report_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Log Functions
// ============================================

export async function createLog(log: CreateLogInput): Promise<Log> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('logs')
    .insert(log)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLogs(userId: string, limit: number = 100): Promise<Log[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getLogsByEventType(userId: string, eventType: string, limit: number = 100): Promise<Log[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('logs')
    .select('*')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ============================================
// Analytics Functions
// ============================================

export async function getReportStats(userId: string): Promise<{
  total: number;
  completed: number;
  pending: number;
  processing: number;
  failed: number;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reports')
    .select('status')
    .eq('user_id', userId);

  if (error) throw error;

  const stats = {
    total: data.length,
    completed: 0,
    pending: 0,
    processing: 0,
    failed: 0
  };

  data.forEach(report => {
    stats[report.status as keyof typeof stats]++;
  });

  return stats;
}

export async function getTokenUsage(userId: string, days: number = 30): Promise<number> {
  const supabase = await createClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('logs')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  return data.reduce((total, log) => total + (log.tokens_used || 0), 0);
}