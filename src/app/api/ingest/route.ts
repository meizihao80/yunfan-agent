import { NextResponse } from "next/server";
import { ingestSampleDocs, countChunks, clearAll, deleteBySource, listSources } from "@/lib/rag";

// 一键导入 sample_docs 下的人事制度文档
export async function POST() {
  try {
    const r = await ingestSampleDocs();
    const total = await countChunks();
    return NextResponse.json({ ok: true, ...r, totalChunks: total });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const [total, sources] = await Promise.all([countChunks(), listSources()]);
  return NextResponse.json({ totalChunks: total, sources });
}

// 删除：?source=文件名 删单个文档；无参数清空全部
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const source = url.searchParams.get("source");
  if (source) {
    const n = await deleteBySource(source);
    return NextResponse.json({ ok: true, removed: n, totalChunks: await countChunks() });
  }
  await clearAll();
  return NextResponse.json({ ok: true, totalChunks: 0 });
}
