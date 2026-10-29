import { NextRequest, NextResponse } from "next/server";
import { dispatchDueOrderEmails } from "@/lib/order-email-notifications";
import { logServerFailure } from "@/lib/safe-server-log";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    return NextResponse.json(await dispatchDueOrderEmails());
  } catch (error) {
    logServerFailure("cron.order-email-notifications", error);
    return NextResponse.json({ error: "Notification delivery is temporarily unavailable." }, { status: 503 });
  }
}
