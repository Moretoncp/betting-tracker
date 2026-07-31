#!/usr/bin/env node
/* =====================================================================
   chuck5674picks — X auto-poster
   ---------------------------------------------------------------------
   Reads config.js (the same file the website reads) and posts either
   today's card or the settled recap to X.

     node post.js card     -> today's pending picks, posted pre-game
     node post.js recap    -> today's settled results + running record
     node post.js --dry    -> print what would post, send nothing

   Credentials come from environment variables ONLY. Never hard-code them,
   never commit them. In GitHub Actions these are repository secrets.

     X_API_KEY
     X_API_SECRET
     X_ACCESS_TOKEN
     X_ACCESS_SECRET

   Requires an X developer app with Read+Write permission. The free tier
   allows a limited number of posts per month, which is plenty for a
   twice-daily cadence.
   ===================================================================== */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/* ---------- load BETS out of config.js without executing the whole file --- */
function loadBets() {
  const file = path.join(__dirname, "..", "config.js");
  const src = fs.readFileSync(file, "utf8");
  // config.js is plain data; evaluate it in an isolated scope and hand back BETS.
  const sandbox = { CONFIG: null, BETS: null };
  new Function("scope", src + "\nscope.CONFIG = CONFIG; scope.BETS = BETS;")(sandbox);
  if (!Array.isArray(sandbox.BETS)) throw new Error("Could not read BETS from config.js");
  return sandbox.BETS;
}

/* ---------- money helpers (mirror the site's math exactly) --------------- */
const profitOf = b => {
  if (b.result === "win") return b.odds > 0 ? b.stake * (b.odds / 100) : b.stake * (100 / -b.odds);
  if (b.result === "loss") return -b.stake;
  return 0; // push or pending
};
const usd = n => (n < 0 ? "-" : "+") + "$" + Math.abs(n).toFixed(2);
const oddsStr = o => (o > 0 ? "+" : "") + o;

/* ---------- date in America/New_York, so the "day" matches the card ------
   Override with --date=YYYY-MM-DD when grading runs late and you want to
   post a previous day's recap by hand.                                     */
function today() {
  const flag = process.argv.find(a => a.startsWith("--date="));
  if (flag) {
    const d = flag.slice(7);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Bad --date value: ${d}`);
    return d;
  }
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/* ---------- running totals across every settled bet --------------------- */
function record(bets) {
  const settled = bets.filter(b => b.result !== "pending");
  const w = settled.filter(b => b.result === "win").length;
  const l = settled.filter(b => b.result === "loss").length;
  const p = settled.filter(b => b.result === "push").length;
  const profit = settled.reduce((s, b) => s + profitOf(b), 0);
  const staked = settled.reduce((s, b) => s + b.stake, 0);
  const roi = staked ? (profit / staked) * 100 : 0;
  return { w, l, p, profit, staked, roi, n: settled.length };
}

/* ---------- compose ------------------------------------------------------ */
/* Assemble head + as many detail lines as fit under 280, then a tail.
   A long card silently degrades to "…and N more" instead of failing to post. */
function fit(head, lines, tail, limit = 280) {
  const join = kept => [head, "", ...kept, "", ...tail].join("\n");
  let kept = lines.slice();
  while (kept.length && join(kept).length > limit) {
    kept = kept.slice(0, -1);
    const more = lines.length - kept.length;
    const withNote = join(kept.concat(`…and ${more} more`));
    if (withNote.length <= limit) return withNote;
  }
  return join(kept);
}

function buildCard(bets) {
  const d = today();
  const open = bets.filter(b => b.date === d && b.result === "pending");
  if (!open.length) return null;

  const lines = open.map(b => `• ${b.pick} ${oddsStr(b.odds)} — $${b.stake}`);
  const risk = open.reduce((s, b) => s + b.stake, 0);

  return fit(
    `Today's card — ${open.length} play${open.length > 1 ? "s" : ""}, $${risk} at risk.`,
    lines,
    ["Posted before first pitch. Graded either way.", "chuck5674picks.com"]
  );
}

function buildRecap(bets) {
  const d = today();
  const done = bets.filter(b => b.date === d && b.result !== "pending");
  if (!done.length) return null;

  const mark = { win: "✅", loss: "❌", push: "➖" };
  const lines = done.map(b => `${mark[b.result]} ${b.pick} ${oddsStr(b.odds)}`);
  const day = done.reduce((s, b) => s + profitOf(b), 0);
  const r = record(bets);

  return fit(
    `${d} results: ${usd(day)}`,
    lines,
    [
      `All-time: ${r.w}-${r.l}-${r.p} · ${usd(r.profit)} · ${r.roi >= 0 ? "+" : ""}${r.roi.toFixed(1)}% ROI over ${r.n} bets`,
      "Every one of them, wins and losses: chuck5674picks.com",
    ]
  );
}

/* ---------- OAuth 1.0a request signing (no third-party deps) ------------- */
const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());

function authHeader(method, url, creds) {
  const params = {
    oauth_consumer_key: creds.key,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: creds.token,
    oauth_version: "1.0",
  };
  // JSON body params are NOT part of the OAuth signature base for X API v2.
  const base = [
    method.toUpperCase(),
    enc(url),
    enc(Object.keys(params).sort().map(k => `${enc(k)}=${enc(params[k])}`).join("&")),
  ].join("&");
  const signingKey = `${enc(creds.secret)}&${enc(creds.tokenSecret)}`;
  params.oauth_signature = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  return "OAuth " + Object.keys(params).sort()
    .map(k => `${enc(k)}="${enc(params[k])}"`).join(", ");
}

async function postToX(text) {
  const creds = {
    key: process.env.X_API_KEY,
    secret: process.env.X_API_SECRET,
    token: process.env.X_ACCESS_TOKEN,
    tokenSecret: process.env.X_ACCESS_SECRET,
  };
  const missing = Object.entries(creds).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new Error("Missing credentials for: " + missing.join(", "));

  const url = "https://api.twitter.com/2/tweets";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader("POST", url, creds),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`X API ${res.status}: ${body}`);
  return body;
}

/* ---------- main --------------------------------------------------------- */
(async () => {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const mode = args.find(a => a === "card" || a === "recap") || "card";

  const bets = loadBets();
  const text = mode === "card" ? buildCard(bets) : buildRecap(bets);

  if (!text) {
    console.log(`Nothing to post for mode "${mode}" on ${today()} — exiting quietly.`);
    return;
  }
  if (text.length > 280) {
    console.warn(`WARNING: ${text.length} chars, over the 280 limit. Posting anyway will fail.`);
  }

  console.log("---- post ----\n" + text + "\n--------------");
  console.log(`(${text.length} chars)`);

  if (dry) { console.log("Dry run — nothing sent."); return; }

  await postToX(text);
  console.log("Posted.");
})().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
