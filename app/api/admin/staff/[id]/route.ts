import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdminStaffError, updateManagedStaff } from "@/lib/admin-staff";
import { requireAdminUser } from "@/lib/staff-auth";
import { hasCanonicalOrigin } from "@/lib/request-security";
import { logServerFailure } from "@/lib/safe-server-log";
const actionSchema = z.object({ action: z.enum(["APPROVE", "REJECT", "DISABLE", "REENABLE"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const admin = await requireAdminUser(); if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); if (!hasCanonicalOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 }); const parsed = actionSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid account action." }, { status: 400 }); const staff = await updateManagedStaff((await params).id, parsed.data.action, admin.id); return NextResponse.json({ staff }); } catch (error) { if (error instanceof AdminStaffError) return NextResponse.json({ error: "Unable to update the staff account." }, { status: error.statusCode }); logServerFailure("admin.staff.update", error); return NextResponse.json({ error: "Unable to update the staff account." }, { status: 503 }); } }
