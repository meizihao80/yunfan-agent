import fs from "fs";
import path from "path";
import { embedTexts } from "./src/lib/embedding.ts";

const p = path.join(process.cwd(), "data", "knowledge.json");
const d = JSON.parse(fs.readFileSync(p, "utf8"));

const goodText = `办公设备管理制度
1. 员工领用办公设备（电脑、显示器、键盘、鼠标）需在行政部登记签字。
2. 设备损坏需在24小时内报行政部，人为损坏按维修价赔偿。
3. 下班须关闭电脑和显示器电源，节约用电。
4. 不得私自拆卸、改装办公设备。
5. 离职时须将全部办公设备交还行政部，办理交接手续。`;

const targets = d.filter((c: any) => c.source === "新制度-办公设备管理.pdf");
const vecs = await embedTexts(targets.map(() => goodText));
targets.forEach((c: any, i: number) => {
  c.text = goodText;
  c.vector = vecs[i];
});
fs.writeFileSync(p, JSON.stringify(d));
console.log("done", targets.length);
