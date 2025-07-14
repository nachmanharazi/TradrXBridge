// Express server for remote control (mobile/phone integration)
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { execSync } = require('child_process');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// קביעת תיקיית העלאות
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const upload = multer({ dest: uploadDir });

// Load password from file or env
let REMOTE_PASS = process.env.REMOTE_PASS || '';
try {
  if (fs.existsSync('remote-password.txt')) {
    REMOTE_PASS = fs.readFileSync('remote-password.txt', 'utf8').trim();
  }
} catch {}
if (!REMOTE_PASS) REMOTE_PASS = '1234'; // ברירת מחדל לאבטחה בסיסית

// In-memory history
let commandHistory = [];

// Middleware: check password
function checkAuth(req, res, next) {
  const pass = req.headers['x-remote-pass'] || req.body.password || req.query.password;
  if (pass !== REMOTE_PASS) {
    return res.status(401).json({ error: 'Unauthorized – יש לספק סיסמה נכונה ב-X-Remote-Pass!' });
  }
  next();
}

// קבלת קובץ מהמכשיר
app.post('/upload', checkAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'לא התקבל קובץ' });
  res.json({ success: true, filename: req.file.filename, original: req.file.originalname });
});

// הורדת קובץ
app.get('/download', checkAuth, (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: 'חסר שם קובץ' });
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'קובץ לא נמצא' });
  res.download(filePath);
});

// מחיקת קובץ
app.delete('/delete', checkAuth, (req, res) => {
  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: 'חסר שם קובץ' });
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'קובץ לא נמצא' });
  try {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'מחיקה נכשלה' });
  }
});

// רשימת קבצים בתיקיית uploads
app.get('/list', checkAuth, (req, res) => {
  try {
    let files = fs.readdirSync(uploadDir).map(fn => {
      const stat = fs.statSync(path.join(uploadDir, fn));
      return { filename: fn, mtime: stat.mtimeMs };
    });
    files = files.sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בשליפת רשימת קבצים' });
  }
});

// Main endpoint: receive command from phone, execute, and return output
app.post('/command', checkAuth, async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing command' });
  commandHistory.push({ command, time: Date.now() });
  try {
    const output = execSync(command, { encoding: 'utf8' });
    res.json({ output });
  } catch (err) {
    res.json({ output: err.message });
  }
});

// Get command history
app.get('/history', checkAuth, (req, res) => {
  res.json(commandHistory.slice(-50));
});

// Health check
app.get('/ping', (req, res) => res.send('OK'));

const PORT = process.env.REMOTE_PORT || 3017;
app.listen(PORT, () => {
  console.log(`Remote control server listening on http://localhost:${PORT}`);
});
