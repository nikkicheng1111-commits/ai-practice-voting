import { v4 as uuidv4 } from 'uuid';

const API_URL = '/api/data';

// Anonymous user ID stored in localStorage
export function getUserId() {
  let userId = localStorage.getItem('ai_voting_user_id');
  if (!userId) {
    userId = 'user_' + uuidv4().slice(0, 8);
    localStorage.setItem('ai_voting_user_id', userId);
  }
  return userId;
}

async function fetchData() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
}

async function saveData(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save data');
}

// --- Cases ---

export async function getCases() {
  const data = await fetchData();
  return data.cases || [];
}

export async function addCase(name, description = '') {
  const data = await fetchData();
  if (!data.cases) data.cases = [];
  if (!data.scores) data.scores = [];
  const newCase = { id: uuidv4(), name, description };
  data.cases.push(newCase);
  await saveData(data);
  return newCase;
}

export async function deleteCase(caseId) {
  const data = await fetchData();
  data.cases = (data.cases || []).filter(c => c.id !== caseId);
  data.scores = (data.scores || []).filter(s => s.case_id !== caseId);
  await saveData(data);
}

// --- Scores ---

export async function getScores() {
  const data = await fetchData();
  return data.scores || [];
}

export async function addScore(caseId, usefulness, impact, reproducibility) {
  const userId = getUserId();
  const data = await fetchData();
  if (!data.cases) data.cases = [];
  if (!data.scores) data.scores = [];

  // Remove existing score from this user for this case
  data.scores = data.scores.filter(s => !(s.case_id === caseId && s.user_id === userId));
  data.scores.push({
    case_id: caseId,
    user_id: userId,
    usefulness,
    impact,
    reproducibility,
    timestamp: Date.now(),
  });
  await saveData(data);
}

export async function getUserScore(caseId) {
  const userId = getUserId();
  const scores = await getScores();
  return scores.find(s => s.case_id === caseId && s.user_id === userId) || null;
}

// --- Leaderboard ---

export async function getLeaderboard() {
  const data = await fetchData();
  const cases = data.cases || [];
  const scores = data.scores || [];

  return cases.map(c => {
    const caseScores = scores.filter(s => s.case_id === c.id);
    const count = caseScores.length;

    if (count === 0) {
      return { ...c, avgTotal: 0, avgUsefulness: 0, avgImpact: 0, avgReproducibility: 0, count: 0 };
    }

    const avgUsefulness = caseScores.reduce((sum, s) => sum + s.usefulness, 0) / count;
    const avgImpact = caseScores.reduce((sum, s) => sum + s.impact, 0) / count;
    const avgReproducibility = caseScores.reduce((sum, s) => sum + s.reproducibility, 0) / count;
    const avgTotal = (avgUsefulness + avgImpact + avgReproducibility) / 3;

    return {
      ...c,
      avgTotal: Math.round(avgTotal * 100) / 100,
      avgUsefulness: Math.round(avgUsefulness * 100) / 100,
      avgImpact: Math.round(avgImpact * 100) / 100,
      avgReproducibility: Math.round(avgReproducibility * 100) / 100,
      count,
    };
  }).sort((a, b) => b.avgTotal - a.avgTotal);
}
