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
      if (data.plan) renderPlan(data.plan);
      if (data.hours) renderHours(data.hours);
      if (data.dataInsights) renderInsights(data.dataInsights);
      if (data.architecture) renderArchitecture(data.architecture);
      if (data.integrations) renderIntegrations(data.integrations);
      if (data.glossary) renderGlossary(data.glossary);
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
  container.innerHTML = team.map((person, i) => {
    const knowledge = person.domainKnowledge
      ? `<div class="team-knowledge"><span class="team-meta-label">Domain</span> ${esc(person.domainKnowledge)}</div>` : '';
    const focus = person.currentFocus
      ? `<div class="team-focus-detail"><span class="team-meta-label">Now</span> ${esc(person.currentFocus)}</div>` : '';
    return `
    <div class="team-card">
      <div class="team-avatar" style="background:${colors[i % colors.length]}">${esc(person.avatar)}</div>
      <div class="team-body">
        <div class="team-name">${esc(person.name)}</div>
        <div class="team-role">${esc(person.role)}</div>
        <div class="team-focus">${esc(person.org)} — ${esc(person.focus)}</div>
        ${knowledge}
        ${focus}
      </div>
    </div>`;
  }).join('');
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

// ===== Plan (from xlsx tracker + reality overrides) =====
const planFilter = {
  phase: 'all',
  sprint: 'all',
  category: 'all',
  status: 'all',
  search: ''
};
let planDataCache = null;

function renderPlan(plan) {
  planDataCache = plan;
  const toolbar = document.getElementById('plan-toolbar');

  const phaseChips = ['all', ...plan.phases.map(p => String(p.id))];
  const sprintChips = ['all', ...plan.sprints.map(s => String(s.id))];
  const categoryChips = ['all', ...plan.categories];
  const statusChips = ['all', ...plan.statuses.map(s => s.key)];

  const chipGroup = (label, key, options, labels) => `
    <div class="chip-group">
      <span class="chip-group-label">${esc(label)}</span>
      <div class="chips">
        ${options.map((o, i) => `
          <button class="chip${planFilter[key] === o ? ' chip--active' : ''}" data-key="${key}" data-val="${esc(o)}">
            ${esc(labels ? labels[i] : (o === 'all' ? 'All' : o))}
          </button>`).join('')}
      </div>
    </div>`;

  const sprintLabels = sprintChips.map(s => s === 'all' ? 'All' : `S${s}`);

  toolbar.innerHTML = `
    ${chipGroup('Phase', 'phase', phaseChips, phaseChips.map(p => p === 'all' ? 'All' : 'Phase ' + p))}
    ${chipGroup('Sprint', 'sprint', sprintChips, sprintLabels)}
    ${chipGroup('Category', 'category', categoryChips)}
    ${chipGroup('Status', 'status', statusChips)}
    <div class="plan-search-wrap">
      <input type="text" id="plan-search" class="plan-search" placeholder="Search work items..." value="${esc(planFilter.search)}">
    </div>`;

  toolbar.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      planFilter[k] = btn.dataset.val;
      renderPlan(plan);
    });
  });
  document.getElementById('plan-search').addEventListener('input', e => {
    planFilter.search = e.target.value;
    renderPlanRows();
  });

  renderPlanRows();
}

