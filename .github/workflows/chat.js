// Import required libraries
// Supreme OS - Modern Chat Panel (OpenAI-level, CSP-safe, browser/Electron only)
let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

function renderChatUI() {
  if (document.getElementById('chatWrap')) return;
  const chatWrap = document.createElement('div');
  chatWrap.id = 'chatWrap';
  chatWrap.dir = 'rtl';
  chatWrap.innerHTML = `
    <div id="chatHeader" tabindex="0" aria-label="AI Chat Header">🤖 מוח Supreme - צ'אט AI</div>
    <div id="chatHistory" aria-live="polite" tabindex="0"></div>
    <form id="chatForm" autocomplete="off">
      <input id="chatInput" autocomplete="off" placeholder="כתוב שאלה, פקודה או שלח קובץ..." aria-label="הזן שאלה או פקודה למוח-על" />
      <input id="chatFile" type="file" style="display:none" aria-label="בחר קובץ לשליחה">
      <button id="chatSend" type="submit" aria-label="שלח הודעה">שלח</button>
      <button id="chatFileBtn" type="button" aria-label="שלח קובץ">📎</button>
      <span id="chatLoading" style="display:none;margin-right:10px;">⌛</span>
    </form>
    <div id="chatError" style="display:none;color:#f43f5e;font-size:0.98em;margin-top:8px;"></div>
  `;
  document.body.appendChild(chatWrap);

  // Event listeners
  const chatForm = chatWrap.querySelector('#chatForm');
  const chatInput = chatWrap.querySelector('#chatInput');
  const chatFileBtn = chatWrap.querySelector('#chatFileBtn');
  const chatFile = chatWrap.querySelector('#chatFile');

  chatForm.addEventListener('submit', onChatSubmit);
  chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event('submit'));
    }
    if (e.key === 'ArrowUp') {
      let last = chatHistory.filter(m=>m.role==='user').slice(-1)[0];
      if (last) this.value = last.text;
    }
  });
  chatFileBtn.addEventListener('click', () => chatFile.click());
  chatFile.addEventListener('change', async function() {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      addChatMessage('user', `<b>📎 ${escapeHtml(file.name)}</b> (${file.size} bytes)`);
      setChatLoading(true);
      try {
        addChatMessage('ai', `הקובץ <b>${escapeHtml(file.name)}</b> התקבל (דמו)`);
      } catch (err) {
        showChatError(`❌ שגיאה בשליחת קובץ: ${escapeHtml(err.message)}`);
      }
      setChatLoading(false);
      this.value = '';
    }
  });
  // Drag & drop
  chatWrap.addEventListener('dragover', e => { e.preventDefault(); chatWrap.classList.add('dragover'); });
  chatWrap.addEventListener('dragleave', e => { e.preventDefault(); chatWrap.classList.remove('dragover'); });
  chatWrap.addEventListener('drop', async e => {
    e.preventDefault();
    chatWrap.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      addChatMessage('user', `<b>📎 ${escapeHtml(file.name)}</b> (${file.size} bytes)`);
      setChatLoading(true);
      try {
        addChatMessage('ai', `הקובץ <b>${escapeHtml(file.name)}</b> התקבל (דמו)`);
      } catch (err) {
        showChatError(`❌ שגיאה בשליחת קובץ: ${escapeHtml(err.message)}`);
      }
      setChatLoading(false);
    }
  });
  // Event delegation for copy buttons
  chatWrap.addEventListener('click', function(e) {
    if (e.target.classList.contains('copy-btn')) {
      const code = e.target.closest('.bubble-code')?.querySelector('code')?.textContent;
      if (code) navigator.clipboard.writeText(code);
      e.target.textContent = '✔️';
      setTimeout(()=>{e.target.textContent='📋';},800);
    }
  });
  // Load history
  renderChatHistory();
  setTimeout(() => {
    const hist = chatWrap.querySelector('#chatHistory');
    if (hist) hist.scrollTop = hist.scrollHeight;
  }, 100);
  // Dark/light mode auto
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    chatWrap.classList.add('dark');
  }
}

// --- Chat Logic ---
function addChatMessage(role, text, code, skipSave) {
  chatHistory.push({ role, text, code });
  if (!skipSave) localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  renderChatHistory();
}

function renderChatHistory() {
  const el = document.getElementById('chatHistory');
  if (!el) return;
  el.innerHTML = chatHistory.map(m => chatBubble(m.role, m.text, m.code)).join('');
  el.scrollTop = el.scrollHeight;
}

function chatBubble(role, text, code) {
  let cls = role === 'ai' ? 'ai' : 'user';
  let icon = role === 'ai' ? '🤖' : '🧑‍💻';
  let codeBlock = code ? `<pre class='bubble-code'><code>${escapeHtml(code)}</code><button class='copy-btn' type='button'>📋</button></pre>` : '';
  return `<div class='msg-bubble ${cls}'><span class='bubble-icon'>${icon}</span><span class='bubble-text'>${text}</span>${codeBlock}</div>`;
}

