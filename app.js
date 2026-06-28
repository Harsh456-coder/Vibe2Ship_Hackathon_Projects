/**
 * app.js — Community Hero
 *
 * All interactivity and rendering logic.
 * Reads data from data.js (loaded before this file).
 *
 * Sections:
 *   1. State
 *   2. Page navigation
 *   3. Dashboard — issue rendering & filters
 *   4. Detail panel (right sidebar)
 *   5. Map page
 *   6. Impact page
 *   7. Leaderboard page
 *   8. Report modal (3-step wizard)
 *   9. Toast notifications
 *  10. Init (runs on page load)
 */

"use strict";

/* ── 1. STATE ───────────────────────────────────────────────── */
const state = {
  selectedIssueId: 0,   // which issue card is highlighted
  catFilter:  "all",    // sidebar category filter
  statFilter: "all",    // sidebar status filter
  quickFilter: "all",   // top pills: all | near | critical | verified
  modalStep: 0,         // 0 | 1 | 2
  xp: 1240,
  chartInstance: null   // Chart.js ref (prevent duplicate creation)
};

/* ── 2. PAGE NAVIGATION ─────────────────────────────────────── */
/**
 * Switch the visible page and highlight the correct nav tab.
 * Also lazy-renders the page content the first time it's visited.
 */
function goPage(pageId) {
  // Hide all pages, deactivate all tabs
  document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
  document.querySelectorAll(".ntab").forEach(t => t.classList.remove("on"));

  // Show chosen page + mark its tab
  document.getElementById("page-" + pageId).classList.add("on");
  document.querySelector(`.ntab[data-page="${pageId}"]`).classList.add("on");

  // Lazy render pages that need JS to build their content
  if (pageId === "map")    renderMap();
  if (pageId === "impact") renderImpact();
  if (pageId === "lb")     renderLeaderboard();
}

// Wire up nav tab clicks
document.querySelectorAll(".ntab").forEach(tab => {
  tab.addEventListener("click", () => goPage(tab.dataset.page));
});

/* ── 3. DASHBOARD — ISSUE RENDERING & FILTERS ──────────────── */

/** Return the subset of ISSUES matching current filter state */
function getFilteredIssues() {
  return ISSUES.filter(issue => {
    if (state.catFilter  !== "all" && issue.cat    !== state.catFilter)  return false;
    if (state.statFilter !== "all" && issue.status !== state.statFilter) return false;
    if (state.quickFilter === "critical" && issue.severity !== "Critical") return false;
    if (state.quickFilter === "verified" && issue.verified < issue.needed) return false;
    if (state.quickFilter === "near"     && parseFloat(issue.dist) > 1)    return false;
    return true;
  });
}

/** Build HTML for one issue card */
function issueCardHTML(issue) {
  const statusMap   = { open: "s-open", "in-progress": "s-prog", resolved: "s-done" };
  const statusLabel = { open: "Open",   "in-progress": "In Progress", resolved: "Resolved" };
  const isSelected  = state.selectedIssueId === issue.id;
  const isVoted     = issue._voted;

  return `
    <div class="icard${isSelected ? " sel" : ""}"
         role="article"
         aria-label="${issue.title}"
         data-id="${issue.id}">
      <div class="icard-top">
        <div>
          <div class="icard-title">${issue.title}</div>
          <div class="icard-meta">
            <span><i class="ti ti-map-pin"></i>${issue.dist}</span>
            <span><i class="ti ti-clock"></i>${issue.age}</span>
            <span><i class="ti ti-camera"></i>${issue.media}</span>
            <span><i class="ti ti-alert-triangle"></i>${issue.severity}</span>
          </div>
        </div>
        <span class="sbadge ${statusMap[issue.status]}">${statusLabel[issue.status]}</span>
      </div>
      <div class="icard-bot">
        <div class="tags">
          <span class="tag">${issue.catLabel}</span>
          <span class="tag tag-ai">AI: ${issue.ai}%</span>
          ${issue.verified >= issue.needed
            ? '<span class="tag tag-escalated">Auto-escalated</span>'
            : ""}
        </div>
        <div class="icard-actions">
          <button class="act-btn${isVoted ? " voted" : ""}" data-vote="${issue.id}" aria-label="Upvote">
            <i class="ti ti-thumb-up"></i>
            <span id="v${issue.id}">${issue.votes}</span>
          </button>
          <button class="act-btn" aria-label="Comments">
            <i class="ti ti-message"></i> ${issue.comments}
          </button>
        </div>
      </div>
    </div>`;
}

