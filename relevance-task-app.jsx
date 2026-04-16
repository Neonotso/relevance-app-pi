import { useState, useEffect, useCallback, useRef } from "react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => Date.now();
const DAY = 86400000;
const WEEK = DAY * 7;

const SNOOZE_DURATIONS = [
  { label: "1 week", ms: WEEK },
  { label: "2 weeks", ms: WEEK * 2 },
  { label: "1 month", ms: DAY * 30 },
  { label: "3 months", ms: DAY * 90 },
];

function computeRelevanceScore(task) {
  let score = task.relevance_score ?? 0;
  const t = now();
  if (task.last_marked_relevant_at) {
    const age = t - task.last_marked_relevant_at;
    score += Math.max(0, 5 - age / DAY * 0.1);
  }
  if (task.due_date) {
    const diff = task.due_date - t;
    if (diff > 0 && diff < DAY * 7) score += 4;
    else if (diff < 0) score += 2;
  }
  if (!task.last_reviewed_at) score += 3;
  else {
    const staleness = (t - task.last_reviewed_at) / DAY;
    if (staleness > 30) score += 2;
  }
  if (task.snooze_until && task.snooze_until > t) score -= 10;
  return score;
}

function buildReviewQueue(tasks, limit = 20) {
  const t = now();
  const eligible = tasks.filter(
    (task) =>
      task.status === "vault" &&
      (!task.snooze_until || task.snooze_until <= t) &&
      !task.deleted_at
  );
  return [...eligible]
    .sort((a, b) => computeRelevanceScore(b) - computeRelevanceScore(a))
    .slice(0, limit);
}

function decayActiveTasks(tasks) {
  const t = now();
  return tasks.map((task) => {
    if (task.status !== "active") return task;
    const lastTouch = task.last_marked_relevant_at || task.updated_at || task.created_at;
    const staleDays = (t - lastTouch) / DAY;
    if (staleDays > 14) {
      return { ...task, status: "vault", updated_at: t };
    }
    return task;
  });
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

function seedTasks() {
  const t = now();
  const make = (title, daysAgo = 0, opts = {}) => ({
    id: uid(),
    title,
    notes: "",
    status: "vault",
    created_at: t - DAY * daysAgo,
    updated_at: t - DAY * daysAgo,
    last_reviewed_at: null,
    last_marked_relevant_at: null,
    last_marked_irrelevant_at: null,
    due_date: opts.due_date || null,
    snooze_until: null,
    relevance_score: opts.score ?? Math.random() * 4,
    project_tag: opts.tag || null,
    ...opts,
  });

  return [
    make("Update website bio", 45, { tag: "admin" }),
    make("Write thank-you note to mentors", 20, { tag: "personal" }),
    make("Organize sample library folders", 10, { tag: "music" }),
    make("Schedule dentist appointment", 60, { due_date: t + DAY * 5, tag: "personal" }),
    make("Research new mic preamp options", 30, { tag: "music" }),
    make("Reply to worship team email thread", 3, { tag: "admin" }),
    make("Back up Ableton projects", 90, { tag: "music" }),
    make("Review church budget proposal", 7, { due_date: t + DAY * 3, tag: "admin" }),
    make("Read about local AI embedding models", 14),
    make("Plan summer recording schedule", 25, { tag: "music" }),
    make("Fix PIER map hover bug", 5, { tag: "admin" }),
    make("Buy thank-you gift for team volunteer", 12, { tag: "personal" }),
    make("Experiment with grain textures in CSS", 8),
    make("Write song bridge for worship set", 35, { tag: "music" }),
    make("Cancel unused software subscription", 50, { tag: "admin" }),
    make("Write out goals for next quarter", 21, { tag: "personal" }),
    make("Test new Ollama model for coding agents", 2),
    make("Practice guitar chord transitions daily", 18, { tag: "music" }),
    make("Send invoice to recording client", 1, { due_date: t + DAY * 2, tag: "admin" }),
    make("Declutter desktop files", 70),
  ];
}

// ─── CSS (injected) ──────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f5f0e8;
  --bg2: #ede8df;
  --bg3: #e4ddd1;
  --ink: #1e1a14;
  --ink2: #4a4438;
  --ink3: #7a7266;
  --amber: #c8860a;
  --amber-light: #f5a623;
  --amber-pale: #fdf3df;
  --green: #3a7d44;
  --green-pale: #e8f4eb;
  --red: #a03030;
  --red-pale: #faeaea;
  --slate: #2c3e50;
  --slate-pale: #eaecf0;
  --border: #d4cdc2;
  --shadow: 0 2px 12px rgba(30,26,20,0.08);
  --shadow-lg: 0 8px 32px rgba(30,26,20,0.12);
  --radius: 14px;
  --radius-sm: 8px;
  font-family: 'Sora', sans-serif;
}

