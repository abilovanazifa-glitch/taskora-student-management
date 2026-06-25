import { NextResponse } from "next/server";
import { runScheduledJobs } from "@/lib/reminders/processor";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runScheduledJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
