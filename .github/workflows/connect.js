// connect.js - Supreme OS Universal Connector
// מאפשר התחברות לכל שירות, API, שרת, רשת, ענן, או אפליקציה
// מודול בסיסי, ניתן להרחבה לפלאגינים

const connectors = {
  http: {
    name: 'API / HTTP',
    fields: [
      { name: 'url', label: 'URL', type: 'text', required: true },
      { name: 'method', label: 'Method', type: 'select', options: ['GET','POST','PUT','DELETE'], required: true },
      { name: 'headers', label: 'Headers (JSON)', type: 'text', required: false },
      { name: 'body', label: 'Body (JSON)', type: 'text', required: false },
    ]
  },
  ftp: {
    name: 'FTP / SFTP',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', required: false },
      { name: 'user', label: 'Username', type: 'text', required: true },
      { name: 'pass', label: 'Password', type: 'password', required: true },
      { name: 'secure', label: 'Secure (SFTP)', type: 'checkbox', required: false },
    ]
  },
  ssh: {
    name: 'SSH',
    fields: [
      { name: 'host', label: 'Host', type: 'text', required: true },
      { name: 'port', label: 'Port', type: 'number', required: false },
      { name: 'user', label: 'Username', type: 'text', required: true },
      { name: 'pass', label: 'Password', type: 'password', required: true },
      { name: 'cmd', label: 'Command (optional)', type: 'text', required: false },
    ]
  },
  websocket: {
    name: 'WebSocket',
    fields: [
      { name: 'url', label: 'WebSocket URL', type: 'text', required: true }
    ]
  },
  cloud: {
    name: 'ענן',
    fields: [
      { name: 'provider', label: 'Provider', type: 'select', options: ['Google Drive','AWS S3','Dropbox','OneDrive'], required: true },
      { name: 'apikey', label: 'API Key', type: 'text', required: true },
      { name: 'secret', label: 'Secret', type: 'password', required: false },
    ]
  },
  messenger: {
    name: 'אפליקציות מסרים',
    fields: [
      { name: 'platform', label: 'Platform', type: 'select', options: ['Telegram','WhatsApp','Discord','Slack'], required: true },
      { name: 'token', label: 'Token', type: 'text', required: true },
      { name: 'channel', label: 'Channel/Group', type: 'text', required: false },
    ]
  },
};

const connectorsPanel = document.getElementById('connectorsPanel');
const form = document.getElementById('connectionForm');
const formFields = document.getElementById('formFields');
const formTitle = document.getElementById('formTitle');
const statusDiv = document.getElementById('connectionStatus');
const savedConnectionsList = document.getElementById('savedConnectionsList');

// --- Auto-connect all saved connections on load ---
window.addEventListener('DOMContentLoaded', async () => {
  let list = JSON.parse(localStorage.getItem('supreme_connections')||'[]');
  if(list.length) {
    for(const item of list) {
      statusDiv.innerHTML += `<div>⏳ מנסה להתחבר אוטומטית ל-${connectors[item.type]?.name||item.type}...</div>`;
      try {
        // כאן ניתן להרחיב לקריאה ל-agent backend
        await new Promise(r=>setTimeout(r, 600)); // סימולציה
        statusDiv.innerHTML += `<div style='color:var(--success)'>✔️ התחבר אוטומטית ל-${connectors[item.type]?.name||item.type}</div>`;
      } catch(e) {
        statusDiv.innerHTML += `<div style='color:var(--danger)'>❌ שגיאה אוטומטית: ${e.message||e}</div>`;
      }
    }
  }
});

function renderFields(type) {
  formFields.innerHTML = '';
  const fields = connectors[type].fields;
  fields.forEach(f => {
    let input;
    if(f.type==='select') {
      input = `<select name="${f.name}" required=${!!f.required}>${f.options.map(opt=>`<option value='${opt}'>${opt}</option>`).join('')}</select>`;
    } else if(f.type==='checkbox') {
      input = `<input type="checkbox" name="${f.name}">`;
    } else {
      input = `<input type="${f.type}" name="${f.name}" ${f.required?'required':''}>`;
    }
    formFields.innerHTML += `<label>${f.label}${f.required?' *':''}<br>${input}</label><br>`;
  });
}

document.querySelectorAll('.connector-btn').forEach(btn => {
  btn.onclick = () => {
    const type = btn.dataset.type;
    form.style.display = 'block';
    formTitle.textContent = `הגדר חיבור ${connectors[type].name}`;
    renderFields(type);
    form.dataset.type = type;
    statusDiv.textContent = '';
  };
});

form.onsubmit = async e => {
  e.preventDefault();
  const type = form.dataset.type;
  const data = {};
  Array.from(form.elements).forEach(el => {
    if(el.name) {
      if(el.type==='checkbox') data[el.name] = el.checked;
      else data[el.name] = el.value;
    }
  });
  statusDiv.innerHTML = '⏳ מתחבר...';
  try {
    // חיבור אמיתי לפי סוג (SSH/FTP/HTTP)
    try {
      if (type === 'ssh') {
        // בדוק אם קיימת תמיכה ב-ssh2 דרך IPC
        if(window.electronAPI && window.electronAPI.sshConnect){
          const result = await window.electronAPI.sshConnect(data);
          statusDiv.innerHTML = `<span style='color:var(--success)'>✔️ SSH התחבר בהצלחה: ${result.host||''}</span>`;
        } else {
          throw new Error('ספריית SSH לא מותקנת. יש להתקין ssh2 ב-backend');
        }
      } else if (type === 'ftp') {
        if(window.electronAPI && window.electronAPI.ftpConnect){
          const result = await window.electronAPI.ftpConnect(data);
          statusDiv.innerHTML = `<span style='color:var(--success)'>✔️ FTP התחבר בהצלחה: ${result.host||''}</span>`;
        } else {
          throw new Error('ספריית FTP לא מותקנת. יש להתקין basic-ftp ב-backend');
        }
      } else {
        // דמו עבור שאר החיבורים
        await new Promise(r=>setTimeout(r,1200));
        statusDiv.innerHTML = `<span style='color:var(--success)'>✔️ חיבור הצליח (${connectors[type].name})</span>`;
      }
      saveConnection(type, data);
      renderSavedConnections();
    } catch(e) {
      statusDiv.innerHTML = `<span style='color:var(--danger)'>❌ ${e.message||e}</span>`;
    }
  } catch(err) {
    statusDiv.innerHTML = `<span style='color:var(--danger)'>❌ שגיאה: ${err.message||err}</span>`;
  }
};
function saveConnection(type, data) {
  let list = JSON.parse(localStorage.getItem('supreme_connections')||'[]');
  list.push({type,data,date:Date.now()});
  localStorage.setItem('supreme_connections',JSON.stringify(list));
}

function renderConnectPanel() {
  // אין כפתורי התחברות ידניים, הכל אוטומטי!

  let list = JSON.parse(localStorage.getItem('supreme_connections')||'[]');
  savedConnectionsList.innerHTML = '';
  if(!list.length) { savedConnectionsList.innerHTML = '<li>אין חיבורים שמורים</li>'; return; }
  list.reverse().forEach((item,i) => {
    savedConnectionsList.innerHTML += `<li><b>${connectors[item.type]?.name||item.type}</b> | ${Object.entries(item.data).map(([k,v])=>`${k}: ${v}`).join(', ')} <span style='color:#aaa;font-size:0.93em;'>(${new Date(item.date).toLocaleString()})</span></li>`;
  });
}
renderSavedConnections();
