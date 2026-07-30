import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminSalesReport } from "@/components/admin/AdminSalesReport";

export const Route = createFileRoute("/admin/reports")({ component: () => <AdminLayout><AdminSalesReport /></AdminLayout> });
