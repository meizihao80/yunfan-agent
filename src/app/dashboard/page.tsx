"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Wrench, FileText, TrendingUp, Activity } from "lucide-react";

export default function DashboardPage() {
  const [chunks, setChunks] = useState<number | null>(null);
  const [docs, setDocs] = useState(0);

  useEffect(() => {
    fetch("/api/ingest")
      .then((r) => r.json())
      .then((d) => {
        setChunks(d.totalChunks ?? 0);
        setDocs((d.sources ?? []).length);
      });
  }, []);

  const stats = [
    { label: "知识库片段", value: chunks ?? "…", icon: FileText, color: "text-blue-600", bg: "from-blue-500 to-cyan-500" },
    { label: "已入库文档", value: docs, icon: Activity, color: "text-emerald-600", bg: "from-emerald-500 to-teal-500" },
    { label: "可用 MCP 工具", value: 3, icon: Wrench, color: "text-amber-600", bg: "from-amber-500 to-orange-500" },
    { label: "对话轮次", value: "实时", icon: MessageSquare, color: "text-rose-600", bg: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="min-h-[80vh]">
      <h1 className="mb-1 text-xl font-bold text-slate-800">运行看板</h1>
      <p className="mb-4 text-sm text-slate-500">知枢 Agent 实时运行状态</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-3xl p-4 shadow transition hover:-translate-y-0.5">
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${s.bg} text-white`}>
              <s.icon size={16} />
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass mt-4 rounded-3xl p-4 shadow">
        <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
          <TrendingUp size={16} className="text-blue-500" /> 系统能力
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          {["RAG 检索：制度问答自动召回片段并溯源",
            "Agent 规划：多步工具循环，最多 3 步自动编排",
            "MCP 工具：入职登记表 / 待办清单 / 合规校验",
            "多模态：浏览器语音输入提问"].map((t) => (
            <div key={t} className="flex items-center gap-2 rounded-xl bg-white/60 p-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
