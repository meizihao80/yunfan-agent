"use client";

import { Wrench, UserPlus, ListChecks, ShieldCheck, ArrowRight } from "lucide-react";

const TOOLS = [
  {
    name: "generate_entry_form",
    icon: UserPlus,
    desc: "根据公司人事制度，生成员工入职登记表文本",
    params: ["staff_name: 员工姓名", "dept: 所属部门", "post: 岗位"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "generate_todo_list",
    icon: ListChecks,
    desc: "按流程类型（入职/离职/转正）生成人事待办清单",
    params: ["flow_type: 入职 / 离职 / 转正"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "check_rule",
    icon: ShieldCheck,
    desc: "对待校验的人事内容做合规检查，提示对照制度复核",
    params: ["content: 待校验内容"],
    color: "from-amber-500 to-orange-500",
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-[80vh]">
      <h1 className="mb-1 text-xl font-bold text-slate-800">MCP 工具广场</h1>
      <p className="mb-4 text-sm text-slate-500">
        借鉴 Model Context Protocol：工具名 / 描述 / JSON-Schema 参数 / 执行函数统一注册，Agent 按描述自主调度。
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TOOLS.map((t) => (
          <div
            key={t.name}
            className="group glass rounded-3xl p-4 shadow transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${t.color} text-white shadow-md transition group-hover:scale-110`}>
              <t.icon size={20} />
            </div>
            <code className="text-xs font-mono text-slate-700">{t.name}</code>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{t.desc}</p>
            <div className="mt-3 border-t border-dashed border-slate-200 pt-2">
              <div className="mb-1 text-[10px] font-semibold text-slate-400">参数 Schema</div>
              {t.params.map((p) => (
                <div key={p} className="text-[11px] font-mono text-slate-500">· {p}</div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass mt-4 rounded-3xl p-4 shadow">
        <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
          <Wrench size={16} className="text-amber-500" /> 调度链路
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded-xl bg-blue-50 px-3 py-1.5">用户自然语言</span>
          <ArrowRight size={14} />
          <span className="rounded-xl bg-blue-50 px-3 py-1.5">RAG 检索制度</span>
          <ArrowRight size={14} />
          <span className="rounded-xl bg-amber-50 px-3 py-1.5">LLM 判断是否需调工具</span>
          <ArrowRight size={14} />
          <span className="rounded-xl bg-emerald-50 px-3 py-1.5">结构化 JSON 参数调用</span>
          <ArrowRight size={14} />
          <span className="rounded-xl bg-emerald-50 px-3 py-1.5">结果 + 溯源返回</span>
        </div>
      </div>
    </div>
  );
}
