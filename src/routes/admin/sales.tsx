import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSalesReport } from "@/components/admin/AdminSalesReport";

export const Route = createFileRoute("/admin/sales")({ component: () => <AdminLayout><AdminSalesReport /></AdminLayout> });
