"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Send,
  Mic,
  MicOff,
  Loader2,
  Upload,
  ShieldCheck,
  Sparkles,
  Wrench,
  CheckCircle2,
  Building2,
  ClipboardList,
} from "lucide-react";

type Part = {
  type: string;
  text?: string;
  toolName?: string;
  state?: { status?: string; output?: any };
};

function textOf(parts: Part[]): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text!)
    .join("");
}

const QUICK = [
  { icon: Building2, q: "给张三，技术部，工程师生成入职登记表" },
  { icon: ClipboardList, q: "帮我列一份入职流程的待办清单" },
  { icon: ShieldCheck, q: "试用期是多久？转正需要哪些手续？" },
  { icon: Sparkles, q: "员工离职要提前多久通知？" },
];

export default function Page() {
  const { messages, sendMessage, status, error, reload } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });

  const [input, setInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [importing, setImporting] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const recRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    fetch("/api/ingest")
      .then((r) => r.json())
      .then((d) => setChunkCount(d.totalChunks ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // 从工具广场点“试用”跳过来时，自动带问题发问
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("demo");
    if (q && !busy) sendMessage({ text: q });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleImport() {
    setImporting(true);
    try {
      const r = await fetch("/api/ingest", { method: "POST" });
      const d = await r.json();
      setChunkCount(d.totalChunks ?? 0);
      alert(`导入完成：知识库共 ${d.totalChunks ?? 0} 个片段`);
    } catch {
      alert("导入失败");
    } finally {
      setImporting(false);
    }
  }

  function ask(q: string) {
    if (busy || !q.trim()) return;
    sendMessage({ text: q });
  }

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage({ text });
  }

  function toggleRecord() {
    const SR = (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("请用 Chrome 浏览器打开");
      return;
    }
    if (recording) {
      recRef.current?.stop();
      setRecording(false);
      return;
    }
    const rec = new SR();
    rec.lang = "zh-CN";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + "，" + t : t));
    };
    rec.onend = () => setRecording(false);
    rec.start();
    recRef.current = rec;
    setRecording(true);
  }

  return (
    <main className="relative min-h-screen">
      {/* 动态背景 */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="mx-auto max-w-3xl px-1 py-2">
        {/* 顶部状态条 */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-emerald-700">
              <span className="pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
              知识库 {chunkCount ?? "…"} 片段在线
            </span>
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-blue-700">
              <Wrench size={12} /> MCP 工具链
            </span>
            <span className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-amber-700">
              <ShieldCheck size={12} /> RAG 溯源
            </span>
          </div>
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:scale-105 hover:bg-slate-700 active:scale-95 disabled:opacity-50"
          >
            {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            导入制度
          </button>
        </div>

        {/* 对话区 */}
        <div
          ref={scrollRef}
          className="glass h-[56vh] overflow-y-auto rounded-3xl p-4 shadow-lg shadow-blue-100/40"
        >
          {messages.length === 0 && (
            <div className="mt-6">
              <div className="mb-4 text-center">
                <h2 className="text-xl font-bold text-slate-800">你好，行政人事同学 👋</h2>
                <p className="mt-1 text-sm text-slate-500">
                  制度问答、生成表单、列待办，直接说或点下面的快捷问题
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK.map((c) => (
                  <button
                    key={c.q}
                    onClick={() => ask(c.q)}
                    className="group flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 text-left text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <c.icon size={16} className="text-blue-500 transition group-hover:scale-110" />
                    {c.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => {
            const parts = (m.parts ?? []) as Part[];
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={`msg-in mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] ${isUser ? "" : "w-full"}`}>
                  {/* 工具调用步骤可视化 */}
                  {parts
                    .filter((p) => p.type === "tool-invocation")
                    .map((p, i) => (
                      <div
                        key={i}
                        className="mb-1.5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-xs text-amber-700"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] text-white">{i + 1}</span>
                        <Wrench size={12} className={p.state?.status === "result" ? "" : "animate-spin"} />
                        <span>Agent 调度工具</span>
                        <code className="rounded bg-amber-100 px-1 font-mono">{p.toolName}</code>
                        {p.state?.status === "result" ? (
                          <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} />完成</span>
                        ) : (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                      </div>
                    ))}

                  {/* 文本 */}
                  {textOf(parts) && (
                    <div
                      className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? "rounded-br-md bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200"
                          : "rounded-bl-md bg-white/90 text-slate-800 shadow-sm"
                      }`}
                    >
                      {textOf(parts)}
                      {busy && !isUser && <span className="cursor" />}
                    </div>
                  )}

                  {/* 溯源徽标 */}
                  {!isUser && textOf(parts) && !busy && /参考来源/.test(textOf(parts)) && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-blue-500">
                      <ShieldCheck size={11} /> 已附制度原文溯源，可展开核对
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {busy && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              正在检索知识库并规划执行…
            </div>
          )}

          {error && (
            <div className="msg-in mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              请求出错了：{error.message || "网络或模型服务异常"}
              <button onClick={() => reload()} className="ml-3 underline">点击重试</button>
            </div>
          )}
        </div>

        {/* 输入区 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="glass mt-4 flex items-end gap-2 rounded-3xl p-2 shadow-lg shadow-blue-100/50"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={2}
            placeholder="输入人事问题，或点麦克风语音提问…"
            className="flex-1 resize-none bg-transparent p-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={toggleRecord}
            title="语音输入"
            className={`rounded-2xl p-2.5 transition hover:scale-110 active:scale-90 ${
              recording ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {recording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 text-white shadow-md shadow-blue-200 transition hover:scale-110 active:scale-90 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
