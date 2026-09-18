import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AdminStaffError, updateManagedStaff } from "@/lib/admin-staff";
import { requireAdminUser } from "@/lib/staff-auth";
const actionSchema = z.object({ action: z.enum(["APPROVE", "REJECT", "DISABLE", "REENABLE"]) });
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { try { const admin = await requireAdminUser(); if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); const parsed = actionSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid account action." }, { status: 400 }); const staff = await updateManagedStaff((await params).id, parsed.data.action, admin.id); return NextResponse.json({ staff }); } catch (error) { if (error instanceof AdminStaffError) return NextResponse.json({ error: error.message }, { status: error.statusCode }); return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update staff account." }, { status: 503 }); } }
