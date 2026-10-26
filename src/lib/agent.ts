// Agent 核心：RAG 检索 → 分层提示词 → 结构化工具调用（最多 3 步）→ 流式输出
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, stepCountIs } from "ai";
import { retrieve } from "./rag";
import { buildAiTools } from "./tools";

const openai = createOpenAI({
  // 统一走智谱 OpenAI 兼容端点：对话 glm-4-flash（免费、支持工具调用）+ embedding-3
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.ZHIPU_API_KEY,
});

export async function runAgent(userQuery: string) {
  // 1) RAG 检索，拿到带溯源的上下文
  const docs = await retrieve(userQuery, 3);
  const context = docs.map((d) => d.text).join("\n\n----\n\n");
  const sources = docs
    .map((d, i) => `[参考${i + 1}] 来源：${d.source}`)
    .join("\n");

  const system = `你是【知枢Agent】，面向中小企业行政人事的企业文档智能流程助手。

## 工作规则（任务规划）
1. 必须优先参考下方【知识库上下文】回答人事制度问题；回答末尾用“参考来源”列出依据文件名。
2. 知识库没有明确说明的内容，只回答一句："公司制度暂未明确。"，不要追加任何解释、建议或客套话。
3. 当用户需要生成入职登记表、人事待办清单、做制度合规校验时，必须调用提供的工具，不要手写替代。
   做合规校验时，调用 check_rule 后必须结合上方【知识库上下文】明确给出"对/错/部分对"的判断和依据，禁止只复述"已完成检查"。
4. 多步骤任务自动分步完成（先检索制度，再按需调用工具）。
5. 输出简洁、可执行，面向行政人事同事。

【知识库上下文】
${context || "（知识库暂无相关内容）"}

${sources}`;

  return streamText({
    model: openai.chat("glm-4-flash"),
    system,
    prompt: userQuery,
    tools: buildAiTools(),
    stopWhen: stepCountIs(3), // 多步工具循环，体现 Agent 规划-执行能力
    temperature: 0.2,
  });
}
