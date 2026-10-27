// 轻量本地向量库：内存向量 + JSON 持久化（避免 Chroma 起独立服务，两天冲刺最稳）
// 接口对齐 RAG 语义：addChunks / similaritySearch，带溯源元数据
import fs from "node:fs";
import path from "node:path";
import { embedTexts, embedOne } from "./embedding";

export type Chunk = {
  id: string;
  text: string;
  source: string; // 来源文件名，用于溯源
  vector: number[];
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "knowledge.json");

let cache: Chunk[] | null = null;
function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export async function loadChunks(): Promise<Chunk[]> {
  if (cache) return cache;
  if (fs.existsSync(DATA_FILE)) {
    cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as Chunk[];
  } else {
    cache = [];
  }
  return cache;
}

export async function countChunks(): Promise<number> {
  return (await loadChunks()).length;
}

// 列出所有来源文件名及各自片段数
export async function listSources(): Promise<{ source: string; count: number }[]> {
  const all = await loadChunks();
  const map = new Map<string, number>();
  for (const c of all) map.set(c.source, (map.get(c.source) ?? 0) + 1);
  return [...map.entries()].map(([source, count]) => ({ source, count }));
}

// 清空整个知识库
export async function clearAll() {
  cache = [];
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, "[]", "utf-8");
}

// 按来源文件名删除该文档的所有片段
export async function deleteBySource(source: string): Promise<number> {
  const all = await loadChunks();
  const kept = all.filter((c) => c.source !== source);
  const removed = all.length - kept.length;
  cache = kept;
  fs.writeFileSync(DATA_FILE, JSON.stringify(kept), "utf-8");
  return removed;
}

export async function addChunks(items: { text: string; source: string }[]) {
  if (items.length === 0) return;
  const vectors = await embedTexts(items.map((i) => i.text));
  const chunks: Chunk[] = items.map((it, idx) => ({
    id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
    text: it.text,
    source: it.source,
    vector: vectors[idx],
  }));
  const all = await loadChunks();
  all.push(...chunks);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(all), "utf-8");
  cache = all;
}

export async function similaritySearch(query: string, topK = 3): Promise<Chunk[]> {
  const all = await loadChunks();
  if (all.length === 0) return [];
  const qv = await embedOne(query);
  return all
    .map((c) => ({ c, score: cosine(qv, c.vector) }))
    .filter((x) => x.score > 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.c);
}
