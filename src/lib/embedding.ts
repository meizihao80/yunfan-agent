// 智谱 embedding-3 封装（OpenAI 兼容风格，直接 fetch，零额外依赖）
// 解决 DeepSeek 不提供 embedding 接口的问题
const ZHIPU_BASE = "https://open.bigmodel.cn/api/paas/v4";

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) throw new Error("缺少 ZHIPU_API_KEY，请在 .env.local 配置");
  const model = process.env.ZHIPU_EMBED_MODEL || "embedding-3";

  const res = await fetch(`${ZHIPU_BASE}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`智谱 embedding 失败 ${res.status}: ${txt}`);
  }
  const data = await res.json();
  // 返回顺序与 input 一致
  return (data.data as { embedding: number[] }[]).map((d) => d.embedding);
}

export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}
