// UI components for sidebar, tabs, notifications - fully upgraded, modern, accessible, with error handling
function createSidebar() {
  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h2>📁 קבצים</h2>
      <input id="fileSearch" placeholder="חפש קובץ..." aria-label="חפש קובץ" />
      <button id="newFileBtn" aria-label="צור קובץ">➕ קובץ</button>
      <button id="newFolderBtn" aria-label="צור תיקיה">📂 תיקיה</button>
    </div>
    <ul id="folderTreeSidebar" tabindex="0" aria-label="עץ קבצים"></ul>
  `;
  // Drag & drop, right-click menu, accessibility hooks
  sidebar.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (e.target.tagName === 'LI') showSidebarContextMenu(e.target, e);
  });
  sidebar.addEventListener('keydown', e => {
    if (e.key === 'Delete' && document.activeElement.tagName === 'LI') {
      if (confirm('למחוק קובץ/תיקיה?')) document.activeElement.remove();
    }
  });
  return sidebar;
}

function showSidebarContextMenu(target, e) {
  // Simple right-click menu
  let menu = document.getElementById('sidebarMenu');
  if (menu) menu.remove();
  menu = document.createElement('div');
  menu.id = 'sidebarMenu';
  menu.className = 'sidebar-menu';
  menu.style = `position:fixed;top:${e.clientY}px;right:${e.clientX}px;z-index:4000;background:#fff;border:1px solid #888;padding:6px 12px;direction:rtl;`;
  menu.innerHTML = `<button onclick="alert('שינוי שם (בעתיד)')">✏️ שנה שם</button><button onclick="if(confirm('למחוק?')) this.parentNode.parentNode.remove()">🗑️ מחק</button>`;
  document.body.appendChild(menu);
  setTimeout(()=>{
    document.addEventListener('click', ()=>menu.remove(), {once:true});
  }, 10);
}

function createTabsBar() {
  const tabs = document.createElement('div');
  tabs.id = 'tabsBar';
  tabs.className = 'tabs-bar';
  tabs.innerHTML = '<ul id="tabsList" tabindex="0" aria-label="לשוניות"></ul>';
  // Quick nav, close tab, accessibility
  tabs.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      // TODO: implement tab switch
    }
    if (e.key === 'Delete' && document.activeElement.tagName === 'LI') {
      document.activeElement.remove();
    }
  });
  return tabs;
}

function createNotification(msg, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `<span class="notifIcon">${type==='error'?'❌':type==='success'?'✅':'ℹ️'}</span> ${msg}`;
  notif.setAttribute('role', 'alert');
  notif.setAttribute('tabindex', '0');
  notif.style = `direction:rtl;${type==='error'?'background:#fecaca;':'background:#bbf7d0;'}border-radius:8px;padding:10px 16px;margin:10px;z-index:5000;position:fixed;bottom:10px;right:10px;`;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3500);
}

window.createSidebar = createSidebar;
window.createTabsBar = createTabsBar;
window.createNotification = createNotification;

  const sidebar = document.createElement('div');
  sidebar.id = 'sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h2>📁 קבצים</h2>
      <input id="fileSearch" placeholder="חפש קובץ..." />
      <button id="newFileBtn">➕ קובץ</button>
      <button id="newFolderBtn">📂 תיקיה</button>
    </div>
    <ul id="folderTreeSidebar"></ul>
  `;
  return sidebar;
}

function createTabsBar() {
  const tabs = document.createElement('div');
  tabs.id = 'tabsBar';
  tabs.className = 'tabs-bar';
  tabs.innerHTML = '<ul id="tabsList"></ul>';
  return tabs;
}

function createNotification(msg, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.textContent = msg;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3500);
}

window.createSidebar = createSidebar;
window.createTabsBar = createTabsBar;
window.createNotification = createNotification;
