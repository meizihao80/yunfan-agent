import { runAgent } from "@/lib/agent";
import { updateAnswer } from "@/lib/stats";

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");

  // 兼容新旧消息格式：新版文本在 parts[].text，旧版在 content
  let query = "";
  if (typeof lastUser?.content === "string") {
    query = lastUser.content;
  } else if (Array.isArray(lastUser?.parts)) {
    query = lastUser.parts
      .filter((p: any) => p.type === "text" && p.text)
      .map((p: any) => p.text)
      .join("");
  }

  if (!query.trim()) {
    return new Response("empty query", { status: 400 });
  }
  const result = await runAgent(query);
  result.text.then((t: string) => updateAnswer(t)).catch(() => {});
  return result.toUIMessageStreamResponse();
}
