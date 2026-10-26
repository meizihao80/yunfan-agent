"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  MessagesSquare,
  Database,
  Wrench,
  BookOpen,
  LayoutDashboard,
} from "lucide-react";

const NAV = [
  { href: "/", label: "对话助手", icon: MessagesSquare, desc: "RAG 问答 + Agent 调工具" },
  { href: "/dashboard", label: "分析报告", icon: LayoutDashboard, desc: "问答质量与索引健康度" },
  { href: "/kb", label: "知识库管理", icon: Database, desc: "制度文档与切片" },
  { href: "/tools", label: "MCP 工具广场", icon: Wrench, desc: "可调度的标准化工具" },
];

export default function Sidebar() {
  const path = usePathname();
  const [hist, setHist] = useState<{ q: string; ts: number }[]>([]);
  const reloadHist = () => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => setHist((d.recent ?? []).slice(0, 8)))
      .catch(() => {});
  };
  useEffect(() => { reloadHist(); }, [path]);
  return (
    <aside className="glass z-20 flex w-60 shrink-0 flex-col gap-1 rounded-3xl p-4 shadow-lg shadow-blue-100/40">
      <div className="mb-4 flex items-center gap-2 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
          <BookOpen size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-800">云帆 Agent</div>
          <div className="text-[10px] text-slate-400">企业文档智能客服</div>
        </div>
      </div>

      {NAV.map((n) => {
        const active = path === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`group rounded-2xl p-3 transition hover:translate-x-1 ${
              active
                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                : "hover:bg-white/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <n.icon size={16} className={active ? "text-white" : "text-blue-500"} />
              <span className="text-sm font-medium">{n.label}</span>
            </div>
            <div className={`mt-0.5 text-[10px] ${active ? "text-blue-100" : "text-slate-400"}`}>
              {n.desc}
            </div>
          </Link>
        );
      })}

      {path === "/" && hist.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-2">
          <div className="mb-1 px-1 text-[10px] text-slate-400">最近对话</div>
          <div className="max-h-40 space-y-0.5 overflow-y-auto">
            {hist.map((h, i) => (
              <div key={i} className="flex items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-white/70">
                <a href={"/?demo=" + encodeURIComponent(h.q)} className="flex-1 truncate text-xs text-slate-600">
                  💬 {h.q || "（空）"}
                </a>
                <button
                  onClick={async () => {
                    await fetch("/api/stats/del", { method: "POST", body: JSON.stringify({ ts: h.ts }) });
                    reloadHist();
                  }}
                  className="text-slate-300 hover:text-red-500"
                  title="删除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto rounded-2xl bg-white/60 p-3 text-[10px] leading-relaxed text-slate-500">
        传智杯 · B 组<br />RAG + Agent + MCP 工具链
      </div>
    </aside>
  );
}

