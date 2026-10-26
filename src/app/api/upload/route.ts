import { NextResponse } from "next/server";
import { ingestUploadedText, countChunks } from "@/lib/rag";

// 用户上传自己的制度文档（.md / .txt），切片入库
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ ok: false, error: "未收到文件" }, { status: 400 });

    const name = file.name || "uploaded.md";
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext !== "md" && ext !== "txt") {
      return NextResponse.json(
        { ok: false, error: "暂支持 .md / .txt 纯文本制度文件（PDF/Word 解析为预留扩展点）" },
        { status: 400 }
      );
    }

    const text = await file.text();
    if (!text.trim()) return NextResponse.json({ ok: false, error: "文件内容为空" }, { status: 400 });

    const chunks = await ingestUploadedText(name, text);
    const total = await countChunks();
    return NextResponse.json({ ok: true, file: name, chunks, totalChunks: total });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
