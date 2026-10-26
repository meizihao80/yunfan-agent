import { NextResponse } from "next/server";
import { clearStats } from "@/lib/stats";

export async function POST() {
  clearStats();
  return NextResponse.json({ ok: true });
}
