import { redirect } from "next/navigation";
import { requireAdminUser } from "@/lib/staff-auth";
import { AdminOrders } from "@/components/admin/AdminOrders";
export const dynamic = "force-dynamic";
export default async function AdminOrdersPage() { if (!(await requireAdminUser())) redirect("/admin/login"); return <AdminOrders />; }
