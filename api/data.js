import { Octokit } from '@octokit/rest';

const OWNER = process.env.GITHUB_REPO_OWNER;
const REPO = process.env.GITHUB_REPO_NAME;
const BRANCH = 'data';
const FILE_PATH = 'data.json';
const TOKEN = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: TOKEN });

async function getData() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      ref: BRANCH,
    });
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
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
    const { data: existing } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: FILE_PATH,
      ref: BRANCH,
    });
    sha = existing.sha;
  } catch (err) {
    if (err.status !== 404) throw err;
  }

  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  await octokit.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: FILE_PATH,
    message: 'Update voting data',
    content,
    sha,
    branch: BRANCH,
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
