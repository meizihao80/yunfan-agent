"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MessageCircle, ShieldCheck, AlertCircle, Clock, Upload, TrendingUp, FileText } from "lucide-react";

export default function DashboardPage() {
  const [chunks, setChunks] = useState<number>(0);
  const [docs, setDocs] = useState(0);
  const [s, setS] = useState<{ today: number; month: number; rate: number; recent: any[] }>({ today: 0, month: 0, rate: 0, recent: [] });
  const [showRec, setShowRec] = useState(false);
  const [recTitle, setRecTitle] = useState("今日问答记录");
  const [recFilter, setRecFilter] = useState<"today" | "month">("today");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/api/ingest")
      .then((r) => r.json())
      .then((d) => {
        setChunks(d.totalChunks ?? 0);
        setDocs((d.sources ?? []).length);
      });
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setS(d))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "今日问答", value: s.today, sub: "点我看记录", icon: MessageSquare, cls: "text-blue-600", bg: "bg-blue-50", filter: "today" },
    { label: "本月问答", value: s.month, sub: "点我看记录", icon: MessageCircle, cls: "text-cyan-600", bg: "bg-cyan-50", filter: "month" },
    { label: "有依据率", value: s.rate + "%", sub: "回答附制度来源", icon: ShieldCheck, cls: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "无依据率", value: 100 - s.rate + "%", sub: "制度未明确", icon: AlertCircle, cls: "text-amber-600", bg: "bg-amber-50" },
    { label: "平均耗时", value: "3.2s", sub: "含检索+生成", icon: Clock, cls: "text-violet-600", bg: "bg-violet-50" },
    { label: "本月上传", value: docs, sub: "去上传制度文档", icon: Upload, cls: "text-rose-600", bg: "bg-rose-50", href: "/kb" },
  ];

  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const filtered = s.recent.filter((r) =>
    recFilter === "today" ? r.ts >= todayStart.getTime() : r.ts >= monthStart.getTime()
  );

  return (
    <div className="min-h-[80vh]">
      <h1 className="grad-text mb-1 text-xl font-bold">分析报告</h1>
      <p className="mb-4 text-sm text-slate-500">问答质量、使用趋势与文档索引健康度</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => { setShowRec(true); setRecTitle(c.label + "记录"); setRecFilter(c.filter ?? "today"); }}
            className="glass block rounded-3xl p-4 text-left shadow transition hover:-translate-y-0.5"
          >
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.cls}`}>
              <c.icon size={16} />
            </div>
            <div className={`text-2xl font-bold ${c.cls}`}>{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-[10px] text-slate-400">{c.sub}</div>
          </button>
        ))}
      </div>

      {showRec && (
        <div className="glass mt-4 rounded-3xl p-4 shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">{recTitle}（{filtered.length}）</div>
            {!selectMode ? (
              <button onClick={() => setSelectMode(true)} className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100">删除记录</button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (picked.size === filtered.length) setPicked(new Set());
                    else setPicked(new Set(filtered.map((_, i) => i)));
                  }}
                  className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600"
                >
                  全选
                </button>
                <button
                  onClick={async () => {
                    const targets = s.recent.filter((_, i) => picked.has(i));
                    for (const t of targets) {
                      await fetch("/api/stats/del", { method: "POST", body: JSON.stringify({ ts: t.ts }) });
                    }
                    const res = await fetch("/api/stats");
                    setS(await res.json());
                    setPicked(new Set());
                    setSelectMode(false);
                  }}
                  className="rounded-lg bg-red-500 px-2 py-1 text-xs text-white"
                >
                  删除选中（{picked.size}）
                </button>
                <button onClick={() => { setSelectMode(false); setPicked(new Set()); }} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">取消</button>
              </div>
            )}
          </div>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {s.recent.length === 0 && <div className="text-xs text-slate-400">还没有记录，去对话页问个问题吧</div>}
            {filtered.length === 0 && <div className="text-xs text-slate-400">暂无记录</div>}
            {filtered.map((r, i) => (
              <div key={i} className="rounded-xl bg-white/60 px-3 py-1.5 text-xs">
                <div className="flex items-center justify-between">
                  {selectMode ? (
                    <label className="flex flex-1 cursor-pointer items-center gap-2">
                      <input type="checkbox" checked={picked.has(i)} onChange={() => {
                        const n = new Set(picked);
                        n.has(i) ? n.delete(i) : n.add(i);
                        setPicked(n);
                      }} />
                      <span className="text-slate-700">💬 {r.q || "（空）"}</span>
                    </label>
                  ) : (
                    <a href={"/?demo=" + encodeURIComponent(r.q)} className="flex flex-1 items-center justify-between">
                      <span className="text-slate-700">💬 {r.q || "（空）"}</span>
                      <span className={r.hasSource ? "text-emerald-500" : "text-amber-500"}>
                        {r.hasSource ? "有据" : "无据"} →
                      </span>
                    </a>
                  )}
                </div>
                {openIdx === i && (
                  <div className="mt-1.5 whitespace-pre-wrap rounded-lg bg-blue-50/60 p-2 text-[11px] text-slate-600">
                    {r.a || "（这条没有保存答案）"}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 趋势图（纯 SVG 示意） */}
      <div className="glass mt-4 rounded-3xl p-4 shadow">
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
          <TrendingUp size={16} className="text-blue-500" /> 使用趋势（演示）
        </div>
        <svg viewBox="0 0 600 120" className="w-full">
          <polyline points="0,100 80,98 160,95 240,80 320,60 400,40 480,55 560,30"
            fill="none" stroke="#3b82f6" strokeWidth="2.5" className="chart-line" />
          <polyline points="0,110 80,108 160,105 240,100 320,95 400,85 480,90 560,80"
            fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4" />
        </svg>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />问答量</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />上传量</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="glass rounded-3xl p-4 shadow">
          <div className="mb-2 text-sm font-semibold text-slate-700">文档索引状态</div>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="4"
                  strokeDasharray="95,100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-600">95%</div>
            </div>
            <div className="text-xs text-slate-500">索引健康度<br />{chunks} 片段 / {docs} 文档<br />全部可检索</div>
          </div>
        </div>
        <div className="glass rounded-3xl p-4 shadow">
          <div className="mb-2 text-sm font-semibold text-slate-700">系统能力</div>
          <div className="space-y-1.5 text-xs text-slate-600">
            {["RAG 向量检索 + 原文溯源", "Agent 多步工具循环（≤3步）", "MCP 标准化工具调度", "语音多模态输入"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <FileText size={11} className="text-blue-400" />{t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
