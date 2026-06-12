const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'routes');

const EXEMPT_FILES = [
  'login.js',
  'refresh.js',
  'logout.js', // usually clearing a cookie is fine unauth, but let's leave it
  'forgot.js',
  'reset.js',
  'getTimesheet.js' // already has it
];

function applyAuthToRoute(filePath) {
  const fileName = path.basename(filePath);
  if (EXEMPT_FILES.includes(fileName)) {
    console.log(`Skipping exempt file: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already contains authenticateToken
  if (content.includes('authenticateToken')) {
    console.log(`Already has auth: ${fileName}`);
    return;
  }

  // Determine relative path to middleware
  const relativeDepth = path.relative(ROUTES_DIR, filePath).split(path.sep).length - 1;
  const middlewarePath = relativeDepth === 0 ? '../middleware/auth' : '../../middleware/auth';
  const requireStatement = `const { authenticateToken } = require('${middlewarePath}');\n`;

  // Inject require statement after express router
  content = content.replace(
    /(const router = express\.Router\(\);)/,
    `$1\n${requireStatement}`
  );

  // Inject authenticateToken into route handlers
  // Matches router.get('/api/...', async (req, res) => {
  // or router.post('/api/...', (req, res) => {
  content = content.replace(
    /(router\.(get|post|put|delete)\(['"][^'"]+['"],\s*)(async \s*\(\s*req,\s*res\s*\)|\(\s*req,\s*res\s*\))/g,
    `$1authenticateToken, $3`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Patched: ${fileName}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.js')) {
      applyAuthToRoute(fullPath);
    }
  }
}

walkDir(ROUTES_DIR);
console.log('Done applying auth to routes.');
