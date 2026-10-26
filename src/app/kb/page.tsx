"use client";

import { useEffect, useRef, useState } from "react";
import { Database, FileText, RefreshCw, ShieldCheck, UploadCloud, FileUp, Trash2 } from "lucide-react";

export default function KbPage() {
  const [chunks, setChunks] = useState<number | null>(null);
  const [sources, setSources] = useState<{ source: string; count: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/ingest");
    const d = await r.json();
    setChunks(d.totalChunks ?? 0);
    setSources(d.sources ?? []);
  }
  useEffect(() => { load(); }, []);

  async function reingest() {
    setBusy(true);
    try {
      await fetch("/api/ingest", { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(name: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/ingest?source=${encodeURIComponent(name)}`, { method: "DELETE" });
      const d = await r.json();
      setChunks(d.totalChunks);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setChunks(d.totalChunks);
        await load();
        alert(`上传成功：${f.name} 切成 ${d.chunks} 片段`);
      } else {
        alert(d.error || "上传失败");
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="min-h-[80vh]">
      <h1 className="mb-1 text-xl font-bold text-slate-800">知识库管理</h1>
      <p className="mb-4 text-sm text-slate-500">企业私有制度文档切片入库，RAG 检索时附原文溯源，不编造。</p>

      <div className="mb-4 flex gap-3">
        <div className="glass flex-1 rounded-2xl p-4 text-center shadow">
          <div className="text-2xl font-bold text-blue-600">{chunks ?? "…"}</div>
          <div className="text-xs text-slate-500">向量片段总数</div>
        </div>
        <div className="glass flex-1 rounded-2xl p-4 text-center shadow">
          <div className="text-2xl font-bold text-emerald-600">{sources.length}</div>
          <div className="text-xs text-slate-500">已入库文档</div>
        </div>
        <div className="glass flex-1 rounded-2xl p-4 text-center shadow">
          <div className="text-2xl font-bold text-amber-600">余弦</div>
          <div className="text-xs text-slate-500">相似度检索</div>
        </div>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="group mb-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-white/50 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50/60"
      >
        <UploadCloud size={32} className="mb-2 text-blue-500 transition group-hover:scale-110" />
        <div className="text-sm font-medium text-slate-700">
          {uploading ? "解析入库中…" : "点击上传制度文档（.md / .txt / .pdf / .docx）"}
        </div>
        <div className="mt-1 text-xs text-slate-400">上传后自动解析、切片、向量化，即可被问答检索到</div>
        <input ref={fileRef} type="file" accept=".md,.txt,.pdf,.docx" className="hidden" onChange={onPickFile} />
      </div>

      <div className="glass rounded-3xl p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Database size={16} className="text-blue-500" /> 文档清单
          </div>
          <button
            onClick={reingest}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw size={13} className={busy ? "animate-spin" : ""} /> 重建内置索引
          </button>
        </div>
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {sources.length === 0 && (
            <div className="py-6 text-center text-sm text-slate-400">知识库为空，请上传制度文档</div>
          )}
          {sources.map((s) => (
            <div key={s.source} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3 transition hover:border-blue-200 hover:shadow-md">
              {s.source.endsWith(".pdf") || s.source.endsWith(".docx") ? (
                <FileUp size={18} className="shrink-0 text-emerald-600" />
              ) : (
                <FileText size={18} className="shrink-0 text-blue-500" />
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{s.source}</div>
                <div className="text-xs text-slate-500">{s.count} 个片段</div>
              </div>
              <button
                onClick={() => removeDoc(s.source)}
                className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                title="删除该文档"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={12} /> PDF 用 pdf-parse v2 提取文本，Word(.docx) 用 mammoth 提取，均已接入
        </div>
      </div>
    </div>
  );
}
