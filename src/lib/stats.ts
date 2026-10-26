// 简单的问答计数持久化：data/stats.json，记录每次问答
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "stats.json");

export type StatRec = { ts: number; hasSource: boolean; q: string };

export function loadStats(): StatRec[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

export function recordAnswer(hasSource: boolean, q = "") {
  const all = loadStats();
  all.push({ ts: Date.now(), hasSource, q: q.slice(0, 80) });
  const cutoff = Date.now() - 60 * 24 * 3600 * 1000;
  const kept = all.filter((r) => r.ts > cutoff);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(kept));
}

export function getStats() {
  const all = loadStats();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const today = all.filter((r) => r.ts >= startOfDay).length;
  const month = all.filter((r) => r.ts >= startOfMonth).length;
  const src = all.filter((r) => r.hasSource).length;
  const rate = all.length ? Math.round((src / all.length) * 100) : 0;
  const recent = [...all].reverse().slice(0, 20);
  return { today, month, rate, total: all.length, recent };
}
