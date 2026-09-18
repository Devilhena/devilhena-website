import { NextRequest, NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation";
import { enforceRateLimit, trustedClientIp } from "@/lib/rate-limit";

const recipient = "devilhena206@gmail.com";

export async function POST(request: NextRequest) {
  try { if (!(await enforceRateLimit("enquiry", [{ name: "ip", value: trustedClientIp(request), limit: 8, windowSeconds: 900 }]))) return NextResponse.json({ error: "Too many enquiries. Please try again later." }, { status: 429 }); } catch { return NextResponse.json({ error: "Enquiries are temporarily unavailable." }, { status: 503 }); }
  const result = enquirySchema.safeParse(await request.json().catch(() => null));

  if (!result.success) {
    return NextResponse.json({ error: "Invalid enquiry" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${recipient}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...result.data,
        _subject: `New De Vilhena enquiry from ${result.data.name}`,
        _replyto: result.data.email,
        _template: "table",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`FormSubmit returned ${response.status}`);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to send enquiry" },
      { status: 502 },
    );
  }
}
