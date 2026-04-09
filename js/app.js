// EDS Platform Status Dashboard
// Fetches data/status.json and renders all sections with tab navigation

document.addEventListener('DOMContentLoaded', () => {
  // Tab navigation
  initTabs();

  // Load data
  fetch('data/status.json')
    .then(res => res.json())
    .then(data => {
      renderHero(data);
      renderTimeline(data.timeline);
      renderProgress(data.progress);
      renderDeliverables(data.deliverables);
      renderMeetings(data.process.meetings);
      renderProcess(data.process);
      renderTeam(data.team);
      renderKPIs(data.kpis);
      renderDecisions(data.decisions);
    })
    .catch(err => {
      console.error('Failed to load status data:', err);
      document.querySelector('.main').innerHTML =
        '<div style="padding:80px 24px;text-align:center;color:#6b7280;">' +
        '<p style="font-size:18px;margin-bottom:8px;">Could not load project data</p>' +
        '<p>If viewing locally, run from the <code>docs/</code> folder:</p>' +
        '<code style="display:block;margin:12px auto;font-size:14px;background:#f3f4f6;padding:8px 16px;border-radius:8px;max-width:300px;">python -m http.server 8000</code>' +
        '<p>Then open <a href="http://localhost:8000">http://localhost:8000</a></p></div>';
    });
});

// ===== Tab Navigation =====
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

      // Activate clicked
      tab.classList.add('active');
      const panelId = 'panel-' + tab.dataset.tab;
      const panel = document.getElementById(panelId);
      if (panel) {
        panel.classList.add('active');
        // Re-trigger animations
        panel.querySelectorAll('[style*="animation"]').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // force reflow
          el.style.animation = '';
        });
      }
    });
  });
}

// ===== Hero =====
function renderHero(data) {
  document.getElementById('hero-tagline').textContent = data.project.tagline;
  document.getElementById('last-updated').textContent = data.lastUpdated;

  const activePhase = data.timeline.phases.find(p => p.status === 'active');
  const totalItems = data.progress.categories.reduce((sum, c) => sum + c.items.length, 0);
  const doneItems = data.progress.categories.reduce((sum, c) => sum + c.items.filter(i => i.done).length, 0);

  const stats = document.getElementById('hero-stats');
  stats.innerHTML = `
    <div class="hero-stat">
      <div class="hero-stat-value">${activePhase ? activePhase.percentComplete + '%' : '—'}</div>
      <div class="hero-stat-label">${activePhase ? activePhase.name.split(' ')[0] + ' ' + activePhase.name.split(' ')[1] : 'Phase'} Progress</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${doneItems}/${totalItems}</div>
      <div class="hero-stat-label">Items Complete</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${data.deliverables.length}</div>
      <div class="hero-stat-label">Deliverables Shipped</div>
    </div>
    <div class="hero-stat">
      <div class="hero-stat-value">${data.team.length}</div>
      <div class="hero-stat-label">Team Members</div>
    </div>`;
}

// ===== Timeline =====
function renderTimeline(timeline) {
  const container = document.getElementById('timeline-container');
  container.innerHTML = timeline.phases.map(phase => {
    const statusClass = phase.status === 'active' ? 'timeline-item--active' :
                        phase.status === 'complete' ? 'timeline-item--complete' : '';
    const statusBadge = phase.status === 'active'
      ? '<span class="badge badge--amber"><span class="badge-dot"></span> In Progress</span>'
      : phase.status === 'complete'
      ? '<span class="badge badge--green">Complete</span>'
      : '<span class="badge badge--gray">Upcoming</span>';

    const highlights = phase.highlights.length > 0
      ? '<ul class="timeline-highlights">' + phase.highlights.map(h => `<li>${esc(h)}</li>`).join('') + '</ul>'
      : '';

    const remaining = phase.remaining.length > 0
      ? '<ul class="timeline-remaining">' + phase.remaining.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>'
      : '';

    const progressBar = phase.percentComplete > 0 ? `
      <div class="progress-track">
        <div class="progress-fill${phase.status === 'complete' ? ' progress-fill--green' : ''}" style="width:${phase.percentComplete}%"></div>
      </div>
      <div class="progress-pct">${phase.percentComplete}% complete</div>` : '';

    return `
      <div class="timeline-item ${statusClass}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-phase">${esc(phase.name)}</span>
            ${statusBadge}
          </div>
          <div class="timeline-dates">${esc(phase.weeks)} — ${esc(phase.dates)}</div>
          <div class="timeline-goal">${esc(phase.goal)}</div>
          ${progressBar}
          ${highlights}
          ${remaining}
        </div>
      </div>`;
  }).join('');
}

