// MCP 风格工具注册层：统一 name / description / JSON-Schema 参数 / handler
// 借鉴 Model Context Protocol 的工具元数据描述与注册调度思想，
// 工具定义与 Agent 业务逻辑解耦，可统一发现、扩展、调度。
import { tool, zodSchema } from "ai";
import { z } from "zod";

export type McpToolDef = {
  name: string;
  description: string;
  handler: (args: Record<string, any>) => Promise<string>;
};

const generateEntryForm: McpToolDef = {
  name: "generate_entry_form",
  description: "根据公司人事制度，生成员工入职登记表文本",
  handler: async (args) =>
    [
      "===== 员工入职登记表 =====",
      `姓名：${args.staff_name}`,
      `部门：${args.dept}`,
      `岗位：${args.post}`,
      `登记日期：${new Date().toLocaleDateString("zh-CN")}`,
      "材料清单：身份证复印件、学历证明、银行卡信息、紧急联系人信息",
      "--------------------------",
      "请人事核对材料并存档。",
    ].join("\n"),
};

const generateTodoList: McpToolDef = {
  name: "generate_todo_list",
  description: "根据流程类型（入职/离职/转正）生成人事工作待办清单",
  handler: async (args) => {
    const t = String(args.flow_type);
    if (t.includes("离职"))
      return "离职待办：1.提交离职申请 2.工作交接 3.办公资产回收 4.系统权限注销 5.薪资结算 6.离职证明开具";
    if (t.includes("转正"))
      return "转正待办：1.收集转正申请 2.直属主管评价 3.部门审批 4.薪资调整归档 5.更新员工台账";
    return "入职待办：1.收集入职材料 2.录入员工台账 3.开通办公账号 4.安排工位 5.发送新人培训通知";
  },
};

const checkRule: McpToolDef = {
  name: "check_rule",
  description: "对待校验的人事内容做合规检查，结合知识库制度给出对/错/部分对判断",
  handler: async (args) =>
    `【制度校验结果】\n待校验内容：${args.content}\n请结合上方知识库制度上下文给出明确判断（对/错/部分对）和依据。`,
};

export const MCP_TOOLS: McpToolDef[] = [
  generateEntryForm,
  generateTodoList,
  checkRule,
];

// 转换为 Vercel AI SDK 的 tool（JSON Schema 参数校验，结构化工具调用）
export function buildAiTools() {
  return {
    generate_entry_form: tool({
      description: generateEntryForm.description,
      inputSchema: zodSchema(
        z.object({
          staff_name: z.string().describe("员工姓名"),
          dept: z.string().describe("所属部门"),
          post: z.string().describe("岗位"),
        })
      ),
      execute: async (args) => ({ text: await generateEntryForm.handler(args) }),
    }),
    generate_todo_list: tool({
      description: generateTodoList.description,
      inputSchema: zodSchema(
        z.object({
          flow_type: z.string().describe("流程类型：入职 / 离职 / 转正"),
        })
      ),
      execute: async (args) => ({ text: await generateTodoList.handler(args) }),
    }),
    check_rule: tool({
      description: checkRule.description,
      inputSchema: zodSchema(
        z.object({
          content: z.string().describe("待校验的人事填写内容"),
        })
      ),
      execute: async (args) => ({ text: await checkRule.handler(args) }),
    }),
  };
}
