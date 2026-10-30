import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  emailRecipientGroups,
  sendEmailNotificationTest,
} from "@/lib/order-email-notifications";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";
import { requireAdminUser } from "@/lib/staff-auth";

const input = z.object({ group: z.enum(emailRecipientGroups) });

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!hasCanonicalOrigin(request)) {
      return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
    }

    const allowed = await enforceRateLimit("admin.email-notification-test", [
      { name: "ip", value: trustedClientIp(request), limit: 10, windowSeconds: 60 * 60 },
      { name: "admin", value: admin.id, limit: 10, windowSeconds: 60 * 60 },
    ]);

    if (!allowed) {
      return NextResponse.json({ error: "Too many test email requests. Please try again later." }, { status: 429 });
    }

    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid notification group." }, { status: 400 });
    }

    return NextResponse.json(await sendEmailNotificationTest(parsed.data.group));
  } catch (error) {
    logServerFailure("admin.email-notifications.test", error);
    return NextResponse.json(
      { error: "Unable to send a test email. Confirm the sender and Resend configuration, then try again." },
      { status: 503 },
    );
  }
}