body { background: var(--bg); color: var(--ink); min-height: 100vh; }

.app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
}

/* Header */
.header {
  padding: 20px 20px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-title {
  font-family: 'Lora', serif;
  font-size: 22px;
  font-weight: 500;
  color: var(--ink);
  letter-spacing: -0.3px;
}
.header-sub {
  font-size: 11px;
  color: var(--ink3);
  margin-top: 1px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.date-chip {
  font-size: 11px;
  color: var(--ink3);
  background: var(--bg3);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
}

/* Nav */
.nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(245,240,232,0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border);
  display: flex;
  max-width: 480px;
  margin: 0 auto;
  padding: 8px 4px 12px;
  z-index: 100;
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 4px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  color: var(--ink3);
}
.nav-item.active { color: var(--amber); }
.nav-item:hover { background: var(--bg2); }
.nav-icon { font-size: 18px; line-height: 1; }
.nav-label { font-size: 10px; font-weight: 500; letter-spacing: 0.3px; }
.nav-badge {
  position: absolute;
  top: 4px; right: 8px;
  background: var(--amber);
  color: white;
  font-size: 9px;
  font-weight: 600;
  border-radius: 10px;
  padding: 1px 5px;
  line-height: 1.4;
}
.nav-item { position: relative; }

/* Page */
.page { padding: 0 16px; flex: 1; }
.section-title {
  font-family: 'Lora', serif;
  font-size: 18px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 4px;
}
.section-sub {
  font-size: 12px;
  color: var(--ink3);
  margin-bottom: 16px;
}

/* Cards */
.task-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: var(--shadow);
  transition: transform 0.12s, box-shadow 0.12s;
  cursor: pointer;
}
.task-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-lg); }
.task-card.today-card { border-left: 3px solid var(--amber); }
.task-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.4;
  margin-bottom: 4px;
}
.task-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.tag-music { background: #e8f0fe; color: #2d5cc4; }
.tag-admin { background: #fef3e8; color: #b06010; }
.tag-personal { background: #f0fae8; color: #3a7d44; }
.tag-default { background: var(--bg3); color: var(--ink3); }

.due-chip {
  font-size: 10px;
  color: var(--red);
  background: var(--red-pale);
  padding: 2px 7px;
  border-radius: 20px;
}
.due-soon-chip {
  font-size: 10px;
  color: var(--amber);
  background: var(--amber-pale);
  padding: 2px 7px;
  border-radius: 20px;
}

/* Review Card */
.review-stage {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.review-progress {
  width: 100%;
  max-width: 340px;
  background: var(--bg3);
  border-radius: 4px;
  height: 3px;
  margin-bottom: 20px;
  overflow: hidden;
}
.review-progress-bar {
  height: 100%;
  background: var(--amber);
  transition: width 0.3s;
}
.review-card-wrap {
  width: 100%;
  max-width: 340px;
  position: relative;
  height: 220px;
  margin-bottom: 20px;
}
.review-card {
  position: absolute;
  inset: 0;
  background: white;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px 24px 20px;
  box-shadow: 0 12px 40px rgba(30,26,20,0.14);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.35s cubic-bezier(.4,0,.2,1), opacity 0.35s;
  user-select: none;
}
.review-card.exit-left {
  transform: translateX(-120%) rotate(-12deg);
  opacity: 0;
}
.review-card.exit-right {
  transform: translateX(120%) rotate(12deg);
  opacity: 0;
}
.review-card-title {
  font-family: 'Lora', serif;
  font-size: 20px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.4;
}
.review-card-notes {
  font-size: 12px;
  color: var(--ink3);
  margin-top: 8px;
}
.review-prompt {
  font-size: 11px;
  color: var(--ink3);
  font-style: italic;
  margin-top: 12px;
}
.review-ghost {
  position: absolute;
  inset: 6px;
  background: var(--bg2);
  border-radius: 17px;
  z-index: -1;
}
.review-ghost2 {
  position: absolute;
  inset: 12px;
  background: var(--bg3);
  border-radius: 14px;
  z-index: -2;
}

/* Review Actions */
.review-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  max-width: 340px;
  margin-bottom: 10px;
}
.action-btn {
  border: none;
  border-radius: var(--radius);
  padding: 12px 10px;
  font-family: 'Sora', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.action-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow); }
.action-btn:active { transform: scale(0.97); }
.action-btn .icon { font-size: 18px; }
.btn-relevant { background: var(--green-pale); color: var(--green); }
.btn-notnow { background: var(--slate-pale); color: var(--slate); }
.btn-done { background: var(--amber-pale); color: var(--amber); }
.btn-archive { background: var(--bg3); color: var(--ink3); }

.snooze-panel {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  width: 100%;
  max-width: 340px;
  margin-bottom: 10px;
}
.snooze-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.snooze-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.snooze-btn {
  font-family: 'Sora', sans-serif;
  font-size: 11px;
  font-weight: 500;
  background: white;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 5px 12px;
  cursor: pointer;
  color: var(--ink2);
  transition: background 0.12s;
}
.snooze-btn:hover { background: var(--amber-pale); border-color: var(--amber-light); color: var(--amber); }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: var(--ink3);
}
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-title { font-family: 'Lora', serif; font-size: 18px; color: var(--ink2); margin-bottom: 6px; }
.empty-sub { font-size: 13px; line-height: 1.6; }

/* Today */
.today-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.cap-dots { display: flex; gap: 5px; }
.cap-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--bg3);
  border: 1px solid var(--border);
}
.cap-dot.filled { background: var(--amber); border-color: var(--amber); }

