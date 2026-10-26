// RAG：文档解析 → 切片 → 入库 → 检索（带溯源）
import fs from "node:fs";
import path from "node:path";
import { addChunks, similaritySearch, countChunks, clearAll, deleteBySource, listSources, Chunk } from "./vectorStore";

export { countChunks, clearAll, deleteBySource, listSources };

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

// 从 buffer 解析文本：支持 .md/.txt/.pdf/.docx
async function extractBuffer(fileName: string, buf: Buffer): Promise<string> {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".txt" || ext === ".md") return buf.toString("utf-8");
  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buf) });
    const r = await parser.getText();
    return r.text;
  }
  if (ext === ".docx") {
    const mammoth = (await import("mammoth")).default;
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value;
  }
  console.warn(`[ingest] 暂不解析 ${ext} 文件：${fileName}`);
  return "";
}

async function extractText(file: string): Promise<string> {
  const buf = fs.readFileSync(file);
  return extractBuffer(file, buf);
}

// 把 sample_docs 目录下所有文档切片入库
export async function ingestSampleDocs(): Promise<{ files: number; chunks: number }> {
  if (!fs.existsSync(DOCS_DIR)) return { files: 0, chunks: 0 };
  const files = fs
    .readdirSync(DOCS_DIR)
    .filter((f) => /\.(txt|md|pdf|docx)$/i.test(f));
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

// 用户上传文件（.md/.txt/.pdf/.docx）→ 解析 → 切片入库
export async function ingestUploadedFile(source: string, buf: Buffer): Promise<number> {
  const text = await extractBuffer(source, buf);
  if (!text.trim()) return 0;
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
