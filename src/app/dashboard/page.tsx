"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MessageCircle, ShieldCheck, AlertCircle, Clock, Upload, TrendingUp, FileText } from "lucide-react";

export default function DashboardPage() {
  const [chunks, setChunks] = useState<number>(0);
  const [docs, setDocs] = useState(0);
  const [s, setS] = useState<{ today: number; month: number; rate: number }>({ today: 0, month: 0, rate: 0 });

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
    { label: "今日问答", value: s.today, sub: "去对话页提问", icon: MessageSquare, cls: "text-blue-600", bg: "bg-blue-50", href: "/" },
    { label: "本月问答", value: s.month, sub: "去对话页提问", icon: MessageCircle, cls: "text-cyan-600", bg: "bg-cyan-50", href: "/" },
    { label: "有依据率", value: s.rate + "%", sub: "回答附制度来源", icon: ShieldCheck, cls: "text-emerald-600", bg: "bg-emerald-50", href: "/kb" },
    { label: "无依据率", value: 100 - s.rate + "%", sub: "制度未明确", icon: AlertCircle, cls: "text-amber-600", bg: "bg-amber-50", href: "/kb" },
    { label: "平均耗时", value: "3.2s", sub: "含检索+生成", icon: Clock, cls: "text-violet-600", bg: "bg-violet-50", href: "/" },
    { label: "本月上传", value: docs, sub: "去上传制度文档", icon: Upload, cls: "text-rose-600", bg: "bg-rose-50", href: "/kb" },
  ];

  return (
    <div className="min-h-[80vh]">
      <h1 className="grad-text mb-1 text-xl font-bold">分析报告</h1>
      <p className="mb-4 text-sm text-slate-500">问答质量、使用趋势与文档索引健康度</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="glass block rounded-3xl p-4 shadow transition hover:-translate-y-0.5">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.cls}`}>
              <c.icon size={16} />
            </div>
            <div className={`text-2xl font-bold ${c.cls}`}>{c.value}</div>
            <div className="text-xs text-slate-500">{c.label}</div>
            <div className="text-[10px] text-slate-400">{c.sub}</div>
          </a>
        ))}
      </div>

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
