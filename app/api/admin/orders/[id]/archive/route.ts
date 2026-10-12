import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminUser } from "@/lib/staff-auth";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { archiveOrder, StaffOrderError } from "@/lib/staff-orders";
const input = z.object({ reason: z.string().trim().min(3).max(500) });
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const admin = await requireAdminUser(); if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 }); const parsed = input.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "An archive reason is required." }, { status: 400 }); try { return NextResponse.json(await archiveOrder((await params).id, admin.id, parsed.data.reason)); } catch (error) { return NextResponse.json({ error: "Unable to archive this order." }, { status: error instanceof StaffOrderError ? error.statusCode : 503 }); } }
