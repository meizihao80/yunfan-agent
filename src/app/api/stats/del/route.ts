import { NextRequest, NextResponse } from "next/server";
import { deleteAt, getStats } from "@/lib/stats";

export async function POST(req: NextRequest) {
  const { ts } = await req.json();
  if (typeof ts === "number") deleteAt(ts);
  return NextResponse.json(getStats());
}
