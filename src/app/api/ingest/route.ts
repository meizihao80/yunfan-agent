import { NextResponse } from "next/server";
import { ingestSampleDocs, countChunks } from "@/lib/rag";

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
  const total = await countChunks();
  return NextResponse.json({ totalChunks: total });
}
