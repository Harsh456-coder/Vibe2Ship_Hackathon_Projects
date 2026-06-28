/**
 * data.js — Community Hero
 *
 * All application data lives here.
 * In a real app, this would come from a backend API.
 * For the hackathon prototype, it's static data you can edit freely.
 *
 * ISSUES array: each object = one civic issue card
 * LEADERS array: leaderboard citizens
 * AI_HINTS object: keyword → AI suggestion text (used in the report modal)
 */

// ── ISSUES ───────────────────────────────────────────────────
const ISSUES = [
  {
    id: 0,
    title: "Large pothole on Shastri Nagar crossing",
    cat: "roads",            // used for sidebar filter
    catLabel: "Roads",       // displayed on card
    status: "open",          // "open" | "in-progress" | "resolved"
    dist: "0.3 km",
    age: "2 days ago",
    media: "3 photos",
    severity: "High",        // Low | Medium | High | Critical
    votes: 24,
    comments: 7,
    ai: 97,                  // AI confidence %
    verified: 24,            // community verifications so far
    needed: 25,              // verifications needed to auto-escalate
    timeline: [
      { t: "Jun 22, 10:14 AM", text: "Issue reported with 3 photos",     done: true  },
      { t: "Jun 22, 10:14 AM", text: "AI: Roads & Potholes · High (97%)", done: true  },
      { t: "Jun 23, 2:00 PM",  text: "23 citizens verified",              done: true  },
      { t: "Est. Jun 26",      text: "Repair crew scheduled",             done: false }
    ]
  },
  {
    id: 1,
    title: "Street light out — Gandhi Road block 4",
    cat: "light",
    catLabel: "Lighting",
    status: "in-progress",
    dist: "0.8 km",
    age: "5 days ago",
    media: "1 photo",
    severity: "Medium",
    votes: 18,
    comments: 3,
    ai: 94,
    verified: 18,
    needed: 25,
    timeline: [
      { t: "Jun 19",  text: "Issue reported",                  done: true  },
      { t: "Jun 20",  text: "AI: Street Lighting · Medium (94%)", done: true  },
      { t: "Jun 22",  text: "MVVNL notified",                  done: true  },
      { t: "Jun 24",  text: "Crew dispatched",                  done: false }
    ]
  },
  {
    id: 2,
    title: "Water pipeline leaking near Patel Chowk",
    cat: "water",
    catLabel: "Water",
    status: "open",
    dist: "1.2 km",
    age: "1 day ago",
    media: "1 video",
    severity: "Critical",
    votes: 31,
    comments: 12,
    ai: 89,
    verified: 10,
    needed: 25,
    timeline: [
      { t: "Jun 23, 9:00 AM", text: "Issue reported with video",           done: true  },
      { t: "Jun 23, 9:01 AM", text: "AI: Water & Drainage · Critical (89%)", done: true  },
      { t: "Jun 23, 4:00 PM", text: "10 citizens verified so far",          done: true  },
      { t: "Pending",         text: "Awaiting Jal Nigam response",          done: false }
    ]
  },
  {
    id: 3,
    title: "Overflowing garbage bin — Sector 7 market",
    cat: "waste",
    catLabel: "Waste",
    status: "resolved",
    dist: "0.5 km",
    age: "3 days ago",
    media: "2 photos",
    severity: "Medium",
    votes: 15,
    comments: 5,
    ai: 99,
    verified: 25,
    needed: 25,
    timeline: [
      { t: "Jun 21", text: "Issue reported",                    done: true },
      { t: "Jun 21", text: "AI: Waste Management · Medium (99%)", done: true },
      { t: "Jun 21", text: "25 verified — auto-escalated",       done: true },
      { t: "Jun 22", text: "Cleared by Nagar Nigam ✓",          done: true }
    ]
  },
  {
    id: 4,
    title: "Broken footpath slabs near school gate",
    cat: "roads",
    catLabel: "Roads",
    status: "in-progress",
    dist: "0.6 km",
    age: "4 days ago",
    media: "2 photos",
    severity: "High",
    votes: 22,
    comments: 8,
    ai: 91,
    verified: 20,
    needed: 25,
    timeline: [
      { t: "Jun 20",      text: "Issue reported",            done: true  },
      { t: "Jun 20",      text: "AI: Roads · High (91%)",    done: true  },
      { t: "Jun 22",      text: "PWD alerted",               done: true  },
      { t: "Est. Jun 27", text: "Repair scheduled",          done: false }
    ]
  },
  {
    id: 5,
    title: "Illegal dumping near Lohia Nagar park",
    cat: "waste",
    catLabel: "Waste",
    status: "open",
    dist: "1.5 km",
    age: "6 hours ago",
    media: "1 photo",
    severity: "Medium",
    votes: 9,
    comments: 2,
    ai: 88,
    verified: 5,
    needed: 25,
    timeline: [
      { t: "Jun 24, 8:00 AM", text: "Issue reported",                      done: true  },
      { t: "Jun 24, 8:00 AM", text: "AI: Waste Management · Medium (88%)", done: true  },
      { t: "In progress",     text: "Community verifying",                 done: false }
    ]
  }
];

