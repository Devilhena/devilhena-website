import { redirect } from "next/navigation";
import { requireStaffUser } from "@/lib/staff-auth";
import { OrderHistory } from "@/components/staff/OrderHistory";
export const dynamic = "force-dynamic";
export default async function OrderHistoryPage() { if (!(await requireStaffUser())) redirect("/staff/login"); return <OrderHistory />; }
