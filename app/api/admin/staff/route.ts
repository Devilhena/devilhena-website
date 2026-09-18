import { NextResponse } from "next/server";
import { getManagedStaff } from "@/lib/admin-staff";
import { requireAdminUser } from "@/lib/staff-auth";
export async function GET() { try { if (!(await requireAdminUser())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 }); return NextResponse.json(await getManagedStaff()); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load staff." }, { status: 503 }); } }
