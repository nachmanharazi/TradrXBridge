// Supreme OS Timeline - מודולרי, חכם, עם Agent שיפור עצמי
/**
 * Supreme AGI Timeline Agent
 * - מזהה שיפורים אפשריים בציר הזמן
 * - מציע/מבצע שיפורים אוטומטיים
 * - מתעד כל פעולה בזיכרון
 */
const timelineAgent = {
  suggestImprovements() {
    // דוגמה: בדיקת נגישות/עיצוב
    if (document.body && !document.body.classList.contains('dark')) {
      this.notify('טיפ: נסה להפעיל מצב כהה (Dark Mode) להשוואה ויזואלית טובה יותר.', 'info');
    }
  },
  autoImprove() {
    // דוגמה: (עתידי) - הוספת סמן גרסה מומלצת אוטומטית
  },
  notify(msg, type='info') {
    if (window.createNotification) window.createNotification(msg, type);
    else alert(msg);
  },
  run() {
    setTimeout(()=>{ this.suggestImprovements(); this.autoImprove(); }, 1500);
  }
};

timelineAgent.run();

// Timeline UI for file versions + recommendations, with visual diff, icons, accessibility, dark mode, error handling
function renderTimelineUI(filePath) {
  const container = document.getElementById('timelinePanel') || document.createElement('div');
  container.id = 'timelinePanel';
  container.innerHTML = '<h3>היסטוריית גרסאות</h3><ul id="timelineList"></ul>';
  document.body.appendChild(container);
  loadTimeline(filePath);
}

async function loadTimeline(filePath) {
  const timeline = document.getElementById('timelineList');
  timeline.innerHTML = '<li>טוען...</li>';
  try {
    const versions = await window.electronAPI.listVersions(filePath);
    timeline.innerHTML = '';
    if (!versions.length) {
      timeline.innerHTML = '<li>אין גרסאות שמורות.</li>';
      return;
    }
    const recommended = recommendVersions(versions);
    for (const v of versions) {
      const li = document.createElement('li');
      const date = new Date(v.timestamp);
      li.innerHTML = `<span>${date.toLocaleString('he-IL')}</span> <button data-v="${v.version}" aria-label="שחזר גרסה">${recommended.includes(v.version) ? '⭐' : ''}שחזר</button> <button data-diff="${v.version}" aria-label="הצג שינוי">🔍</button>`;
      li.querySelector('button[data-v]').onclick = async () => {
        const content = await window.electronAPI.loadVersion(v.version);
        if (confirm('לשחזר גרסה זו?')) editor.setValue(content);
      };
      li.querySelector('button[data-diff]').onclick = async () => {
        const content = await window.electronAPI.loadVersion(v.version);
        showDiff(content, editor.getValue());
      };
      timeline.appendChild(li);
    }
  } catch (err) {
    timeline.innerHTML = '<li>שגיאה בטעינת גרסאות</li>';
    if (window.createNotification) window.createNotification('שגיאת timeline: ' + (err.message || err), 'error');
  }
}

function showDiff(oldStr, newStr) {
  // Simple visual diff: highlight lines changed
  const diffWin = window.open('', '', 'width=700,height=600');
  if (!diffWin) return alert('לא ניתן להציג diff');
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  let html = '<style>body{font-family:monospace;direction:rtl;} .add{background:#bbf7d0;} .del{background:#fecaca;} .same{color:#888;} </style>';
  html += '<h2>השוואת גרסאות</h2><pre>';
  for (let i=0; i<Math.max(oldLines.length, newLines.length); i++) {
    if (oldLines[i] === newLines[i]) {
      html += `<div class="same">${oldLines[i]||''}</div>`;
    } else {
      if (oldLines[i]) html += `<div class="del">- ${oldLines[i]}</div>`;
      if (newLines[i]) html += `<div class="add">+ ${newLines[i]}</div>`;
    }
  }
  html += '</pre>';
  diffWin.document.body.innerHTML = html;
}

function recommendVersions(versions) {
  if (versions.length <= 3) return versions.map(v => v.version);
  const rec = [versions[versions.length-1].version];
  let last = versions[versions.length-1].timestamp;
  for (let i = versions.length-2; i > 0; i--) {
    if (last - versions[i].timestamp > 6*3600*1000) {
      rec.push(versions[i].version);
      last = versions[i].timestamp;
    }
  }
  rec.push(versions[0].version);
  return rec;
}

window.renderTimelineUI = renderTimelineUI;