function setChatLoading(loading) {
  const el = document.getElementById('chatLoading');
  if (el) el.style.display = loading ? '' : 'none';
}

function showChatError(msg) {
  const el = document.getElementById('chatError');
  if (el) {
    el.textContent = msg;
    el.style.display = '';
    setTimeout(()=>{el.style.display='none';}, 4000);
  }
}

async function onChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  addChatMessage('user', escapeHtml(text));
  input.value = '';
  setChatLoading(true);
  try {
    // System command detection (Hebrew/English)
    const sysCmdPatterns = [
      /^הרץ פקודה (.+)/i,
      /^הפעל (.+)/i,
      /^מחק קובץ (.+)/i,
      /^צור תיקיה (.+)/i,
      /^פתח (.+)/i,
      /^run (.+)/i,
      /^open (.+)/i,
      /^delete (.+)/i,
      /^create (.+)/i,
      /^execute (.+)/i
    ];
    let matched = false;
    for (let pat of sysCmdPatterns) {
      const m = text.match(pat);
      if (m && m[1]) {
        matched = true;
        const cmd = m[1];
        addChatMessage('ai', `🛠️ מריץ פקודה: <b>${escapeHtml(cmd)}</b>...`);
        let output = await (window.electronAPI?.sendSystemCommand ? window.electronAPI.sendSystemCommand(cmd) : Promise.resolve('פלט דמו: ' + cmd));
        addChatMessage('ai', `<pre style="direction:ltr;text-align:left;">${escapeHtml(output)}</pre>`);
        break;
      }
    }
    if (!matched) {
      // Real OpenAI API integration if available
      let response = '';
      if (window.electronAPI?.askAI) {
        response = await window.electronAPI.askAI(text);
      } else {
        // Proactive, context-aware demo AI response
        response = getDemoAIResponse(text);
      }
      addChatMessage('ai', escapeHtml(response));
    }
  } catch (err) {
    showChatError('שגיאה: ' + escapeHtml(err.message || err));
  } finally {
    setChatLoading(false);
  }
}

function getDemoAIResponse(text) {
  const greetings = [
    'שלום! איך אפשר לעזור?',
    'היי, אשמח לסייע בכל שאלה או משימה!',
    'ברוך הבא למוח-על Supreme!'
  ];
  const help = [
    'אתה יכול לשאול אותי כל שאלה, לבקש קוד, או לשלוח קובץ לבדיקה.',
    'רוצה דוגמה לקוד? כתוב "כתוב קוד ב..." או שאל שאלה טכנית.',
    'אם תרצה להריץ פקודה – פשוט כתוב אותה בעברית או באנגלית.'
  ];
  const codeTemplates = [
    'הנה דוגמה לקוד ב-JavaScript שמדפיס "שלום עולם":\n<pre class="bubble-code"><code>console.log("שלום עולם");</code><button class="copy-btn" type="button">📋</button></pre>',
    'הנה קטע קוד בפייתון שמחשב סכום רשימה:\n<pre class="bubble-code"><code>numbers = [1,2,3]\nprint(sum(numbers))</code><button class="copy-btn" type="button">📋</button></pre>'
  ];
  const fileTemplates = [
    'קיבלתי את הקובץ! רוצה שאנתח אותו או שאשלח אותו הלאה?',
    'הקובץ התקבל. האם להציג תצוגה מקדימה או להריץ עליו פקודה?'
  ];
  const lower = text.toLowerCase();
  if (/שלום|היי|hi|hello/.test(lower)) return greetings[Math.floor(Math.random()*greetings.length)] + ' ' + help[Math.floor(Math.random()*help.length)];
  if (/קוד|code|function|פונקציה/.test(lower)) return codeTemplates[Math.floor(Math.random()*codeTemplates.length)];
  if (/קובץ|file|pdf|doc|csv|jpg|png/.test(lower)) return fileTemplates[Math.floor(Math.random()*fileTemplates.length)];
  if (/עזרה|help|מה אפשר/.test(lower)) return help[Math.floor(Math.random()*help.length)];
  // Fallback: echo with supportive message
  return '🤖 אני כאן לעזור! שאלת: "' + text + '". אשמח לסייע בכל נושא.';
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

window.renderChatUI = renderChatUI;
window.addChatMessage = addChatMessage;

// Auto-initialize chat panel on DOMContentLoaded (CSP-safe, no inline)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderChatUI === 'function') renderChatUI();
});

// Set up dark/light mode
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Set up accessibility features
const accessibilityFeatures = document.getElementById('accessibilityFeatures');
accessibilityFeatures.addEventListener('click', () => {
  // Toggle accessibility features
});

// Set up streaming-ready functionality
const streamingReady = document.getElementById('streamingReady');
streamingReady.addEventListener('click', () => {
  // Toggle streaming-ready functionality
});
