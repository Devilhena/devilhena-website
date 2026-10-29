import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEmailNotificationSettings, saveEmailNotificationSettings } from "@/lib/order-email-notifications";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";
import { requireAdminUser } from "@/lib/staff-auth";

const group = z.object({ enabled: z.boolean(), recipients: z.array(z.string().trim().email().max(254)).max(20) });
const settings = z.object({ MANAGEMENT: group, KITCHEN: group, BAR: group });

export async function GET() {
  try {
    if (!(await requireAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    return NextResponse.json({ settings: await getEmailNotificationSettings() });
  } catch (error) {
    logServerFailure("admin.email-notifications.get", error);
    return NextResponse.json({ error: "Email notification settings are temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!(await requireAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    const parsed = settings.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid email notification settings." }, { status: 400 });
    return NextResponse.json({ settings: await saveEmailNotificationSettings(parsed.data) });
  } catch (error) {
    logServerFailure("admin.email-notifications.save", error);
    return NextResponse.json({ error: "Unable to save email notification settings." }, { status: 503 });
  }
}
