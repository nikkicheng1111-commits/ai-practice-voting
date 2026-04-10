const Koa = require('koa');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const fs = require('fs');
const path = require('path');

const app = new Koa();
const router = new Router();

const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { cases: [], scores: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API routes
router.get('/api/data', (ctx) => {
  ctx.body = readData();
});

router.post('/api/data', async (ctx) => {
  const data = ctx.request.body;
  writeData(data);
  ctx.body = { ok: true };
});

// Serve static files (frontend)
const distDir = path.join(__dirname, '..', 'dist');

router.get('/', (ctx) => {
  ctx.type = 'html';
  ctx.body = fs.createReadStream(path.join(distDir, 'index.html'));
});

router.get('/assets/(.*)', (ctx) => {
  const filePath = path.join(distDir, 'assets', ctx.params[0]);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const types = { '.js': 'application/javascript', '.css': 'text/css' };
    ctx.type = types[ext] || 'application/octet-stream';
    ctx.body = fs.createReadStream(filePath);
  }
});

// Catch-all: serve index.html for SPA routing
router.get('(.*)', (ctx) => {
  ctx.type = 'html';
  ctx.body = fs.createReadStream(path.join(distDir, 'index.html'));
});

app.use(cors());
app.use(require('koa-bodyparser')());
app.use(router.routes());
app.use(router.allowedMethods());

module.exports = app;