// ===== Progress =====
function renderProgress(progress) {
  document.getElementById('progress-summary').textContent = progress.summary;

  // Overall progress bar
  const totalItems = progress.categories.reduce((sum, c) => sum + c.items.length, 0);
  const doneItems = progress.categories.reduce((sum, c) => sum + c.items.filter(i => i.done).length, 0);
  const overallPct = Math.round((doneItems / totalItems) * 100);

  document.getElementById('overall-progress').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <span class="overall-label">Overall Phase 1 Progress</span>
      <span class="overall-pct">${overallPct}%</span>
    </div>
    <div class="overall-track">
      <div class="overall-fill" style="width:${overallPct}%"></div>
    </div>
    <div class="progress-pct">${doneItems} of ${totalItems} items complete</div>`;

  // Category cards
  const iconMap = { infra: '🏗️', backend: '⚙️', frontend: '🎨', database: '🗄️' };
  const container = document.getElementById('progress-container');
  container.innerHTML = progress.categories.map(cat => {
    const done = cat.items.filter(i => i.done).length;
    const total = cat.items.length;
    const pct = Math.round((done / total) * 100);
    const icon = iconMap[cat.icon] || '📦';

    const items = cat.items.map(item => {
      const cls = item.done ? 'checklist-item--done' : 'checklist-item--pending';
      return `<li class="checklist-item ${cls}">${esc(item.text)}</li>`;
    }).join('');

    return `
      <div class="progress-card">
        <div class="progress-card-header">
          <span class="progress-card-title">
            <span class="progress-card-icon progress-card-icon--${cat.icon}">${icon}</span>
            ${esc(cat.name)}
          </span>
          <span class="progress-card-count">${done}/${total}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <ul class="checklist">${items}</ul>
      </div>`;
  }).join('');
}

// ===== Deliverables =====
function renderDeliverables(deliverables) {
  const container = document.getElementById('deliverables-container');
  container.innerHTML = deliverables.map(d => `
    <div class="deliverable">
      <div class="deliverable-dot${d.type === 'milestone' ? ' deliverable-dot--milestone' : ''}"></div>
      <div class="deliverable-card">
        <div class="deliverable-top">
          <span class="deliverable-date">${esc(d.date)}</span>
          <span class="badge ${d.type === 'milestone' ? 'badge--purple' : 'badge--blue'}">${esc(d.type)}</span>
        </div>
        <div class="deliverable-title">${esc(d.title)}</div>
        <div class="deliverable-desc">${esc(d.description)}</div>
      </div>
    </div>`).join('');
}

// ===== Meetings =====
function renderMeetings(meetings) {
  const container = document.getElementById('meetings-container');
  container.innerHTML = meetings.map(m => `
    <div class="meeting-card">
      <div class="meeting-card-top">
        <div class="meeting-name">${esc(m.name)}</div>
        <div class="meeting-freq">${esc(m.frequency)}</div>
      </div>
      <div class="meeting-card-body">
        <div class="meeting-purpose">${esc(m.purpose)}</div>
        <div class="meeting-meta">
          <div class="meeting-meta-item">
            <span class="meeting-meta-label">Who: </span>
            <span class="meeting-meta-value">${esc(m.participants)}</span>
          </div>
          ${m.nextDate ? `
          <div class="meeting-meta-item">
            <span class="meeting-meta-label">Next: </span>
            <span class="meeting-meta-value">${esc(m.nextDate)}</span>
          </div>` : ''}
        </div>
      </div>
    </div>`).join('');
}

// ===== Process =====
function renderProcess(process) {
  document.getElementById('process-methodology').textContent = process.methodology;

  const icons = { compass: '🧭', rocket: '🚀', cpu: '🤖' };
  const container = document.getElementById('process-layers');
  container.innerHTML = process.layers.map(layer => `
    <div class="process-card" style="--card-color: ${layer.color}">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${layer.color};border-radius:var(--radius) var(--radius) 0 0;"></div>
      <div class="process-card-icon">${icons[layer.icon] || '📋'}</div>
      <div class="process-card-name">${esc(layer.name)}</div>
      <div class="process-card-desc">${esc(layer.description)}</div>
    </div>`).join('');
}

// ===== Team =====
function renderTeam(team) {
  const colors = ['#1a56db', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2'];
  const container = document.getElementById('team-container');
  container.innerHTML = team.map((person, i) => `
    <div class="team-card">
      <div class="team-avatar" style="background:${colors[i % colors.length]}">${esc(person.avatar)}</div>
      <div>
        <div class="team-name">${esc(person.name)}</div>
        <div class="team-role">${esc(person.role)}</div>
        <div class="team-focus">${esc(person.org)} — ${esc(person.focus)}</div>
      </div>
    </div>`).join('');
}

// ===== KPIs =====
function renderKPIs(kpis) {
  const icons = { clock: '⏱️', truck: '🚛', chart: '📈', users: '👥', zap: '⚡' };
  const container = document.getElementById('kpi-container');
  container.innerHTML = kpis.map(kpi => `
    <div class="kpi-card">
      <div class="kpi-icon">${icons[kpi.icon] || '📊'}</div>
      <div class="kpi-metric">${esc(kpi.metric)}</div>
      <div class="kpi-current">${esc(kpi.current)}</div>
      <div class="kpi-arrow">↓</div>
      <div class="kpi-target">${esc(kpi.target)}</div>
    </div>`).join('');
}

// ===== Decisions =====
function renderDecisions(decisions) {
  const container = document.getElementById('decisions-container');
  container.innerHTML = decisions.map(d => `
    <div class="decision-card">
      <div>
        <span class="decision-id">${esc(d.id)}</span>
      </div>
      <div>
        <div class="decision-title">${esc(d.title)}</div>
        <div class="decision-date">${esc(d.date)} — ${esc(d.status)}</div>
      </div>
    </div>`).join('');
}

// ===== Helpers =====
function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
