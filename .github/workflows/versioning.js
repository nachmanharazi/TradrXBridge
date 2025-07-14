// Automatic versioning and AI-powered code review
const fs = require('fs');
const path = require('path');
const VERSIONS_DIR = path.join(__dirname, '.ai_versions');

function ensureVersionsDir() {
  if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR);
}

function saveVersion(filePath, content) {
  ensureVersionsDir();
  const rel = path.relative(__dirname, filePath).replace(/[\\/]/g, '_');
  const ts = Date.now();
  const versionFile = path.join(VERSIONS_DIR, `${rel}_${ts}.bak`);
  fs.writeFileSync(versionFile, content, 'utf8');
}

function listVersions(filePath) {
  ensureVersionsDir();
  const rel = path.relative(__dirname, filePath).replace(/[\\/]/g, '_');
  return fs.readdirSync(VERSIONS_DIR)
    .filter(f => f.startsWith(rel + '_'))
    .map(f => ({
      file: filePath,
      version: f,
      timestamp: parseInt(f.split('_').pop())
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

function loadVersion(versionFile) {
  return fs.readFileSync(path.join(VERSIONS_DIR, versionFile), 'utf8');
}

module.exports = { saveVersion, listVersions, loadVersion };
