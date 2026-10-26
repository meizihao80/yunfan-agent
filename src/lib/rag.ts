// RAG：文档解析 → 切片 → 入库 → 检索（带溯源）
import fs from "node:fs";
import path from "node:path";
import { addChunks, similaritySearch, countChunks, Chunk } from "./vectorStore";

export { countChunks };

const DOCS_DIR = path.join(process.cwd(), "sample_docs");

// 简单递归字符切片（避免引入 langchain，稳定可控）
function splitText(text: string, chunkSize = 800, overlap = 120): string[] {
  const clean = text.replace(/\r/g, "").trim();
  if (clean.length <= chunkSize) return clean ? [clean] : [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + chunkSize, clean.length);
    // 尽量在句号/换行处断开
    const brk = clean.lastIndexOf("\n", end);
    if (brk > i + chunkSize / 2) end = brk;
    out.push(clean.slice(i, end));
    i = end - overlap;
  }
  return out.filter((s) => s.trim().length > 20);
}

async function extractText(file: string): Promise<string> {
  const ext = path.extname(file).toLowerCase();
  const buf = fs.readFileSync(file);
  // 样例知识库以 Markdown / 纯文本为准（最稳）。
  // PDF(.pdf) / Word(.docx) 解析为预留扩展点，可接 pdf-parse v2 / mammoth。
  if (ext === ".txt" || ext === ".md") return buf.toString("utf-8");
  console.warn(`[ingest] 暂不解析 ${ext} 文件：${path.basename(file)}`);
  return "";
}

// 把 sample_docs 目录下所有文档切片入库
export async function ingestSampleDocs(): Promise<{ files: number; chunks: number }> {
  if (!fs.existsSync(DOCS_DIR)) return { files: 0, chunks: 0 };
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => /\.(txt|md)$/i.test(f));
  let total = 0;
  for (const f of files) {
    const full = path.join(DOCS_DIR, f);
    const text = await extractText(full);
    const pieces = splitText(text);
    await addChunks(pieces.map((text) => ({ text, source: f })));
    total += pieces.length;
  }
  return { files: files.length, chunks: total };
}

// 用户上传的自定义制度文档切片入库
export async function ingestUploadedText(source: string, text: string): Promise<number> {
  const pieces = splitText(text);
  await addChunks(pieces.map((text) => ({ text, source })));
  return pieces.length;
}

// 首次对话若库为空，自动导入样例文档
export async function ensureIndexed() {
  if ((await countChunks()) === 0) {
    await ingestSampleDocs();
  }
}

export async function retrieve(query: string, topK = 3): Promise<Chunk[]> {
  await ensureIndexed();
  return similaritySearch(query, topK);
}