/** Re-render the entire issue list and refresh the detail panel */
function renderIssues() {
  const list = document.getElementById("issues-list");
  const filtered = getFilteredIssues();

  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state">
      <i class="ti ti-mood-sad"></i>
      No issues match this filter
    </div>`;
    return;
  }

  list.innerHTML = filtered.map(issueCardHTML).join("");

  // Wire card click → select issue
  list.querySelectorAll(".icard").forEach(card => {
    card.addEventListener("click", () => {
      state.selectedIssueId = parseInt(card.dataset.id);
      renderIssues();
    });
  });

  // Wire vote button clicks
  list.querySelectorAll("[data-vote]").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation(); // don't also select the card
      handleVote(parseInt(btn.dataset.vote));
    });
  });

  renderDetail(state.selectedIssueId);
}

/** Toggle upvote on an issue */
function handleVote(id) {
  const issue = ISSUES.find(x => x.id === id);
  issue._voted = !issue._voted;
  issue.votes += issue._voted ? 1 : -1;

  // Re-render just the vote button without full re-render for performance
  const span = document.getElementById("v" + id);
  const btn  = document.querySelector(`[data-vote="${id}"]`);
  if (span) span.textContent = issue.votes;
  if (btn)  btn.classList.toggle("voted", issue._voted);

  if (issue._voted) showToast("+5 XP earned for verifying!", "ti-bolt");
}

// ── Sidebar category filters
document.querySelectorAll(".sitem[data-cat]").forEach(item => {
  item.addEventListener("click", () => {
    state.catFilter  = item.dataset.cat;
    state.statFilter = "all";
    document.querySelectorAll(".sitem").forEach(s => s.classList.remove("on"));
    item.classList.add("on");
    const label = item.querySelector(".sitem-l").textContent.trim();
    document.getElementById("feed-title").textContent =
      state.catFilter === "all" ? "All Issues in Ward 12" : label + " Issues";
    renderIssues();
  });
});

// ── Sidebar status filters
document.querySelectorAll(".sitem[data-stat]").forEach(item => {
  item.addEventListener("click", () => {
    state.statFilter = item.dataset.stat;
    state.catFilter  = "all";
    document.querySelectorAll(".sitem").forEach(s => s.classList.remove("on"));
    item.classList.add("on");
    renderIssues();
  });
});

// ── Top quick-filter pills
document.querySelectorAll(".fpill").forEach(pill => {
  pill.addEventListener("click", () => {
    state.quickFilter = pill.dataset.filter;
    document.querySelectorAll(".fpill").forEach(p => p.classList.remove("on"));
    pill.classList.add("on");
    renderIssues();
  });
});

/* ── 4. DETAIL PANEL ────────────────────────────────────────── */

/** Populate the right-hand panel with the selected issue's details */
function renderDetail(id) {
  const issue = ISSUES.find(x => x.id === id);
  if (!issue) return;

  document.getElementById("dp-title").textContent = issue.title;
  document.getElementById("dp-cat").textContent =
    `${issue.catLabel} · Severity: ${issue.severity} · AI ${issue.ai}% confidence`;

  // Verification progress bar
  const pct = Math.round((issue.verified / issue.needed) * 100);
  document.getElementById("dp-verify-count").textContent =
    `${issue.verified} / ${issue.needed}`;
  document.getElementById("dp-pbar").style.width = Math.min(pct, 100) + "%";

  const escalateEl = document.getElementById("dp-escalate");
  if (issue.verified >= issue.needed) {
    escalateEl.textContent = "✓ Auto-escalated to Municipal Corporation";
    escalateEl.style.color = "var(--green)";
  } else {
    escalateEl.textContent = `Needs ${issue.needed - issue.verified} more verifications to escalate`;
    escalateEl.style.color = "var(--text-tertiary)";
  }

  // Mini map with coloured pins
  const pinPositions = [
    { x: "35%", y: "42%", c: "var(--red)"    },
    { x: "55%", y: "28%", c: "var(--amber)"  },
    { x: "68%", y: "55%", c: "var(--green)"  },
    { x: "22%", y: "62%", c: "var(--red)"    },
    { x: "78%", y: "38%", c: "var(--amber)"  },
    { x: "48%", y: "70%", c: "var(--purple)" }
  ];
  const miniMap = document.getElementById("mini-map");
  // Remove old pins (keep the label)
  miniMap.querySelectorAll(".mpin").forEach(p => p.remove());
  pinPositions.forEach((p, i) => {
    const pin = document.createElement("div");
    pin.className = "mpin";
    pin.style.cssText = `top:${p.y};left:${p.x};background:${p.c};` +
      (i === id % pinPositions.length ? "transform:scale(1.5);border-color:var(--green);" : "");
    miniMap.appendChild(pin);
  });

  // Timeline
  document.getElementById("dp-timeline").innerHTML = issue.timeline
    .map((t, i) => `
      <div class="tl-item">
        ${i < issue.timeline.length - 1 ? '<div class="tl-line"></div>' : ""}
        <div class="tl-dot" style="background:${t.done ? "var(--green)" : "var(--border-mid)"}"></div>
        <div>
          <div class="tl-text">${t.text}</div>
          <div class="tl-time">${t.t}</div>
        </div>
      </div>`)
    .join("");

  // Mini leaderboard (static, just re-render for completeness)
  renderMiniLeaderboard();
}

function renderMiniLeaderboard() {
  const colors = [
    ["var(--amber-light)","var(--amber-dark)"],
    ["var(--blue-light)","var(--blue-dark)"],
    ["var(--purple-light)","var(--purple-dark)"],
    ["var(--green-light)","var(--green-dark)"]
  ];
  document.getElementById("mini-lb").innerHTML = LEADERS.slice(0, 4)
    .map((l, i) => `
      <div class="lb-row">
        <div class="lb-rank">${i + 1}</div>
        <div class="lb-av" style="background:${colors[i][0]};color:${colors[i][1]}">${l.init}</div>
        <div class="lb-name${l.me ? " you-row" : ""}">${l.name}${l.badge ? `<span class="lb-badge">${l.badge}</span>` : ""}</div>
        <div class="lb-xp">${l.xp.toLocaleString()} XP</div>
      </div>`)
    .join("");
}

/* ── 5. MAP PAGE ────────────────────────────────────────────── */
function renderMap() {
  const canvas = document.getElementById("mapCanvas");
  if (!canvas) return;
  canvas.innerHTML = "";

  // Draw horizontal roads
  [30, 55, 75].forEach(top => {
    const el = document.createElement("div");
    el.className = "road-h";
    el.style.top = top + "%";
    canvas.appendChild(el);
  });

  // Draw vertical roads
  [20, 50, 78].forEach(left => {
    const el = document.createElement("div");
    el.className = "road-v";
    el.style.left = left + "%";
    canvas.appendChild(el);
  });

  // Draw sector labels
  const areas = [
    { top: "5%",  left: "22%", w: "26%", h: "22%", label: "Sector 3" },
    { top: "5%",  left: "52%", w: "24%", h: "22%", label: "Sector 4" },
    { top: "33%", left: "22%", w: "26%", h: "19%", label: "Sector 5" },
    { top: "33%", left: "52%", w: "24%", h: "19%", label: "Sector 6" },
    { top: "58%", left: "22%", w: "26%", h: "16%", label: "Sector 7" },
    { top: "58%", left: "52%", w: "24%", h: "16%", label: "Sector 8" }
  ];
  areas.forEach(a => {
    const el = document.createElement("div");
    el.className = "area-block";
    el.style.cssText = `top:${a.top};left:${a.left};width:${a.w};height:${a.h}`;
    el.textContent = a.label;
    canvas.appendChild(el);
  });

  // Draw issue pins
  MAP_PINS.forEach(pin => {
    const wrap = document.createElement("div");
    wrap.className = "map-pin-wrap";
    wrap.style.cssText = `left:${pin.x}%;top:${pin.y}%`;
    wrap.innerHTML = `
      <div class="map-pin-outer" style="width:24px;height:24px;background:${pin.color}">
        <i class="ti ti-alert-circle" style="font-size:12px"></i>
      </div>
      <div class="map-tooltip">
        <div class="map-tt-title">${pin.label}</div>
        <div style="font-size:11px;color:var(--text-secondary)">${pin.sub}</div>
      </div>`;
    canvas.appendChild(wrap);
  });
}

/* ── 6. IMPACT PAGE ─────────────────────────────────────────── */
function renderImpact() {
  renderCategoryBars();
  renderSparkChart();
  renderWeeklyChart();
}

function renderCategoryBars() {
  const container = document.getElementById("hbar-cat");
  if (!container) return;
  const maxVal = Math.max(...CATEGORY_DATA.map(c => c.val));
  container.innerHTML = CATEGORY_DATA
    .map(c => `
      <div class="hbar-row">
        <div class="hbar-label">${c.label}</div>
        <div class="hbar-track">
          <div class="hbar-fill" style="width:${Math.round((c.val/maxVal)*100)}%;background:${c.color}">
            ${c.val > 12 ? c.val + "%" : ""}
          </div>
        </div>
        <div class="hbar-val">${c.val}%</div>
      </div>`)
    .join("");
}

function renderSparkChart() {
  const container = document.getElementById("spark-trend");
  if (!container) return;
  const maxVal = Math.max(...MONTHLY_DATA.map(d => d.reported));
  container.innerHTML = MONTHLY_DATA
    .map(d => `
      <div class="spark-row">
        <div class="spark-name">${d.month}</div>
        <div style="display:flex;gap:3px;align-items:flex-end;height:36px;flex:1">
          <div class="spark-bar" style="height:${Math.round((d.reported/maxVal)*100)}%;background:#E24B4A"></div>
          <div class="spark-bar" style="height:${Math.round((d.resolved/maxVal)*100)}%;background:#1D9E75"></div>
        </div>
        <div class="spark-val">${d.resolved}/${d.reported}</div>
      </div>`)
    .join("");
}

function renderWeeklyChart() {
  const canvas = document.getElementById("actChart");
  if (!canvas) return;
  if (state.chartInstance) {
    state.chartInstance.destroy(); // avoid duplicate canvas error
  }
  state.chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: WEEKLY_DATA.labels,
      datasets: [
        {
          label: "Reported",
          data: WEEKLY_DATA.reported,
          backgroundColor: "#E24B4A",
          borderRadius: 4
        },
        {
          label: "Resolved",
          data: WEEKLY_DATA.resolved,
          backgroundColor: "#1D9E75",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: "rgba(128,128,128,.08)" }, ticks: { font: { size: 11 }, stepSize: 5 } }
      }
    }
  });
}

/* ── 7. LEADERBOARD PAGE ────────────────────────────────────── */
function renderLeaderboard() {
  renderPodium();
  renderFullTable();
}

function renderPodium() {
  const container = document.getElementById("lb-top");
  if (!container) return;
  container.innerHTML = LEADERS.slice(0, 3)
    .map((l, i) => `
      <div class="lb-top-card">
        <div class="lb-crown">${CROWNS[i]}</div>
        <div class="lb-top-av" style="background:${AV_COLORS[i][0]};color:${AV_COLORS[i][1]}">${l.init}</div>
        <div class="lb-top-name">${l.name}</div>
        <div class="lb-top-xp">${l.xp.toLocaleString()} XP</div>
        <div class="lb-top-badges">
          ${l.badge ? `<span class="badge-chip" style="background:${AV_COLORS[i][0]};color:${AV_COLORS[i][1]}">${l.badge}</span>` : ""}
          <span class="badge-chip" style="background:var(--bg-secondary);color:var(--text-secondary)">${l.issues} issues</span>
        </div>
      </div>`)
    .join("");
}

function renderFullTable() {
  const container = document.getElementById("lb-rows");
  if (!container) return;
  container.innerHTML = LEADERS
    .map((l, i) => `
      <div class="lb-full-row${l.me ? " me" : ""}">
        <div style="font-size:13px;font-weight:600;color:var(--text-secondary)">${i + 1}</div>
        <div class="lb-person">
          <div class="lb-av" style="width:30px;height:30px;font-size:11px;background:${AV_COLORS[i][0]};color:${AV_COLORS[i][1]}">${l.init}</div>
          <div>
            ${l.name}
            ${l.badge ? `<span class="lb-badge" style="background:${AV_COLORS[i][0]};color:${AV_COLORS[i][1]}">${l.badge}</span>` : ""}
          </div>
        </div>
        <div class="lb-cell">${l.issues}</div>
        <div class="lb-cell">${l.verified}</div>
        <div class="lb-cell hi">${l.xp.toLocaleString()}</div>
      </div>`)
    .join("");
}

/* ── 8. REPORT MODAL ────────────────────────────────────────── */
const modal    = document.getElementById("modal");
const modalBg  = document.getElementById("modal-bg");
const btnNext  = document.getElementById("btn-next");
const btnBack  = document.getElementById("btn-back");
const titleEl  = document.getElementById("modal-step-title");

function openModal() {
  state.modalStep = 0;
  modal.classList.add("open");
  updateModalStep();
  // Reset fields
  document.getElementById("r-title").value = "";
  document.getElementById("r-desc").value  = "";
  document.getElementById("ai-box").classList.remove("show");
  document.getElementById("upload-label").textContent = "Tap to add photo or video";
}

function closeModal() {
  modal.classList.remove("open");
}

function updateModalStep() {
  const steps  = ["step1", "step2", "step3"];
  const titles = ["Report a community issue", "Add details & evidence", "Issue submitted! 🎉"];

  // Show only current step
  steps.forEach((id, i) => {
    document.getElementById(id).style.display = i === state.modalStep ? "block" : "none";
  });

  // Step dots
  [0, 1, 2].forEach(i => {
    document.getElementById("dot" + i).classList.toggle("on", i === state.modalStep);
  });

  titleEl.textContent = titles[state.modalStep];
  btnBack.style.display = state.modalStep > 0 ? "" : "none";

  if (state.modalStep === 0) {
    btnNext.innerHTML = 'Next <i class="ti ti-arrow-right"></i>';
  } else if (state.modalStep === 1) {
    btnNext.innerHTML = 'Submit <i class="ti ti-send"></i>';
  } else {
    btnNext.innerHTML = 'Done <i class="ti ti-check"></i>';
  }
}

btnNext.addEventListener("click", () => {
  if (state.modalStep === 0) {
    // Validate title before moving forward
    if (!document.getElementById("r-title").value.trim()) {
      showToast("Please enter an issue title first", "ti-alert-circle");
      return;
    }
    state.modalStep = 1;
    updateModalStep();
  } else if (state.modalStep === 1) {
    state.modalStep = 2;
    updateModalStep();
    // Reward XP on submit
    state.xp += 50;
    document.getElementById("xp-display").textContent =
      `${state.xp.toLocaleString()} XP · Level 7`;
    // Update the issue count badge in sidebar
    const cntAll = document.getElementById("cnt-all");
    if (cntAll) cntAll.textContent = ISSUES.length + 1;
    showToast("+50 XP earned! Issue reported successfully", "ti-bolt");
  } else {
    closeModal();
  }
});

btnBack.addEventListener("click", () => {
  if (state.modalStep > 0) {
    state.modalStep--;
    updateModalStep();
  }
});

document.getElementById("open-report-btn").addEventListener("click", openModal);
document.getElementById("modal-close-btn").addEventListener("click", closeModal);
modalBg.addEventListener("click", closeModal);

// Escape key closes modal
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// ── AI keyword detection in title field
let aiTimer;
document.getElementById("r-title").addEventListener("input", function () {
  clearTimeout(aiTimer);
  aiTimer = setTimeout(() => {
    const val   = this.value.toLowerCase();
    const box   = document.getElementById("ai-box");
    const match = Object.keys(AI_HINTS).find(k => val.includes(k));
    if (match && val.length > 3) {
      document.getElementById("ai-text").textContent = AI_HINTS[match];
      box.classList.add("show");
    } else {
      box.classList.remove("show");
    }
  }, 400); // debounce 400 ms
});

// ── Upload zone: trigger real file picker
document.getElementById("upload-zone").addEventListener("click", () => {
  document.getElementById("file-input").click();
});
document.getElementById("upload-zone").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") document.getElementById("file-input").click();
});
document.getElementById("file-input").addEventListener("change", function () {
  if (this.files && this.files[0]) {
    document.getElementById("upload-label").textContent =
      `✓ ${this.files[0].name} selected`;
  }
});

// ── Notification bell
document.getElementById("notif-btn").addEventListener("click", () => {
  showToast("You have 3 new issue updates", "ti-bell");
});

/* ── 9. TOAST NOTIFICATIONS ─────────────────────────────────── */
let toastTimer;
/**
 * Show a temporary bottom-right notification.
 * @param {string} msg  - message text
 * @param {string} icon - Tabler icon name, e.g. "ti-check"
 */
function showToast(msg, icon = "ti-check") {
  const toast    = document.getElementById("toast");
  const toastMsg = document.getElementById("toast-msg");
  const toastIco = document.getElementById("toast-icon");

  toastMsg.textContent  = msg;
  toastIco.className    = "ti " + icon;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ── 10. INIT ───────────────────────────────────────────────── */
/** Run everything needed when the page first loads */
function init() {
  renderIssues();       // populate the dashboard issue list
  renderDetail(0);      // show first issue in detail panel
  renderMiniLeaderboard();
}

// Run after DOM is ready (script is deferred via placement at bottom of body)
init();
