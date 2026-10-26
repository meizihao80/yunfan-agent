"use client";

import { useEffect, useRef, useState } from "react";
import { Database, FileText, RefreshCw, CheckCircle2, ShieldCheck, UploadCloud, FileUp } from "lucide-react";

const DOCS = [
  { name: "01-员工入职管理制度.md", desc: "入职流程、材料、试用期、合同期限" },
  { name: "02-员工离职管理制度.md", desc: "离职申请、交接、权限回收、薪资结算" },
  { name: "03-转正与考勤管理制度.md", desc: "转正流程、考勤、请假、绩效评价" },
];

export default function KbPage() {
  const [chunks, setChunks] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extra, setExtra] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/ingest");
    const d = await r.json();
    setChunks(d.totalChunks ?? 0);
  }
  useEffect(() => { load(); }, []);

  async function reingest() {
    setBusy(true);
    try {
      const r = await fetch("/api/ingest", { method: "POST" });
      const d = await r.json();
      setChunks(d.totalChunks ?? 0);
      alert(`已重新入库：共 ${d.totalChunks ?? 0} 片段`);
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
        setExtra((prev) => [f.name, ...prev]);
        alert(`上传成功：${f.name} 已切成 ${d.chunks} 个片段入库`);
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
          <div className="text-2xl font-bold text-emerald-600">{DOCS.length + extra.length}</div>
          <div className="text-xs text-slate-500">已入库文档</div>
        </div>
        <div className="glass flex-1 rounded-2xl p-4 text-center shadow">
          <div className="text-2xl font-bold text-amber-600">余弦</div>
          <div className="text-xs text-slate-500">相似度检索</div>
        </div>
      </div>

      {/* 真·上传入口 */}
      <div
        onClick={() => fileRef.current?.click()}
        className="group mb-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-white/50 p-8 text-center transition hover:border-blue-500 hover:bg-blue-50/60"
      >
        <UploadCloud size={32} className="mb-2 text-blue-500 transition group-hover:scale-110" />
        <div className="text-sm font-medium text-slate-700">
          {uploading ? "上传入库中…" : "点击上传你自己的制度文档（.md / .txt）"}
        </div>
        <div className="mt-1 text-xs text-slate-400">上传后自动切片、向量化、即可被问答检索到</div>
        <input ref={fileRef} type="file" accept=".md,.txt" className="hidden" onChange={onPickFile} />
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
        <div className="space-y-2">
          {DOCS.map((d) => (
            <div key={d.name} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/70 p-3 transition hover:border-blue-200 hover:shadow-md">
              <FileText size={18} className="mt-0.5 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800">{d.name}</div>
                <div className="text-xs text-slate-500">{d.desc}</div>
              </div>
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 size={13} /> 已入库
              </span>
            </div>
          ))}
          {extra.map((n) => (
            <div key={n} className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
              <FileUp size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              <div className="text-sm font-medium text-slate-800">{n}</div>
              <span className="ml-auto text-xs text-emerald-600">本次上传</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck size={12} /> PDF / Word 解析为预留扩展点，可平滑接入 pdf-parse / mammoth
        </div>
      </div>
    </div>
  );
}
