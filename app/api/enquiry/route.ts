import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/validation";

const recipient = "devilhena206@gmail.com";

export async function POST(request: Request) {
  const result = enquirySchema.safeParse(await request.json());

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