// ── LEADERBOARD ───────────────────────────────────────────────
const LEADERS = [
  { name: "Rahul Agarwal",  init: "RA",  issues: 42, verified: 138, xp: 3410, badge: "Hero",     me: false },
  { name: "Priya Sharma",   init: "PS",  issues: 38, verified: 124, xp: 2980, badge: "Guardian", me: false },
  { name: "Mohit Kumar",    init: "MK",  issues: 31, verified: 98,  xp: 2540, badge: "Vigilant", me: false },
  { name: "You",            init: "You", issues: 12, verified: 47,  xp: 1240, badge: "Rising",   me: true  },
  { name: "Sunita Gupta",   init: "SG",  issues: 10, verified: 38,  xp: 920,  badge: "",          me: false },
  { name: "Amit Verma",     init: "AV",  issues: 8,  verified: 29,  xp: 740,  badge: "",          me: false }
];

// Avatar colour pairs [background, text] for each rank position
const AV_COLORS = [
  ["var(--amber-light)",  "var(--amber-dark)"],
  ["var(--blue-light)",   "var(--blue-dark)"],
  ["var(--purple-light)", "var(--purple-dark)"],
  ["var(--green-light)",  "var(--green-dark)"],
  ["var(--coral-light)",  "var(--coral-dark)"],
  ["var(--red-light)",    "var(--red-dark)"]
];

const CROWNS = ["🥇", "🥈", "🥉"];

// ── AI KEYWORD HINTS (report modal) ──────────────────────────
// When the user types these keywords in the report title,
// the AI suggestion box appears automatically.
const AI_HINTS = {
  "pothole":  "Roads & Potholes detected · Severity: High · Similar issues fixed in 3.2 days here.",
  "footpath": "Roads & Potholes detected · Safety concern near pedestrian area.",
  "light":    "Street Lighting detected · Severity: Medium · 2 similar reports nearby.",
  "water":    "Water & Drainage detected · Severity: Critical — escalation recommended.",
  "leak":     "Water & Drainage detected · Severity: Critical — escalation recommended.",
  "garbage":  "Waste Management detected · Collection due tomorrow in this area.",
  "trash":    "Waste Management detected · Bin overflow reported 2x this month.",
  "drain":    "Water & Drainage · Monsoon risk zone — High priority.",
  "sewer":    "Water & Drainage · Severity: High · Health hazard — escalation likely.",
  "road":     "Roads & Potholes detected · Check severity before submitting."
};

// ── IMPACT PAGE DATA ──────────────────────────────────────────
const CATEGORY_DATA = [
  { label: "Roads",     val: 30, color: "#D85A30" },
  { label: "Water",     val: 19, color: "#378ADD" },
  { label: "Waste",     val: 23, color: "#1D9E75" },
  { label: "Lighting",  val: 17, color: "#EF9F27" },
  { label: "Other",     val: 11, color: "#534AB7" }
];

const MONTHLY_DATA = [
  { month: "Jan", reported: 12, resolved: 8  },
  { month: "Feb", reported: 18, resolved: 14 },
  { month: "Mar", reported: 24, resolved: 20 },
  { month: "Apr", reported: 20, resolved: 18 },
  { month: "May", reported: 28, resolved: 22 },
  { month: "Jun", reported: 31, resolved: 28 }
];

const WEEKLY_DATA = {
  labels: ["Wk 1","Wk 2","Wk 3","Wk 4","Wk 5","Wk 6","Wk 7","Wk 8"],
  reported: [8, 12, 7, 15, 10, 18, 9, 14],
  resolved: [5, 9,  6, 12,  8, 15, 7, 11]
};

// ── MAP PINS ──────────────────────────────────────────────────
const MAP_PINS = [
  { x: 33, y: 38, color: "#E24B4A", label: "Pothole — Shastri Nagar",   sub: "Open · High"    },
  { x: 60, y: 20, color: "#EF9F27", label: "Street light out",           sub: "In Progress"    },
  { x: 24, y: 60, color: "#E24B4A", label: "Water leak — Patel Chowk",  sub: "Open · Critical" },
  { x: 70, y: 65, color: "#1D9E75", label: "Garbage bin cleared",        sub: "Resolved"       },
  { x: 45, y: 45, color: "#EF9F27", label: "Broken footpath",            sub: "In Progress"    },
  { x: 82, y: 75, color: "#534AB7", label: "Illegal dumping",            sub: "Open · Critical" }
];
