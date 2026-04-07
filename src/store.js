import { v4 as uuidv4 } from 'uuid';
import { supabase } from './lib/supabase';

// Anonymous user ID stored in localStorage (unchanged)
export function getUserId() {
  let userId = localStorage.getItem('ai_voting_user_id');
  if (!userId) {
    userId = 'user_' + uuidv4().slice(0, 8);
    localStorage.setItem('ai_voting_user_id', userId);
  }
  return userId;
}

// --- Cases ---

export async function getCases() {
  const { data, error } = await supabase
    .from('cases')
    .select('id, name, description')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addCase(name, description = '') {
  const id = uuidv4();
  const { error } = await supabase
    .from('cases')
    .insert({ id, name, description });

  if (error) throw error;
  return { id, name, description };
}

export async function deleteCase(caseId) {
  const { error: scoreError } = await supabase
    .from('scores')
    .delete()
    .eq('case_id', caseId);
  if (scoreError) throw scoreError;

  const { error: caseError } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId);
  if (caseError) throw caseError;
}

// --- Scores ---

export async function getScores() {
  const { data, error } = await supabase
    .from('scores')
    .select('case_id, user_id, usefulness, impact, reproducibility, timestamp');

  if (error) throw error;
  return data;
}

export async function addScore(caseId, usefulness, impact, reproducibility) {
  const userId = getUserId();
  const timestamp = Date.now();

  const { error } = await supabase
    .from('scores')
    .upsert(
      { case_id: caseId, user_id: userId, usefulness, impact, reproducibility, timestamp },
      { onConflict: 'case_id,user_id' }
    );

  if (error) throw error;
}

export async function getUserScore(caseId) {
  const userId = getUserId();
  const { data, error } = await supabase
    .from('scores')
    .select('case_id, user_id, usefulness, impact, reproducibility, timestamp')
    .eq('case_id', caseId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// --- Leaderboard ---

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*');

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    name: row.name,
    description: row.description,
    avgTotal: Number(row.avg_total),
    avgUsefulness: Number(row.avg_usefulness),
    avgImpact: Number(row.avg_impact),
    avgReproducibility: Number(row.avg_reproducibility),
    count: row.count,
  }));
}
