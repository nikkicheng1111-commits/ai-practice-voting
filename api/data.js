const OWNER = process.env.GITHUB_REPO_OWNER;
const REPO = process.env.GITHUB_REPO_NAME;
const BRANCH = 'data';
const FILE_PATH = 'data.json';
const TOKEN = process.env.GITHUB_TOKEN;

const API_BASE = 'https://api.github.com';

async function ghFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`GitHub API ${res.status}: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function getData() {
  try {
    const file = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (err) {
    if (err.status === 404) {
      return { cases: [], scores: [] };
    }
    throw err;
  }
}

async function saveData(data) {
  let sha;
  try {
    const file = await ghFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
    sha = file.sha;
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  await ghFetch(`/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: 'Update voting data',
      content,
      sha,
      branch: BRANCH,
    }),
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const data = await getData();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const data = req.body;
      await saveData(data);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
