// Supreme OS Utils - מודולרי, חכם, עם Agent שיפור עצמי
const fs = require('fs');
const path = require('path');

/**
 * Supreme AGI Utils Agent
 * - מזהה תקלות/שיפורים בפונקציות עזר
 * - מציע/מבצע שיפורים אוטומטיים
 * - מתעד כל פעולה בזיכרון
 */
const utilsAgent = {
  suggestImprovements() {
    // דוגמה: בדיקת שימוש ב-sync
    if (getFolderTree.toString().includes('Sync')) {
      this.notify('המלצה: שקול להשתמש בגרסה אסינכרונית (async) של fs לקריאות מהירות.', 'info');
    }
  },
  autoImprove() {
    // דוגמה: (עתידי) - החלפה אוטומטית ל-async
  },
  notify(msg, type='info') {
    // ניתן להרחיב ל-IPC או לוג מרכזי
    if (typeof window !== 'undefined' && window.createNotification) window.createNotification(msg, type);
    else if (console && console.info) console.info('UtilsAgent:', msg);
  },
  run() {
    setTimeout(()=>{ this.suggestImprovements(); this.autoImprove(); }, 1800);
  }
};

// Recursively get folder tree as a nested object
function getFolderTree(dirPath) {
  const stats = fs.statSync(dirPath);
  if (!stats.isDirectory()) return null;
  const result = { name: path.basename(dirPath), path: dirPath, type: 'directory', children: [] };
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      result.children.push(getFolderTree(fullPath));
    } else {
      result.children.push({ name: file, path: fullPath, type: 'file' });
    }
  }
  return result;
}

// הפעלת agent שיפור עצמי אוטומטית
if (typeof utilsAgent !== 'undefined') utilsAgent.run();

module.exports = { getFolderTree };

