(async () => {
  const res = await fetch('dashboard-data.json');
  const data = await res.json();
  let { meta, teamMembers, tagups, tasks, rfis, risks, tfr } = data;
  let activeMemberId = meta.activeMemberId;

  const memberSelect = document.getElementById('memberSelect');
  teamMembers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    memberSelect.appendChild(opt);
  });
  memberSelect.value = activeMemberId;
  memberSelect.addEventListener('change', () => {
    activeMemberId = memberSelect.value;
    renderCurrent();
  });

  // navigation click handlers
  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('click', ev => {
      ev.preventDefault();
      const hash = a.getAttribute('href');
      window.location.hash = hash;
      renderCurrent();
    });
  });

  let taskSortKey = null;
  let taskSortAsc = true;

  function sortTasks(list) {
    if (!taskSortKey) return list;
    return list.slice().sort((a, b) => {
      let va = a[taskSortKey];
      let vb = b[taskSortKey];
      if (taskSortKey === 'dueISO') {
        va = new Date(va);
        vb = new Date(vb);
      } else {
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
      }
      if (va < vb) return taskSortAsc ? -1 : 1;
      if (va > vb) return taskSortAsc ? 1 : -1;
      return 0;
    });
  }

  function renderDashboard() {
    const memberTasks = tasks.filter(t => t.ownerId === activeMemberId);
    const openCount = memberTasks.filter(t => t.status !== 'Complete').length;
    const rfiCount = rfis.filter(r => r.ownerId === activeMemberId).length;
    const riskCount = risks.filter(r => r.ownerId === activeMemberId).length;
    const avgTFR = tfr.length ? Math.round(tfr.reduce((s, r) => s + r.progress, 0) / tfr.length) : 0;
    document.getElementById('app').innerHTML = `
      <div class="kpi-row">
        <div class="kpi"><div class="num">${openCount}</div><div>Open Tasks</div></div>
        <div class="kpi"><div class="num">${rfiCount}</div><div>Open RFIs</div></div>
        <div class="kpi"><div class="num">${riskCount}</div><div>Open Risks</div></div>
        <div class="kpi"><div class="num">${avgTFR}%</div><div>Avg TFR Progress</div></div>
      </div>
    `;
  }

  function renderTasks() {
    const memberTasks = tasks.filter(t => t.ownerId === activeMemberId);
    const sorted = sortTasks(memberTasks);
    const rows = sorted.map(t => `
      <div class="tr">
        <div>${t.title}</div>
        <div>${teamMembers.find(m => m.id === t.ownerId).name}</div>
        <div>${t.dueISO}</div>
        <div>${t.priority}</div>
        <div>${t.status}</div>
      </div>
    `).join('');
    document.getElementById('app').innerHTML = `
      <div class="table">
        <div class="tr header">
          <div data-key="title">Title</div>
          <div>Owner</div>
          <div data-key="dueISO">Due</div>
          <div data-key="priority">Priority</div>
          <div data-key="status">Status</div>
        </div>
        ${rows}
      </div>
    `;
    document.querySelectorAll('.header div[data-key]').forEach(h => {
      h.style.cursor = 'pointer';
      h.addEventListener('click', () => {
        const key = h.getAttribute('data-key');
        if (taskSortKey === key) {
          taskSortAsc = !taskSortAsc;
        } else {
          taskSortKey = key;
          taskSortAsc = true;
        }
        renderTasks();
      });
    });
  }

  function renderTagup() {
    if (!tagups.length) {
      document.getElementById('app').innerHTML = '<p>No tag-up data available.</p>';
    } else {
      const t = tagups[tagups.length - 1];
      document.getElementById('app').innerHTML = `
        <h3>Daily Tag-Up (${t.dateISO})</h3>
        <p><strong>Yesterday:</strong> ${t.yesterdayText}</p>
        <p><strong>Today:</strong> ${t.todayText}</p>
        <p><strong>Risks:</strong> ${t.risksText}</p>
      `;
    }
  }

  function renderRFIs() {
    const memberRFIs = rfis.filter(r => r.ownerId === activeMemberId);
    if (!memberRFIs.length) {
      document.getElementById('app').innerHTML = '<p>No RFIs data available.</p>';
    } else {
      const rows = memberRFIs.map(r => `<div class="tr"><div>${r.title}</div><div>${r.status}</div></div>`).join('');
      document.getElementById('app').innerHTML = rows;
    }
  }

  function renderRisks() {
    const memberRisks = risks.filter(r => r.ownerId === activeMemberId);
    if (!memberRisks.length) {
      document.getElementById('app').innerHTML = '<p>No risks data available.</p>';
    } else {
      const rows = memberRisks.map(r => `<div class="tr"><div>${r.title}</div><div>${r.status}</div></div>`).join('');
      document.getElementById('app').innerHTML = rows;
    }
  }

  function renderTfr() {
    if (!tfr.length) {
      document.getElementById('app').innerHTML = '<p>No TFR data available.</p>';
    } else {
      const rows = tfr.map(r => `<div class="tr"><div>${r.site} ${r.building}</div><div>${r.phase}</div><div>${r.progress}%</div></div>`).join('');
      document.getElementById('app').innerHTML = rows;
    }
  }

  function renderCurrent() {
    const hash = window.location.hash || '#/dashboard';
    switch (hash) {
      case '#/tasks':
        renderTasks();
        break;
      case '#/tagup':
        renderTagup();
        break;
      case '#/rfis':
        renderRFIs();
        break;
      case '#/risks':
        renderRisks();
        break;
      case '#/tfr':
        renderTfr();
        break;
      default:
        renderDashboard();
    }
  }

  window.addEventListener('hashchange', renderCurrent);
  renderCurrent();
})();
