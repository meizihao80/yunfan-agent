import { runAgent } from "@/lib/agent";
import { updateAnswer, loadStats } from "@/lib/stats";
import fs from "fs";
import path from "path";
const FILE = path.join(process.cwd(), "data", "stats.json");

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages ?? [];
  const lastUser = [...messages].reverse().find((m: any) => m.role === "user");

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
  result.text.then((t: string) => {
    updateAnswer(t);
    try {
      const cited = !t.includes("公司制度暂未明确");
      const all = loadStats();
      if (all.length) {
        all[all.length - 1].hasSource = cited;
        fs.writeFileSync(FILE, JSON.stringify(all));
      }
    } catch {}
  }).catch(() => {});
  return result.toUIMessageStreamResponse();
}