/* Active section */
.active-list { }
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.count-badge {
  font-size: 11px;
  font-weight: 600;
  background: var(--amber-pale);
  color: var(--amber);
  padding: 3px 9px;
  border-radius: 20px;
}

/* Add task */
.add-area {
  margin-bottom: 18px;
  display: flex;
  gap: 8px;
}
.add-input {
  flex: 1;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 11px 14px;
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.add-input:focus { border-color: var(--amber-light); box-shadow: 0 0 0 3px rgba(200,134,10,0.1); }
.add-input::placeholder { color: var(--ink3); }
.add-btn {
  background: var(--amber);
  color: white;
  border: none;
  border-radius: var(--radius);
  padding: 11px 16px;
  font-family: 'Sora', sans-serif;
  font-size: 20px;
  cursor: pointer;
  transition: background 0.15s;
}
.add-btn:hover { background: var(--amber-light); }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(30,26,20,0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal {
  background: var(--bg);
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 32px;
  width: 100%;
  max-width: 480px;
  animation: slideUp 0.25s cubic-bezier(.4,0,.2,1);
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modal-handle {
  width: 36px; height: 4px;
  background: var(--border);
  border-radius: 2px;
  margin: 0 auto 20px;
}
.modal-title {
  font-family: 'Lora', serif;
  font-size: 17px;
  font-weight: 500;
  color: var(--ink);
  margin-bottom: 16px;
}
.modal-input {
  width: 100%;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  margin-bottom: 10px;
}
.modal-input:focus { border-color: var(--amber-light); }
.modal-actions { display: flex; gap: 8px; margin-top: 16px; }
.modal-btn {
  flex: 1;
  padding: 11px;
  border: none;
  border-radius: var(--radius-sm);
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.modal-btn-primary { background: var(--amber); color: white; }
.modal-btn-secondary { background: var(--bg3); color: var(--ink2); }
.modal-row { display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap; }
.modal-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border);
}
.modal-action-btn {
  flex: 1;
  min-width: 80px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: 'Sora', sans-serif;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: var(--ink2);
  transition: background 0.12s;
}
.modal-action-btn:hover { background: var(--amber-pale); color: var(--amber); border-color: var(--amber-light); }
.modal-action-btn.danger:hover { background: var(--red-pale); color: var(--red); border-color: var(--red); }
.modal-action-btn.success:hover { background: var(--green-pale); color: var(--green); }

/* Vault */
.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  margin-bottom: 14px;
  gap: 8px;
}
.search-icon { color: var(--ink3); font-size: 14px; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  color: var(--ink);
  background: transparent;
}
.search-input::placeholder { color: var(--ink3); }

/* Archive */
.archive-note {
  font-size: 12px;
  color: var(--ink3);
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  margin-bottom: 14px;
  line-height: 1.5;
}
.task-card.archived { opacity: 0.75; }
.restore-btn {
  font-size: 11px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 3px 10px;
  cursor: pointer;
  color: var(--ink3);
  font-family: 'Sora', sans-serif;
  font-weight: 500;
}
.restore-btn:hover { background: var(--amber-pale); color: var(--amber); border-color: var(--amber-light); }

/* Divider */
.divider { height: 1px; background: var(--border); margin: 18px 0; }

/* Review done screen */
.review-done {
  text-align: center;
  padding: 32px 20px;
}
.review-done-icon { font-size: 48px; margin-bottom: 16px; }
.start-review-btn {
  background: var(--amber);
  color: white;
  border: none;
  border-radius: var(--radius);
  padding: 14px 28px;
  font-family: 'Sora', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  margin-top: 16px;
  transition: background 0.15s;
}
.start-review-btn:hover { background: var(--amber-light); }

.swipe-hint {
  font-size: 11px;
  color: var(--ink3);
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: 0.3px;
}

.tag-select {
  width: 100%;
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-family: 'Sora', sans-serif;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  margin-bottom: 10px;
}

.today-pick-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
}
.pick-item {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  transition: background 0.12s, border-color 0.12s;
}
.pick-item:hover { background: var(--amber-pale); border-color: var(--amber-light); }
`;

// ─── Tag Component ───────────────────────────────────────────────────────────

function TagChip({ tag }) {
  if (!tag) return null;
  const cls = tag === "music" ? "tag-music" : tag === "admin" ? "tag-admin" : tag === "personal" ? "tag-personal" : "tag-default";
  return <span className={`tag ${cls}`}>{tag}</span>;
}

function DueChip({ due_date }) {
  if (!due_date) return null;
  const t = now();
  const diff = due_date - t;
  if (diff < 0) return <span className="due-chip">overdue</span>;
  if (diff < DAY * 7) return <span className="due-soon-chip">due soon</span>;
  return null;
}

// ─── Task Card Component ─────────────────────────────────────────────────────

function TaskCard({ task, onClick, extra }) {
  return (
    <div className={`task-card ${task.status === "today" ? "today-card" : ""} ${task.status === "archived" ? "archived" : ""}`} onClick={onClick}>
      <div className="task-title">{task.title}</div>
      <div className="task-meta">
        <TagChip tag={task.project_tag} />
        <DueChip due_date={task.due_date} />
        {extra}
      </div>
    </div>
  );
}

// ─── Review Page ─────────────────────────────────────────────────────────────

const PROMPTS = [
  "Would this matter in the next 2 weeks?",
  "If this waits one more week, is that okay?",
  "Is this still meaningful, or just old guilt?",
  "Should this be active, snoozed, or archived?",
  "What's the cost of deferring this further?",
];

function ReviewPage({ tasks, onAction }) {
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [exit, setExit] = useState(null);
  const [showSnooze, setShowSnooze] = useState(false);
  const [done, setDone] = useState(false);
  const [promptIdx] = useState(Math.floor(Math.random() * PROMPTS.length));

  const startReview = useCallback(() => {
    setQueue(buildReviewQueue(tasks, 20));
    setIdx(0);
    setExit(null);
    setDone(false);
    setShowSnooze(false);
  }, [tasks]);

  const advance = useCallback((dir) => {
    setExit(dir);
    setTimeout(() => {
      setExit(null);
      setShowSnooze(false);
      setIdx((i) => {
        const next = i + 1;
        if (!queue || next >= queue.length) { setDone(true); return i; }
        return next;
      });
    }, 350);
  }, [queue]);

  const handle = (type, extra = {}) => {
    if (!queue) return;
    const task = queue[idx];
    onAction(task.id, type, extra);
    advance(type === "relevant" ? "right" : "left");
  };

  if (!queue || done) {
    return (
      <div className="page">
        <div className="section-title">Review</div>
        <div className="section-sub">Triage tasks one at a time — no overwhelm.</div>
        <div className="review-done">
          <div className="review-done-icon">{done ? "✦" : "◈"}</div>
          <div className="section-title">{done ? "Review complete" : "Ready to review?"}</div>
          <p style={{ fontSize: 13, color: "var(--ink3)", marginTop: 8, lineHeight: 1.6 }}>
            {done
              ? "Your active list has been updated. Nice work."
              : `${buildReviewQueue(tasks, 20).length} tasks are ready for your attention.`}
          </p>
          <button className="start-review-btn" onClick={startReview}>
            {done ? "Review again" : "Start review session →"}
          </button>
        </div>
      </div>
    );
  }

  const task = queue[idx];
  const progress = ((idx) / queue.length) * 100;

  return (
    <div className="page">
      <div className="section-title">Review</div>
      <div className="section-sub">Card {idx + 1} of {queue.length}</div>

      <div className="review-stage">
        <div className="review-progress" style={{ width: "100%", maxWidth: 340 }}>
          <div className="review-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="review-card-wrap">
          <div className="review-ghost2" />
          <div className="review-ghost" />
          <div className={`review-card ${exit === "relevant" ? "exit-right" : exit ? "exit-left" : ""}`}>
            <div>
              <div className="review-card-title">{task.title}</div>
              {task.notes && <div className="review-card-notes">{task.notes}</div>}
              <div className="task-meta" style={{ marginTop: 10 }}>
                <TagChip tag={task.project_tag} />
                <DueChip due_date={task.due_date} />
              </div>
            </div>
            <div className="review-prompt">{PROMPTS[promptIdx]}</div>
          </div>
        </div>

        <div className="swipe-hint">tap an action to classify this task</div>

        <div className="review-actions">
          <button className="action-btn btn-relevant" onClick={() => handle("relevant")}>
            <span className="icon">↑</span>
            Relevant now
          </button>
          <button className="action-btn btn-notnow" onClick={() => { setShowSnooze(s => !s); }}>
            <span className="icon">↓</span>
            Not now
          </button>
          <button className="action-btn btn-done" onClick={() => handle("done")}>
            <span className="icon">✓</span>
            Done
          </button>
          <button className="action-btn btn-archive" onClick={() => handle("archive")}>
            <span className="icon">⊙</span>
            Archive
          </button>
        </div>

        {showSnooze && (
          <div className="snooze-panel">
            <div className="snooze-title">Snooze until…</div>
            <div className="snooze-btns">
              {SNOOZE_DURATIONS.map((d) => (
                <button key={d.label} className="snooze-btn" onClick={() => handle("snooze", { duration: d.ms })}>
                  {d.label}
                </button>
              ))}
              <button className="snooze-btn" onClick={() => handle("notNow")}>
                Just not now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Today Page ───────────────────────────────────────────────────────────────

function TodayPage({ tasks, onAction, onOpenTask }) {
  const [picking, setPicking] = useState(false);
  const todayTasks = tasks.filter((t) => t.status === "today");
  const activeTasks = tasks.filter((t) => t.status === "active");
  const CAP = 3;

  return (
    <div className="page">
      <div className="section-title">Today</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="section-sub" style={{ marginBottom: 0 }}>
          {todayTasks.length === 0 ? "Pick up to 3 intentions for today." : `${todayTasks.length} of ${CAP} chosen`}
        </div>
        <div className="cap-dots">
          {Array.from({ length: CAP }).map((_, i) => (
            <div key={i} className={`cap-dot ${i < todayTasks.length ? "filled" : ""}`} />
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }} />

      {todayTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">◎</div>
          <div className="empty-title">Today is open</div>
          <div className="empty-sub">Pick a few tasks from your active list to focus on right now.</div>
        </div>
      )}

      {todayTasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onOpenTask(task)} extra={
          <button className="restore-btn" onClick={(e) => { e.stopPropagation(); onAction(task.id, "undoToday"); }}>
            ← remove
          </button>
        } />
      ))}

      {todayTasks.length < CAP && activeTasks.length > 0 && (
        <>
          {todayTasks.length > 0 && <div className="divider" />}
          <button
            className="start-review-btn"
            style={{ fontSize: 13, padding: "12px 20px", marginBottom: 16 }}
            onClick={() => setPicking(true)}
          >
            + Pick from Active
          </button>
        </>
      )}

      {picking && (
        <div className="modal-overlay" onClick={() => setPicking(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Choose a task for today</div>
            <div className="today-pick-list">
              {activeTasks
                .filter((t) => !todayTasks.find((td) => td.id === t.id))
                .map((task) => (
                  <div key={task.id} className="pick-item" onClick={() => {
                    onAction(task.id, "moveToToday");
                    if (todayTasks.length + 1 >= CAP) setPicking(false);
                  }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
                    <div style={{ marginTop: 4 }}>
                      <TagChip tag={task.project_tag} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Active Page ─────────────────────────────────────────────────────────────

function ActivePage({ tasks, onAction, onOpenTask, onAddTask }) {
  const [input, setInput] = useState("");
  const activeTasks = tasks.filter((t) => t.status === "active");
  const CAP = 12;
  const overflow = activeTasks.length > CAP;

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    onAddTask(title);
    setInput("");
  };

  return (
    <div className="page">
      <div className="list-header">
        <div>
          <div className="section-title">Active</div>
          <div className="section-sub" style={{ marginBottom: 0 }}>Tasks currently in focus</div>
        </div>
        <div className="count-badge">{activeTasks.length} / {CAP}</div>
      </div>
      <div style={{ marginBottom: 14 }} />

      <div className="add-area">
        <input
          className="add-input"
          placeholder="Add a task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="add-btn" onClick={handleAdd}>+</button>
      </div>

      {overflow && (
        <div className="archive-note">
          ⚠ Active list is over {CAP}. Consider archiving or returning some items to the vault.
        </div>
      )}

      {activeTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">◇</div>
          <div className="empty-title">Nothing active yet</div>
          <div className="empty-sub">Mark tasks as relevant during a review session to move them here.</div>
        </div>
      )}

      {activeTasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onOpenTask(task)} />
      ))}
    </div>
  );
}

// ─── Vault Page ───────────────────────────────────────────────────────────────

function VaultPage({ tasks, onAction, onOpenTask, onAddTask }) {
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");

  const vaultTasks = tasks.filter(
    (t) =>
      t.status === "vault" &&
      !t.deleted_at &&
      (search === "" || t.title.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    onAddTask(title);
    setInput("");
  };

  return (
    <div className="page">
      <div className="section-title">Vault</div>
      <div className="section-sub">{tasks.filter(t => t.status === "vault").length} tasks stored — nothing is lost.</div>

      <div className="add-area">
        <input
          className="add-input"
          placeholder="Capture a task…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button className="add-btn" onClick={handleAdd}>+</button>
      </div>

      <div className="search-bar">
        <span className="search-icon">⌕</span>
        <input
          className="search-input"
          placeholder="Search vault…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink3)", fontSize: 14 }}>✕</button>}
      </div>

      {vaultTasks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">◈</div>
          <div className="empty-title">{search ? "No matches" : "Vault is empty"}</div>
          <div className="empty-sub">{search ? "Try a different search." : "Add tasks above to begin."}</div>
        </div>
      )}

      {vaultTasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onOpenTask(task)} />
      ))}
    </div>
  );
}

// ─── Archive Page ─────────────────────────────────────────────────────────────

function ArchivePage({ tasks, onAction }) {
  const archived = tasks.filter((t) => t.status === "archived").reverse();
  return (
    <div className="page">
      <div className="section-title">Archive</div>
      <div className="section-sub">{archived.length} completed or retired tasks</div>
      <div className="archive-note">
        These tasks are out of your workflow. You can restore any of them if needed.
      </div>

      {archived.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">⊙</div>
          <div className="empty-title">Archive is empty</div>
          <div className="empty-sub">Completed and archived tasks will appear here.</div>
        </div>
      )}

      {archived.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => {}} extra={
          <button className="restore-btn" onClick={() => onAction(task.id, "restore")}>
            restore
          </button>
        } />
      ))}
    </div>
  );
}

// ─── Task Detail Modal ────────────────────────────────────────────────────────

function TaskModal({ task, onClose, onUpdate, onAction }) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || "");
  const [tag, setTag] = useState(task.project_tag || "");

  const save = () => {
    onUpdate(task.id, { title, notes, project_tag: tag || null });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-title">Edit Task</div>
        <input className="modal-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        <textarea
          className="modal-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          style={{ resize: "vertical" }}
        />
        <select className="tag-select" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">No tag</option>
          <option value="music">music</option>
          <option value="admin">admin</option>
          <option value="personal">personal</option>
          <option value="house">house</option>
          <option value="call">call</option>
        </select>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-primary" onClick={save}>Save</button>
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>Cancel</button>
        </div>

        <div className="modal-action-row">
          {task.status !== "active" && task.status !== "today" && (
            <button className="modal-action-btn success" onClick={() => { onAction(task.id, "relevant"); onClose(); }}>
              → Active
            </button>
          )}
          {task.status !== "today" && task.status === "active" && (
            <button className="modal-action-btn success" onClick={() => { onAction(task.id, "moveToToday"); onClose(); }}>
              → Today
            </button>
          )}
          {task.status !== "archived" && (
            <button className="modal-action-btn" onClick={() => { onAction(task.id, "done"); onClose(); }}>
              ✓ Done
            </button>
          )}
          {task.status !== "vault" && task.status !== "archived" && (
            <button className="modal-action-btn" onClick={() => { onAction(task.id, "backToVault"); onClose(); }}>
              ↩ Vault
            </button>
          )}
          {task.status !== "archived" && (
            <button className="modal-action-btn" onClick={() => { onAction(task.id, "archive"); onClose(); }}>
              ⊙ Archive
            </button>
          )}
          <button className="modal-action-btn danger" onClick={() => { onAction(task.id, "delete"); onClose(); }}>
            ✕ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "today", label: "Today", icon: "◎" },
  { id: "active", label: "Active", icon: "◇" },
  { id: "review", label: "Review", icon: "⟳" },
  { id: "vault", label: "Vault", icon: "◈" },
  { id: "archive", label: "Archive", icon: "⊙" },
];

function getDateStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function App() {
  const [tasks, setTasks] = useState(() => decayActiveTasks(seedTasks()));
  const [tab, setTab] = useState("today");
  const [modalTask, setModalTask] = useState(null);

  // Daily reset effect (simulated — in real app would check last-reset date)
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const updateTask = (id, fields) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...fields, updated_at: now() } : t))
    );
  };

  const handleAction = (id, type, extra = {}) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const t = now();
        switch (type) {
          case "relevant":
            return {
              ...task,
              status: "active",
              last_marked_relevant_at: t,
              last_reviewed_at: t,
              relevance_score: (task.relevance_score || 0) + 5,
              updated_at: t,
            };
          case "notNow":
          case "snooze": {
            const duration = extra.duration || WEEK;
            return {
              ...task,
              status: "vault",
              snooze_until: t + duration,
              last_marked_irrelevant_at: t,
              last_reviewed_at: t,
              relevance_score: (task.relevance_score || 0) - 3,
              updated_at: t,
            };
          }
          case "done":
            return {
              ...task,
              status: "archived",
              archived_at: t,
              updated_at: t,
            };
          case "archive":
            return {
              ...task,
              status: "archived",
              archived_at: t,
              updated_at: t,
            };
          case "delete":
            return { ...task, deleted_at: t, status: "deleted", updated_at: t };
          case "restore":
            return { ...task, status: "vault", archived_at: null, updated_at: t };
          case "moveToToday":
            return { ...task, status: "today", updated_at: t };
          case "undoToday":
            return { ...task, status: "active", updated_at: t };
          case "backToVault":
            return { ...task, status: "vault", updated_at: t };
          default:
            return task;
        }
      })
    );
  };

  const handleAddTask = (title) => {
    const task = {
      id: uid(),
      title,
      notes: "",
      status: "vault",
      created_at: now(),
      updated_at: now(),
      last_reviewed_at: null,
      last_marked_relevant_at: null,
      last_marked_irrelevant_at: null,
      due_date: null,
      snooze_until: null,
      relevance_score: 1,
      project_tag: null,
    };
    setTasks((prev) => [task, ...prev]);
  };

  const reviewCount = buildReviewQueue(tasks, 20).length;
  const activeCount = tasks.filter((t) => t.status === "active").length;
  const todayCount = tasks.filter((t) => t.status === "today").length;

  const pageTitle = {
    today: "Good day",
    active: "Active",
    review: "Review",
    vault: "Vault",
    archive: "Archive",
  }[tab];

  return (
    <div className="app">
      <div className="header">
        <div>
          <div className="header-title">{pageTitle}</div>
        </div>
        <div className="date-chip">{getDateStr()}</div>
      </div>

      {tab === "today" && (
        <TodayPage
          tasks={tasks}
          onAction={handleAction}
          onOpenTask={setModalTask}
        />
      )}
      {tab === "active" && (
        <ActivePage
          tasks={tasks}
          onAction={handleAction}
          onOpenTask={setModalTask}
          onAddTask={handleAddTask}
        />
      )}
      {tab === "review" && (
        <ReviewPage tasks={tasks} onAction={handleAction} />
      )}
      {tab === "vault" && (
        <VaultPage
          tasks={tasks}
          onAction={handleAction}
          onOpenTask={setModalTask}
          onAddTask={handleAddTask}
        />
      )}
      {tab === "archive" && (
        <ArchivePage tasks={tasks} onAction={handleAction} />
      )}

      <nav className="nav">
        {TABS.map((t) => {
          const badge =
            t.id === "review" ? reviewCount :
            t.id === "active" ? activeCount :
            t.id === "today" ? todayCount : 0;
          return (
            <button
              key={t.id}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
              {badge > 0 && <span className="nav-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      {modalTask && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalTask(null)}
          onUpdate={(id, fields) => { updateTask(id, fields); setModalTask(null); }}
          onAction={(id, type) => { handleAction(id, type); }}
        />
      )}
    </div>
  );
}
