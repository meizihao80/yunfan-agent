import { NextResponse } from "next/server";
import { ingestUploadedFile, countChunks } from "@/lib/rag";

// 用户上传自己的制度文档（.md/.txt/.pdf/.docx），解析后切片入库
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "未收到文件" }, { status: 400 });

    const name = file.name || "uploaded.md";
    const ext = name.split(".").pop()?.toLowerCase();
    if (!["md", "txt", "pdf", "docx"].includes(ext ?? "")) {
      return NextResponse.json(
        { ok: false, error: "支持 .md / .txt / .pdf / .docx" },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const chunks = await ingestUploadedFile(name, buf);
    if (chunks === 0) return NextResponse.json({ ok: false, error: "未能从文件提取文本（可能是扫描件）" }, { status: 400 });

    const total = await countChunks();
    return NextResponse.json({ ok: true, file: name, chunks, totalChunks: total });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
