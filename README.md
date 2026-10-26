# 知枢 Agent —— 基于 MCP 思想的企业文档智能流程助手

> 传智杯 · 全国高校 AI Web 开发挑战赛（B 组）参赛作品
> 面向中小企业行政人事：私有文档 RAG 知识库 + 任务规划 Agent + 标准化工具调用链

---

## 一、项目定位

中小企业普遍没有专职知识管理系统，人事/行政同事每天要在零散的制度文档、表单、待办之间来回翻找。**知枢 Agent** 把企业内部制度文档变成可问答、可溯源的私有知识库，并由 Agent 自动拆解人事流程、调用标准化工具生成表单与待办，回答必须基于制度原文、标注来源，不幻觉。

## 二、核心功能（对应评分点）

| 能力 | 说明 | 对应评分项 |
|---|---|---|
| RAG 文档检索溯源 | 制度文档切片向量化，问答召回相关片段并在回答末尾标注来源文件 | RAG 技术应用 6% |
| Agent 任务规划 | 分层系统提示词 + 多步工具循环（maxSteps=3），自动拆解多步人事任务 | Agent/工作流 8% |
| MCP 风格工具链 | 工具统一注册（name/description/JSON Schema 参数/handler），结构化调度 | MCP/工具集成 4% |
| 大模型分层提示词 | 系统提示词嵌入知识库上下文与安全规则，输出稳定可控 | 大模型集成质量 8% |
| 可解释 / 不编造 | 知识库无依据时明确告知"制度未明确"，禁止幻觉 | AI 安全与可控 4% |
| 语音输入 | 浏览器原生 Web Speech API 语音提问 | 多模态能力 5% |

## 三、技术栈

- 前端：Next.js 16 (App Router) + TypeScript + Tailwind CSS
- AI 集成：Vercel AI SDK（`ai` / `@ai-sdk/react` `useChat` 流式对话）
- 对话模型：智谱 `glm-4-flash`（免费、原生支持工具调用，OpenAI 兼容接口）
- 向量 Embedding：智谱 `embedding-3`（与对话模型共用一个智谱 key）
- 向量检索：轻量本地向量库（内存 + JSON 持久化，余弦相似度），零外部服务依赖
- 文档解析：`.txt/.md` 直读并支持用户上传；PDF（pdf-parse）/ Word（mammoth）为预留扩展点

## 四、目录结构

```
src/
  app/
    page.tsx                 # 对话主页（流式对话 + 语音 + 导入按钮）
    api/agent/route.ts       # Agent 流式接口
    api/ingest/route.ts      # 知识库导入接口
  lib/
    embedding.ts             # 智谱 embedding 封装
    vectorStore.ts           # 本地向量库（切片存储 + 余弦检索）
    rag.ts                   # 文档解析/切片/检索溯源
    tools.ts                 # MCP 风格工具注册层
    agent.ts                 # RAG + 提示词 + 工具调用编排
sample_docs/                 # 样例人事制度文档
```

## 五、运行步骤

1. 安装依赖：
   ```bash
   npm install
   ```
2. 复制环境变量模板并填入密钥：
   ```bash
   cp .env.local.example .env.local
   ```
   - 只需一个 `ZHIPU_API_KEY`：智谱 BigModel 申请（https://open.bigmodel.cn/），同时用于对话 `glm-4-flash` 和向量 `embedding-3`
3. 启动：
   ```bash
   npm run dev
   ```
4. 浏览器（推荐 Chrome，语音识别需要）打开 http://localhost:3000
5. 首次对话会自动导入 `sample_docs/` 下的制度文档；也可点右上角"导入制度文档"手动重建索引。

## 六、演示用例

- `给张三，技术部，工程师生成一份入职登记表` → Agent 调用 `generate_entry_form` 工具
- `帮我列一份入职流程的待办清单` → 调用 `generate_todo_list`
- `试用期最长是多久？转正要走哪些手续？` → RAG 召回制度原文并溯源
- 点麦克风语音提问 → 多模态输入

## 七、分工

- 前端：知识库管理面板、对话面板、语音输入、状态可视化
- AI 核心：RAG 切片入库、Agent 任务规划、MCP 工具封装与调度
- 产品/文档：样例制度文档、演示视频、技术报告与答辩
