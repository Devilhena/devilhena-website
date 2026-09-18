import { NextResponse } from "next/server";
import { getManagedStaff } from "@/lib/admin-staff";
import { requireAdminUser } from "@/lib/staff-auth";
import { logServerFailure } from "@/lib/safe-server-log";
export async function GET() { try { if (!(await requireAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); return NextResponse.json(await getManagedStaff()); } catch (error) { logServerFailure("admin.staff.list", error); return NextResponse.json({ error: "Unable to load staff. Please try again later." }, { status: 503 }); } }