function renderPlanRows() {
  if (!planDataCache) return;
  const plan = planDataCache;
  const tbody = document.getElementById('plan-tbody');
  const empty = document.getElementById('plan-empty');
  const statusByKey = Object.fromEntries(plan.statuses.map(s => [s.key, s.color]));

  const search = planFilter.search.trim().toLowerCase();

  const rows = plan.items.filter(item => {
    if (planFilter.phase !== 'all' && String(item.phase) !== planFilter.phase) return false;
    if (planFilter.sprint !== 'all' && String(item.sprint) !== planFilter.sprint) return false;
    if (planFilter.category !== 'all' && item.category !== planFilter.category) return false;
    if (planFilter.status !== 'all' && item.actualStatus !== planFilter.status) return false;
    if (search && !item.workItem.toLowerCase().includes(search) && !item.id.toLowerCase().includes(search)) return false;
    return true;
  });

  if (rows.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  tbody.innerHTML = rows.map(item => {
    if (item.isMilestone) {
      return `
        <tr class="plan-gate">
          <td colspan="6">
            <span class="plan-gate-badge">Phase ${item.phase} Gate</span>
            <span class="plan-gate-title">${esc(item.workItem)}</span>
            <span class="plan-gate-comment">${esc(item.comments)}</span>
          </td>
        </tr>`;
    }

    const color = statusByKey[item.actualStatus] || 'gray';
    const drift = item.actualStatus !== item.trackerStatus;
    const tooltip = drift ? `Tracker: ${item.trackerStatus}` : item.actualStatus;
    const driftMark = drift ? '<span class="status-drift" title="Reality is ahead of the tracker">↑</span>' : '';
    const note = item.overrideNote ? `<div class="plan-note">${esc(item.overrideNote)}</div>` : '';
    const comments = item.comments ? `<div class="plan-comment">${esc(item.comments)}</div>` : '';

    return `
      <tr class="plan-row">
        <td class="plan-col-id"><code>${esc(item.id)}</code></td>
        <td class="plan-col-sprint">P${item.phase}·S${item.sprint}</td>
        <td class="plan-col-cat"><span class="cat-pill cat-${categorySlug(item.category)}">${esc(item.category)}</span></td>
        <td class="plan-col-item">${esc(item.workItem)}</td>
        <td class="plan-col-status">
          <span class="status-badge status-${color}" title="${esc(tooltip)}">
            ${esc(item.actualStatus)}${driftMark}
          </span>
        </td>
        <td class="plan-col-comments">${comments}${note}</td>
      </tr>`;
  }).join('');
}

function categorySlug(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ===== Hours =====
function renderHours(hours) {
  const container = document.getElementById('hours-container');
  container.innerHTML = hours.roles.map(role => {
    const pctUsed = role.allocated > 0 ? Math.round((role.used / role.allocated) * 100) : 0;
    const sparkMax = Math.max(1, ...role.perSprint, role.allocated / 4);
    const w = 280, h = 80, gap = 4, n = role.perSprint.length;
    const barW = (w - gap * (n - 1)) / n;
    const phaseSplitX = (4 * (barW + gap)) - gap / 2;
    const bars = role.perSprint.map((v, i) => {
      const bh = sparkMax > 0 ? (v / sparkMax) * (h - 18) : 0;
      const x = i * (barW + gap);
      const y = h - bh - 14;
      const filled = v > 0;
      return `
        <g>
          <rect x="${x}" y="${y}" width="${barW}" height="${bh}" rx="2" class="${filled ? 'spark-bar spark-bar--filled' : 'spark-bar'}"/>
          <text x="${x + barW/2}" y="${h - 2}" class="spark-label">S${i+1}</text>
          ${filled ? `<text x="${x + barW/2}" y="${y - 2}" class="spark-value">${v}</text>` : ''}
        </g>`;
    }).join('');

    return `
      <div class="hours-card">
        <div class="hours-card-header">
          <div class="hours-role">${esc(role.name)}</div>
          <div class="hours-pct">${pctUsed}% used</div>
        </div>
        <div class="hours-stats">
          <div class="hours-stat"><span class="hours-stat-label">Allocated</span><span class="hours-stat-value">${role.allocated} h</span></div>
          <div class="hours-stat"><span class="hours-stat-label">Used</span><span class="hours-stat-value">${role.used} h</span></div>
          <div class="hours-stat"><span class="hours-stat-label">Remaining</span><span class="hours-stat-value">${role.remaining} h</span></div>
        </div>
        <div class="hours-bar">
          <div class="hours-bar-fill" style="width:${Math.min(100, pctUsed)}%"></div>
        </div>
        <svg class="hours-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          <line x1="${phaseSplitX}" y1="0" x2="${phaseSplitX}" y2="${h - 14}" class="spark-divider"/>
          ${bars}
        </svg>
        <div class="hours-spark-legend">
          <span>Phase 1 (S1–S4)</span>
          <span>Phase 2 (S5–S8)</span>
        </div>
      </div>`;
  }).join('');
}

// ===== Insights =====
function renderInsights(d) {
  document.getElementById('insights-summary').textContent = d.summary;
  document.getElementById('insights-source-path').textContent = d.source || '';

  const metrics = document.getElementById('insights-metrics');
  metrics.innerHTML = d.metrics.map(m => `
    <div class="insight-metric insight-tone-${m.tone || 'neutral'}">
      <div class="insight-value">${esc(m.value)}</div>
      <div class="insight-label">${esc(m.label)}</div>
      ${m.hint ? `<div class="insight-hint">${esc(m.hint)}</div>` : ''}
    </div>`).join('');

  const mode = document.getElementById('insights-mode');
  mode.innerHTML = barRows(d.modeSplit.map(m => ({
    label: m.mode, value: m.share, suffix: '%',
    extra: `${m.ordersPerWeek}/wk · ${m.avgPrice} · ${m.marginPct}% margin`
  })));

  const dir = document.getElementById('insights-direction');
  dir.innerHTML = barRows(d.directionSplit.map(x => ({
    label: x.direction, value: x.share, suffix: '%',
    extra: `${x.ordersPerWeek}/wk · ${x.note}`
  })));

  const cust = document.getElementById('insights-customers');
  cust.innerHTML = barRows(d.customerConcentration.map(c => ({
    label: c.name, value: c.share, suffix: '%',
    extra: `${c.ordersPerWeek}/wk · ${c.pattern}`
  })));

  const carriers = document.getElementById('insights-carriers');
  const cq = d.carrierContactQuality;
  const cqRows = [
    { label: 'Has email',          value: cq.withEmail.pct,   suffix: '%', extra: `${cq.withEmail.count}/703 — critical Email RFQ gap`,   tone: 'warn' },
    { label: 'Has phone',          value: cq.withPhone.pct,   suffix: '%', extra: `${cq.withPhone.count}/703 — backup channel`,           tone: 'neutral' },
    { label: 'Has named contact',  value: cq.withContact.pct, suffix: '%', extra: `${cq.withContact.count}/703 — useful for personalized RFQs`, tone: 'warn' },
    { label: 'No contact info',    value: cq.noContact.pct,   suffix: '%', extra: `${cq.noContact.count}/703 — needs enrichment`,         tone: 'warn' }
  ];
  carriers.innerHTML = barRows(cqRows);

  const ron = document.getElementById('insights-ron');
  ron.innerHTML = barRows(d.ronCorridor.map(r => ({
    label: r.corridor, value: r.ordersPerWeek, suffix: '/wk',
    extra: `${r.avgPrice} · ${r.note}`,
    max: 60
  })));
}

function barRows(rows) {
  const max = Math.max(...rows.map(r => r.max || r.value || 0), 1);
  return rows.map(r => `
    <div class="bar-row${r.tone ? ' bar-tone-' + r.tone : ''}">
      <div class="bar-label">${esc(r.label)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.min(100, (r.value / max) * 100)}%"></div>
        <span class="bar-value">${esc(r.value + (r.suffix || ''))}</span>
      </div>
      ${r.extra ? `<div class="bar-extra">${esc(r.extra)}</div>` : ''}
    </div>`).join('');
}

// ===== Architecture =====
function renderArchitecture(arch) {
  document.getElementById('arch-summary').textContent = arch.summary || '';

  const principles = document.getElementById('arch-principles');
  principles.innerHTML = (arch.principles || []).map(p => `<li>${esc(p)}</li>`).join('');

  const meta = document.getElementById('arch-data-meta');
  if (arch.dataModel) {
    meta.innerHTML = `${esc(arch.dataModel.engine)} · ${arch.dataModel.tableCount} tables<br><small>${esc(arch.dataModel.moneyNote || '')}</small>`;
  }
  const tablesEl = document.getElementById('arch-tables');
  if (arch.dataModel && arch.dataModel.tables) {
    tablesEl.innerHTML = arch.dataModel.tables.map(t => `
      <li><code>${esc(t.name)}</code> <span class="arch-table-purpose">${esc(t.purpose)}</span></li>`).join('');
  }

  const links = document.getElementById('arch-links');
  links.innerHTML = (arch.links || []).map(l => `
    <a class="arch-link" href="${esc(l.path)}" target="_blank" rel="noopener">
      <span class="arch-link-label">${esc(l.label)}</span>
      <code class="arch-link-path">${esc(l.path)}</code>
    </a>`).join('');
}

// ===== Integrations =====
function renderIntegrations(integrations) {
  const container = document.getElementById('integrations-container');
  const statusOrder = { live: 0, 'in-progress': 1, parallel: 2, planned: 3, blocked: 4 };
  const sorted = [...integrations].sort((a, b) =>
    (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));
  container.innerHTML = sorted.map(i => `
    <div class="integration-card int-${i.status}">
      <div class="integration-top">
        <div class="integration-name">${esc(i.name)}</div>
        <span class="integration-badge int-badge-${i.status}">${esc(i.status)}</span>
      </div>
      <div class="integration-purpose">${esc(i.purpose)}</div>
      <div class="integration-meta">
        <span class="integration-phase">Phase ${i.phase}</span>
        ${i.notes ? `<span class="integration-notes">${esc(i.notes)}</span>` : ''}
      </div>
      ${i.docs ? `<a class="integration-docs" href="../${esc(i.docs)}" target="_blank" rel="noopener">${esc(i.docs)}</a>` : ''}
    </div>`).join('');
}

// ===== Glossary =====
let glossaryCache = null;
function renderGlossary(glossary) {
  glossaryCache = glossary;
  document.getElementById('glossary-count').textContent = glossary.length;
  const search = document.getElementById('glossary-search');
  if (search) {
    search.addEventListener('input', () => renderGlossaryGroups(search.value));
  }
  renderGlossaryGroups('');
}

function renderGlossaryGroups(query) {
  if (!glossaryCache) return;
  const q = (query || '').trim().toLowerCase();
  const filtered = q
    ? glossaryCache.filter(e =>
        e.term.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q))
    : glossaryCache;

  const groups = {};
  filtered.forEach(e => {
    const g = e.group || 'General';
    (groups[g] = groups[g] || []).push(e);
  });

  const container = document.getElementById('glossary-container');
  if (Object.keys(groups).length === 0) {
    container.innerHTML = '<div class="glossary-empty">No matches.</div>';
    return;
  }
  container.innerHTML = Object.entries(groups).map(([group, terms]) => `
    <div class="glossary-group">
      <h4 class="glossary-group-title">${esc(group)} <span class="glossary-group-count">${terms.length}</span></h4>
      <dl class="glossary-list">
        ${terms.map(t => `
          <div class="glossary-row">
            <dt class="glossary-term">${esc(t.term)}</dt>
            <dd class="glossary-def">${esc(t.definition)}</dd>
          </div>`).join('')}
      </dl>
    </div>`).join('');
}

// ===== Helpers =====
function esc(str) {
  if (str === null || str === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}
